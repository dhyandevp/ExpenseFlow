import { describe, it, beforeAll, afterAll, beforeEach } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";
import { resolve } from "path";

let testEnv;

beforeAll(async () => {
  // Load the rules file
  const rules = readFileSync(resolve(__dirname, "../firestore.rules"), "utf8");
  
  testEnv = await initializeTestEnvironment({
    projectId: "expenseflow-test",
    firestore: {
      rules,
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("Firestore Security Rules", () => {
  
  // Unauthenticated user
  const unauthDb = () => testEnv.unauthenticatedContext().firestore();
  
  // Clerk Authenticated user (no guest token)
  const clerkDb = (uid) => testEnv.authenticatedContext(uid, {}).firestore();
  
  // Guest user (has guestGroupId claim)
  const guestDb = (uid, groupId) => testEnv.authenticatedContext(uid, { guestGroupId: groupId }).firestore();

  describe("Groups", () => {
    it("Unauthenticated user cannot create a group", async () => {
      const db = unauthDb();
      await assertFails(db.collection("groups").doc("group1").set({ name: "Test Group" }));
    });

    it("Clerk user can create a group", async () => {
      const db = clerkDb("user1");
      await assertSucceeds(db.collection("groups").doc("group1").set({ name: "Test Group" }));
    });

    it("Guest user cannot create a group", async () => {
      const db = guestDb("guest1", "group1");
      await assertFails(db.collection("groups").doc("group2").set({ name: "Test Group" }));
    });

    it("Guest user can read their assigned group", async () => {
      const db = guestDb("guest1", "group1");
      await assertSucceeds(db.collection("groups").doc("group1").get());
    });

    it("Guest user cannot read a different group", async () => {
      const db = guestDb("guest1", "group1");
      await assertFails(db.collection("groups").doc("group2").get());
    });
  });

  describe("Expenses", () => {
    it("Unauthenticated user cannot read expenses", async () => {
      const db = unauthDb();
      await assertFails(db.collection("expenses").doc("exp1").get());
    });

    it("Clerk user can read expenses for a group", async () => {
      // Setup data bypassing rules
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection("expenses").doc("exp1").set({ group_id: "group1", amount: 100 });
      });

      const db = clerkDb("user1");
      await assertSucceeds(db.collection("expenses").doc("exp1").get());
    });

    it("Guest user can create an expense in their assigned group", async () => {
      const db = guestDb("guest1", "group1");
      await assertSucceeds(db.collection("expenses").doc("exp2").set({ group_id: "group1", amount: 50 }));
    });

    it("Guest user cannot create an expense in a different group", async () => {
      const db = guestDb("guest1", "group1");
      await assertFails(db.collection("expenses").doc("exp3").set({ group_id: "group2", amount: 50 }));
    });
  });
});
