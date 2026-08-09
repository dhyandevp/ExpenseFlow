import { db } from "../firebase";
import { 
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, 
  query, where, orderBy, limit as firestoreLimit
} from "firebase/firestore";
import { calculateBalances, calculateCategoryBreakdown, calculateFairnessScore } from "../../../shared/balanceMath";

// ── Helpers ─────────────────────────────────────────────────────────────
const generateId = () => Math.random().toString(36).substring(2, 15);

// ── Groups ──────────────────────────────────────────────────────────────
export const createGroup = async (groupData) => {
  const { pin, ...restData } = groupData;
  const docRef = await addDoc(collection(db, "groups"), {
    name: groupData.name || "Untitled Group",
    code: groupData.code,
    pinHash: pin || groupData.pinHash || null,
    currency: groupData.currency || "USD",
    settlementThreshold: groupData.settlementThreshold || 0,
    currentBalances: {},
    createdAt: new Date().toISOString()
  });
  return { success: true, data: { id: docRef.id, ...groupData } };
};

export const getGroupByCode = async (code, pin) => {
  const q = query(collection(db, "groups"), where("code", "==", code));
  const snapshot = await getDocs(q);
  if (snapshot.empty) throw new Error("Group not found");
  const data = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  if (pin && data.pinHash && data.pinHash !== pin) throw new Error("Invalid PIN");
  return { success: true, data };
};

export const getGroupById = async (id) => {
  const docSnap = await getDoc(doc(db, "groups", id));
  if (!docSnap.exists()) throw new Error("Group not found");
  return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
};

export const updateGroup = async (id, data) => {
  await updateDoc(doc(db, "groups", id), data);
  return { success: true };
};

export const regenerateCode = async (groupId) => {
  const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  await updateDoc(doc(db, "groups", groupId), { code: newCode });
  return { success: true, data: { code: newCode } };
};

export const setGroupPin = async (groupId, data) => {
  await updateDoc(doc(db, "groups", groupId), { pinHash: data.pin });
  return { success: true };
};

// ── Members ─────────────────────────────────────────────────────────────
export const addMember = async (groupId, data) => {
  const docRef = await addDoc(collection(db, "groups", groupId, "members"), {
    ...data
  });
  return { success: true, data: { id: docRef.id, ...data } };
};

export const removeMember = async (groupId, memberId) => {
  await deleteDoc(doc(db, "groups", groupId, "members", memberId));
  return { success: true };
};

