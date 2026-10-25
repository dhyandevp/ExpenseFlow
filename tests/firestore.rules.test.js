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
  if (testEnv) await testEnv.clearFirestore();
});

afterAll(async () => {
  if (testEnv) await testEnv.cleanup();
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
      await assertFails(db.collection("groups").doc("group1").set({
        name: "Test Group",
        createdBy: "user1",
        memberUserIds: ["user1"]
      }));
    });

    it("Clerk user can create a group with self as createdBy and member", async () => {
      const db = clerkDb("user1");
      await assertSucceeds(db.collection("groups").doc("group1").set({
        name: "Test Group",
        createdBy: "user1",
        memberUserIds: ["user1"]
      }));
    });

    it("Clerk user cannot create a group with mismatched createdBy", async () => {
      const db = clerkDb("user1");
      await assertFails(db.collection("groups").doc("group1").set({
        name: "Test Group",
        createdBy: "user2",
        memberUserIds: ["user1"]
      }));
    });

    it("Clerk user cannot create a group without self in memberUserIds", async () => {
      const db = clerkDb("user1");
      await assertFails(db.collection("groups").doc("group1").set({
        name: "Test Group",
        createdBy: "user1",
        memberUserIds: ["user2"]
      }));
    });

    it("Guest user cannot create a group", async () => {
      const db = guestDb("guest1", "group1");
      await assertFails(db.collection("groups").doc("group2").set({
        name: "Test Group",
        createdBy: "guest1",
        memberUserIds: ["guest1"]
      }));
    });

    it("Guest user can read their assigned group", async () => {
      const db = guestDb("guest1", "group1");
      await assertSucceeds(db.collection("groups").doc("group1").get());
    });

    it("Guest user cannot read a different group", async () => {
      const db = guestDb("guest1", "group1");
      await assertFails(db.collection("groups").doc("group2").get());
    });

    it("Clerk user cannot read a group they are not a member of", async () => {
      const db = clerkDb("user1");
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection("groups").doc("group_private").set({
          name: "Private Group",
          createdBy: "user2",
          memberUserIds: ["user2"]
        });
      });
      await assertFails(db.collection("groups").doc("group_private").get());
    });

    it("Updating restricted fields on a group fails for users", async () => {
      const db = clerkDb("user1");

      // Setup initial document bypassing rules
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection("groups").doc("group3").set({
          name: "Group 3",
          currentBalances: {},
          createdBy: "user1",
          memberUserIds: ["user1"]
        });
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
        await db.collection("groups").doc("group1").set({
          name: "Group 1",
          createdBy: "user1",
          memberUserIds: ["user1"]
        });
        await db.collection("groups").doc("group2").set({
          name: "Group 2",
          createdBy: "user2",
          memberUserIds: ["user2"]
        });
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

    it("Clerk user cannot read expenses for a group they are not a member of", async () => {
      const db = clerkDb("user1");
      await assertFails(db.collection("groups").doc("group2").collection("expenses").doc("exp1").get());
    });

    it("Guest user can create an expense in their assigned group", async () => {
      const db = guestDb("guest1", "group1");
      await assertSucceeds(db.collection("groups").doc("group1").collection("expenses").doc("exp2").set({ amount: 50 }));
    });

    it("Guest user cannot create an expense in a different group", async () => {
      const db = guestDb("guest1", "group1");
      await assertFails(db.collection("groups").doc("group2").collection("expenses").doc("exp3").set({ amount: 50 }));
    });

    it("Settlements cannot be edited, but can be deleted by group members", async () => {
      const db = clerkDb("user1");
      // Creating should work
      await assertSucceeds(db.collection("groups").doc("group1").collection("settlements").doc("set1").set({ amount: 100 }));
      await assertSucceeds(db.collection("groups").doc("group1").collection("settlements").doc("set2").set({ amount: 200 }));
      // Updating should fail
      await assertFails(db.collection("groups").doc("group1").collection("settlements").doc("set1").update({ amount: 150 }));
      // Deleting is allowed for clerk members per rules
      await assertSucceeds(db.collection("groups").doc("group1").collection("settlements").doc("set1").delete());
      // Deleting is not allowed for guests
      await assertFails(guestDb("guest1", "group1").collection("groups").doc("group1").collection("settlements").doc("set2").delete());
    });
  });

  describe("Users", () => {
    it("Unauthenticated user cannot write a profile", async () => {
      const db = unauthDb();
      await assertFails(db.collection("users").doc("user1").set({ displayName: "Test" }));
    });

    it("Authenticated user can write their own profile", async () => {
      const db = clerkDb("user1");
      await assertSucceeds(db.collection("users").doc("user1").set({ displayName: "Test" }));
    });

    it("Authenticated user cannot write another profile", async () => {
      const db = clerkDb("user1");
      await assertFails(db.collection("users").doc("user2").set({ displayName: "Test" }));
    });
  });
});
