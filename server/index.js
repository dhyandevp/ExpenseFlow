import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { Webhook } from "svix";
import { ClerkExpressRequireAuth, clerkClient } from "@clerk/clerk-sdk-node";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ── Firebase Admin Setup ─────────────────────────────────────
let adminApp;
if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, "base64").toString("utf-8")
  );
  adminApp = initializeApp({
    credential: cert(serviceAccount)
  });
} else {
  console.warn("FIREBASE_SERVICE_ACCOUNT_B64 not provided. Auth bridge will fail.");
}

const db = adminApp ? getFirestore(adminApp) : null;
const auth = adminApp ? getAuth(adminApp) : null;

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL || false
    : ["http://localhost:5173", "http://0.0.0.0:5173"],
  credentials: true,
}));

// We need raw body for the Clerk webhook signature verification
app.use('/api/auth/clerk-webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// ── Rate Limiting ────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts
  message: { success: false, message: "Too many authentication attempts. Please try again later." }
});

// ── Clerk Webhook ────────────────────────────────────────────
app.post("/api/auth/clerk-webhook", async (req, res) => {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!SIGNING_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET");
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  const payload = req.body;
  const headers = req.headers;

  const wh = new Webhook(SIGNING_SECRET);
  let evt;
  
  try {
    evt = wh.verify(payload, {
      "svix-id": headers["svix-id"],
      "svix-timestamp": headers["svix-timestamp"],
      "svix-signature": headers["svix-signature"],
    });
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }

  if (evt.type === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    const email = email_addresses && email_addresses.length > 0 ? email_addresses[0].email_address : "";
    const name = [first_name, last_name].filter(Boolean).join(" ") || "Unknown User";

    try {
      if (db) {
        await db.collection("users").doc(id).set({
          email,
          name,
          image_url,
          created_at: new Date().toISOString()
        });
        console.log(`User ${id} seeded to Firestore users collection`);
      }
    } catch (err) {
      console.error("Failed to seed user to Firestore", err);
      // Still return 200 to Clerk so it doesn't retry endlessly
    }
  }

  return res.status(200).json({ success: true });
});

// ── JWT Bridge ───────────────────────────────────────────────
app.post("/api/auth/jwt-bridge", authLimiter, async (req, res) => {
  if (!auth || !db) {
    return res.status(500).json({ success: false, message: "Firebase Admin not configured" });
  }

  const { type } = req.body;

  try {
    if (type === "clerk") {
      // Frontend sends the Clerk Session ID and Token to verify
      const { sessionId, sessionToken, userId } = req.body;
      
      if (!sessionId || !sessionToken || !userId) {
        return res.status(400).json({ success: false, message: "Missing Clerk session details" });
      }

      // Verify the session with Clerk
      try {
        const session = await clerkClient.sessions.getSession(sessionId);
        if (!session || session.userId !== userId) {
          throw new Error("Invalid session");
        }
      } catch (err) {
        return res.status(401).json({ success: false, message: "Clerk session verification failed" });
      }

      // Issue Firebase Custom Token
      const customToken = await auth.createCustomToken(userId);
      return res.json({ success: true, token: customToken });

    } else if (type === "guest") {
      const { code, pin } = req.body;
      
      if (!code || !pin) {
        return res.status(400).json({ success: false, message: "Missing code or pin" });
      }

      // Lookup group by code
      const snapshot = await db.collection("groups").where("code", "==", code).limit(1).get();
      if (snapshot.empty) {
        return res.status(404).json({ success: false, message: "Group not found" });
      }

      const groupDoc = snapshot.docs[0];
      const groupData = groupDoc.data();

      if (groupData.pin !== pin) {
        return res.status(401).json({ success: false, message: "Invalid PIN" });
      }

      // Generate a deterministic Guest ID for this device session
      // For simplicity, we just generate a random one per login
      const guestId = `guest_${Math.random().toString(36).substring(2, 15)}`;
      
      // Issue custom token with claims
      const customToken = await auth.createCustomToken(guestId, {
        guestGroupId: groupDoc.id,
        mode: "guest"
      });

      return res.json({ success: true, token: customToken, groupId: groupDoc.id });
    } else {
      return res.status(400).json({ success: false, message: "Invalid auth type" });
    }
  } catch (err) {
    console.error("JWT Bridge Error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── Health Check ─────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "ExpenseFlow Auth Bridge is running 🌿",
    environment: process.env.NODE_ENV || "development",
  });
});

// ── Serve React Build in Production ──────────────────────────
if (process.env.NODE_ENV === "production") {
  const clientBuildPath = path.join(__dirname, "..", "client", "dist");
  app.use(express.static(clientBuildPath));

  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(clientBuildPath, "index.html"));
    }
  });
}

// ── Start Server ─────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`
  🌿 ExpenseFlow Auth Bridge
  ──────────────────────────
  Port:       ${PORT}
  Environment: ${process.env.NODE_ENV || "development"}
  `);
});
