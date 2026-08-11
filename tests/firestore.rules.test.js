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
    it("Unauthenticated user cannot read a group", async () => {
      const db = unauthDb();
      await assertFails(db.collection("groups").doc("group1").get());
    });

    it("Unauthenticated user cannot create a group", async () => {
      const db = unauthDb();
      await assertFails(db.collection("groups").doc("group1").set({ name: "Test Group", allowedUsers: ["user1"] }));
    });

    it("Clerk user can create a group", async () => {
      const db = clerkDb("user1");
      await assertSucceeds(db.collection("groups").doc("group1").set({ name: "Test Group", allowedUsers: ["user1"] }));
    });

    it("Guest user cannot create a group", async () => {
      const db = guestDb("guest1", "group1");
      await assertFails(db.collection("groups").doc("group2").set({ name: "Test Group", allowedUsers: ["guest1"] }));
    });

    it("Guest user can read their assigned group", async () => {
      const db = guestDb("guest1", "group1");
      await assertSucceeds(db.collection("groups").doc("group1").get());
    });

    it("Guest user cannot read a different group", async () => {
      const db = guestDb("guest1", "group1");
      await assertFails(db.collection("groups").doc("group2").get());
    });

    it("Updating restricted fields on a group fails for users", async () => {
      const db = clerkDb("user1");
      
      // Setup initial document bypassing rules
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection("groups").doc("group3").set({ name: "Group 3", currentBalances: {}, allowedUsers: ["user1"] });
      });

      // Try to update restricted field
      await assertFails(db.collection("groups").doc("group3").update({ currentBalances: { "user1": 100 } }));
      
      // Try to update non-restricted field should succeed
      await assertSucceeds(db.collection("groups").doc("group3").update({ name: "Group 3 Updated" }));
    });
  });

  describe("Subcollections (Expenses & Settlements)", () => {
    beforeEach(async () => {
      // Setup test group
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await db.collection("groups").doc("group1").set({ name: "Group 1", allowedUsers: ["user1"] });
        await db.collection("groups").doc("group2").set({ name: "Group 2", allowedUsers: ["user2"] });
      });
    });

    it("Unauthenticated user cannot read expenses", async () => {
      const db = unauthDb();
      await assertFails(db.collection("groups").doc("group1").collection("expenses").doc("exp1").get());
    });

    it("Clerk user can read expenses for their group", async () => {
      const db = clerkDb("user1");
      await assertSucceeds(db.collection("groups").doc("group1").collection("expenses").doc("exp1").get());
    });

    it("Guest user can create an expense in their assigned group", async () => {
      const db = guestDb("guest1", "group1");
      await assertSucceeds(db.collection("groups").doc("group1").collection("expenses").doc("exp2").set({ amount: 50 }));
    });

    it("Guest user cannot create an expense in a different group", async () => {
      const db = guestDb("guest1", "group1");
      await assertFails(db.collection("groups").doc("group2").collection("expenses").doc("exp3").set({ amount: 50 }));
    });

    it("Settlements cannot be edited or deleted by anyone", async () => {
      const db = clerkDb("user1");
      // Creating should work
      await assertSucceeds(db.collection("groups").doc("group1").collection("settlements").doc("set1").set({ amount: 100 }));
      // Updating should fail
      await assertFails(db.collection("groups").doc("group1").collection("settlements").doc("set1").update({ amount: 150 }));
      // Deleting should fail
      await assertFails(db.collection("groups").doc("group1").collection("settlements").doc("set1").delete());
    });
  });
});