export const getMembers = async (groupId) => {
  const q = query(collection(db, "groups", groupId, "members"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ── Expenses ────────────────────────────────────────────────────────────
export const createExpense = async (groupId, data) => {
  const expenseData = {
    ...data,
    paidBy: data.paidBy,
    receiptUrl: data.receiptUrl || null,
    createdAt: data.createdAt || new Date().toISOString(),
    splits: data.splits || null
  };
  const docRef = await addDoc(collection(db, "groups", groupId, "expenses"), expenseData);
  return { success: true, data: { id: docRef.id, ...expenseData } };
};

export const getExpenses = async (groupId, filters = {}) => {
  // Ponytail simplification: fetch all for group, filter client-side for complex queries
  // since group expense lists are small.
  const q = query(collection(db, "groups", groupId, "expenses"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  let expenses = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Basic client-side filtering if needed
  if (filters.startDate) {
    expenses = expenses.filter(e => e.createdAt >= filters.startDate);
  }
  if (filters.endDate) {
    expenses = expenses.filter(e => e.createdAt <= filters.endDate);
  }
  if (filters.category) expenses = expenses.filter(e => e.category === filters.category);
  if (filters.member_id) expenses = expenses.filter(e => e.paidBy === filters.member_id);
  if (filters.limit) expenses = expenses.slice(0, filters.limit);
  
  return { success: true, data: expenses };
};

export const updateExpense = async (groupId, id, data) => {
  await updateDoc(doc(db, "groups", groupId, "expenses", id), data);
  return { success: true };
};

export const deleteExpense = async (groupId, id) => {
  await deleteDoc(doc(db, "groups", groupId, "expenses", id));
  return { success: true };
};

// ── Balances & Math (Ponytail Ultra) ────────────────────────────────────
export const getBalances = async (groupId, period = {}) => {
  const members = await getMembers(groupId);
  const { data: expenses } = await getExpenses(groupId, period);
  const settlementsSnap = await getDocs(query(collection(db, "groups", groupId, "settlements")));
  const settlements = settlementsSnap.docs.map(d => d.data());
  
  const result = calculateBalances(members, expenses, settlements);
  return { success: true, data: result };
};

export const getBreakdown = async (groupId, period = {}) => {
  const members = await getMembers(groupId);
  const { data: expenses } = await getExpenses(groupId, period);
  const result = calculateCategoryBreakdown(members, expenses);
  return { success: true, data: result };
};

export const getFairnessScore = async (groupId, period = {}) => {
  const members = await getMembers(groupId);
  const { data: expenses } = await getExpenses(groupId, period);
  const result = calculateFairnessScore(members, expenses);
  return { success: true, data: result };
};

// ── Scenarios ───────────────────────────────────────────────────────────
export const getScenarios = async (groupId) => {
  const snap = await getDocs(query(collection(db, "groups", groupId, "scenarios")));
  return { success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) };
};

export const saveScenario = async (groupId, data) => {
  await addDoc(collection(db, "groups", groupId, "scenarios"), { ...data });
  return { success: true };
};

export const simulateScenario = async (groupId, data) => {
  // Fake API response for simulation - client calculates it anyway
  return { success: true, data: { new_balances: [] } }; 
};

// ── Reports ─────────────────────────────────────────────────────────────
export const getReport = async (groupId, period = {}) => {
  const group = (await getGroupById(groupId)).data;
  const members = await getMembers(groupId);
  const { data: expenses } = await getExpenses(groupId, period);
  const settlementsSnap = await getDocs(query(collection(db, "groups", groupId, "settlements")));
  
  // Ponytail: Just send raw data, let FairnessReport component format it
  const result = calculateCategoryBreakdown(members, expenses);
  const bal = calculateBalances(members, expenses, settlementsSnap.docs.map(d => d.data()));
  
  return { success: true, data: {
    group, members,
    total_expenses: bal.total_expenses,
    member_summary: bal.balances,
    category_list: Object.keys(result.breakdown),
    settlement_plan: bal.settlement_suggestions
  }};
};

// ── Categories ──────────────────────────────────────────────────────────
export const getCategories = async (groupId) => {
  const snap = await getDocs(query(collection(db, "groups", groupId, "categories"), orderBy("sort_order")));
  if (snap.empty) {
    return { success: true, data: [
      { id: "1", name: "Rent", emoji: "🏠", color: "#4A90E2" },
      { id: "2", name: "Groceries", emoji: "🛒", color: "#F5A623" }
    ]};
  }
  return { success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) };
};

export const createCategory = async (groupId, data) => {
  const docRef = await addDoc(collection(db, "groups", groupId, "categories"), { ...data });
  return { success: true, data: { id: docRef.id, ...data } };
};

export const updateCategory = async (groupId, catId, data) => {
  await updateDoc(doc(db, "groups", groupId, "categories", catId), data);
  return { success: true };
};

export const deleteCategory = async (groupId, catId) => {
  await deleteDoc(doc(db, "groups", groupId, "categories", catId));
  return { success: true };
};

export const reorderCategories = async (groupId, order) => {
  // Batch update conceptually
  return { success: true };
};

// ── Settlements ─────────────────────────────────────────────────────────
export const getSettlements = async (groupId) => {
  const snap = await getDocs(query(collection(db, "groups", groupId, "settlements"), orderBy("date", "desc")));
  return { success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) };
};

export const recordSettlement = async (groupId, data) => {
  await addDoc(collection(db, "groups", groupId, "settlements"), { ...data, date: new Date().toISOString() });
  return { success: true };
};

export const deleteSettlement = async (groupId, sid) => {
  await deleteDoc(doc(db, "groups", groupId, "settlements", sid));
  return { success: true };
};

// ── Stubs for future/skipped features (Ponytail) ────────────────────────
export const getFairnessTrend = async (groupId) => ({ success: true, data: { history: [] }});
export const snapshotFairness = async (groupId) => ({ success: true });
export const getRecurringTemplates = async (groupId) => ({ success: true, data: [] });
export const createRecurringTemplate = async () => ({ success: true });
export const updateRecurringTemplate = async () => ({ success: true });
export const deleteRecurringTemplate = async () => ({ success: true });
export const applyRecurringTemplate = async () => ({ success: true });
export const applyDueRecurring = async () => ({ success: true });
export const getFairnessModels = async () => [];
export const updateFairnessModel = async () => ({ success: true });
