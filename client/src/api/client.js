import { db } from "../firebase";
import { 
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, 
  query, where, orderBy, limit as firestoreLimit, writeBatch
} from "firebase/firestore";
import { calculateBalances, calculateCategoryBreakdown, calculateFairnessScore } from "../../../shared/balanceMath";

// ── Helpers ─────────────────────────────────────────────────────────────

// ── Users ─────────────────────────────────────────────────────────────────
export const getUserProfile = async (userId) => {
  const docSnap = await getDoc(doc(db, "users", userId));
  if (!docSnap.exists()) return { success: true, data: null };
  return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
};

export const createUserProfile = async (userId, data) => {
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, { ...data, createdAt: new Date().toISOString() });
  return { success: true, data: { id: userId, ...data } };
};

export const updateUserProfile = async (userId, data) => {
  await updateDoc(doc(db, "users", userId), { ...data, updatedAt: new Date().toISOString() });
  return { success: true };
};

// ── Validation ────────────────────────────────────────────────────────────
export const assertFirestoreSafeData = (data, path = "root") => {
  if (data === undefined) {
    throw new Error(`Invalid Firestore field: ${path} is undefined.`);
  }
  if (data === null || typeof data !== "object") return;
  if (data instanceof Date) return;
  if (Array.isArray(data)) {
    data.forEach((item, index) => assertFirestoreSafeData(item, `${path}[${index}]`));
  } else {
    for (const key of Object.keys(data)) {
      assertFirestoreSafeData(data[key], `${path}.${key}`);
    }
  }
};

// ── Groups ──────────────────────────────────────────────────────────────
export const createGroup = async (groupData) => {
  const { pin, members, fairness_models, ...restData } = groupData;
  const batch = writeBatch(db);
  const groupRef = doc(collection(db, "groups"));
  
  const code = groupData.code || Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const newGroupData = {
    name: groupData.name || "Untitled Group",
    code: code,
    pinHash: pin || groupData.pinHash || null,
    currency: groupData.currency || "INR",
    settlementThreshold: groupData.settlement_threshold || 500,
    currentBalances: {},
    createdAt: new Date().toISOString()
  };
  
  assertFirestoreSafeData(newGroupData, `groups/${groupRef.id}`);
  batch.set(groupRef, newGroupData);

  const returnedMembers = [];
  if (members && members.length > 0) {
    members.forEach((member, i) => {
      const memberRef = doc(collection(db, `groups/${groupRef.id}/members`));
      const memberObj = {
        id: i + 1,
        name: member.name,
        color: member.color
      };
      assertFirestoreSafeData(memberObj, `groups/${groupRef.id}/members[${i}]`);
      batch.set(memberRef, memberObj);
      returnedMembers.push(memberObj);
    });
  }

  const returnedCategories = [];
  if (fairness_models && fairness_models.length > 0) {
    fairness_models.forEach((model, i) => {
      const catRef = doc(collection(db, `groups/${groupRef.id}/categories`));
      const catObj = {
        name: model.category,
        split_model: model.model_type,
        iconName: model.iconName || "Package",
        is_default: !!model.is_default
      };
      assertFirestoreSafeData(catObj, `groups/${groupRef.id}/categories[${i}]`);
      batch.set(catRef, catObj);
      returnedCategories.push(catObj);
    });
  }

  await batch.commit();
  return { success: true, data: { id: groupRef.id, ...newGroupData, members: returnedMembers, categories: returnedCategories } };
};

export const getGroupByCode = async (code, pin) => {
  const q = query(collection(db, "groups"), where("code", "==", code));
  const snapshot = await getDocs(q);
  if (snapshot.empty) throw new Error("Group not found");
  
  const groupDoc = snapshot.docs[0];
  const data = { id: groupDoc.id, ...groupDoc.data() };
  if (pin && data.pinHash && data.pinHash !== pin) throw new Error("Invalid PIN");

  const membersSnap = await getDocs(collection(db, `groups/${groupDoc.id}/members`));
  data.members = membersSnap.docs.map(d => d.data());

  const categoriesSnap = await getDocs(collection(db, `groups/${groupDoc.id}/categories`));
  data.categories = categoriesSnap.docs.map(d => d.data());

  return { success: true, data };
};

export const getGroupById = async (id) => {
  const docSnap = await getDoc(doc(db, "groups", id));
  if (!docSnap.exists()) throw new Error("Group not found");
  const data = { id: docSnap.id, ...docSnap.data() };

  const membersSnap = await getDocs(collection(db, `groups/${id}/members`));
  data.members = membersSnap.docs.map(d => d.data());

  const categoriesSnap = await getDocs(collection(db, `groups/${id}/categories`));
  data.categories = categoriesSnap.docs.map(d => d.data());

  return { success: true, data };
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
  const q = query(collection(db, "groups", groupId, "expenses"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  let expenses = snap.docs.map(d => ({ id: d.id, ...d.data() }));

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
  const { data: settlements } = await getSettlements(groupId);
  
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
  const members = await getMembers(groupId);
  const { data: existingExpenses } = await getExpenses(groupId);
  const settlementsSnap = await getDocs(query(collection(db, "groups", groupId, "settlements")));
  const settlements = settlementsSnap.docs.map(d => d.data());

  // Generate hypothetical expenses from scenario actions
  const hypothetical = data.actions.flatMap(a => {
    const payer = members[a.paidBy];
    if (!payer) return [];
    return Array.from({ length: a.count || 1 }, (_, i) => ({
      id: `sim_${Date.now()}_${i}`,
      amount: a.amount,
      paidBy: payer.id,
      category: a.category,
      splits: members.map(m => ({ member_id: m.id, share_amount: a.amount / members.length })),
      createdAt: new Date().toISOString(),
    }));
  });

  const allExpenses = [...existingExpenses, ...hypothetical];
  const result = calculateBalances(members, allExpenses, settlements);
  const score = calculateFairnessScore(members, allExpenses);

  return {
    success: true,
    data: {
      projectedBalances: result.balances,
      average_fairness_score: score.overall_score || 0,
      total_expenses: result.total_expenses,
      verdict: (score.overall_score || 0) >= 90 ? "Very fair" : (score.overall_score || 0) >= 70 ? "Reasonably fair" : "Needs rebalancing",
      settlement_suggestions: result.settlement_suggestions,
    },
  };
};

// ── Reports ─────────────────────────────────────────────────────────────
export const getReport = async (groupId, period = {}) => {
  const group = (await getGroupById(groupId)).data;
  const members = await getMembers(groupId);
  const { data: expenses } = await getExpenses(groupId, period);
  const settlementsSnap = await getDocs(query(collection(db, "groups", groupId, "settlements")));
  
  const result = calculateCategoryBreakdown(members, expenses);
  const bal = calculateBalances(members, expenses, settlementsSnap.docs.map(d => d.data()));
  const fairness = calculateFairnessScore(members, expenses);

  // Build narrative summary
  const topPayer = bal.balances.reduce((max, b) => b.total_paid > (max?.total_paid || 0) ? b : max, null);
  const narrative = bal.total_expenses > 0
    ? `${group.name} has tracked ${formatReportCurrency(bal.total_expenses)} in total expenses across ${Object.keys(result.breakdown).length} categories. ${topPayer ? `${topPayer.name} has contributed the most (${formatReportCurrency(topPayer.total_paid)}).` : ''} Group fairness score: ${fairness.group_score}/100.`
    : `No expenses recorded yet for ${group.name}.`;

  return { success: true, data: {
    group, members,
    total_expenses: bal.total_expenses,
    member_summary: bal.balances,
    category_list: Object.keys(result.breakdown),
    category_grid: result.breakdown,
    settlement_plan: bal.settlement_suggestions,
    narrative,
  }};
};

function formatReportCurrency(amount) {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

// ── Categories ──────────────────────────────────────────────────────────
export const getCategories = async (groupId) => {
  let snap;
  try {
    snap = await getDocs(query(collection(db, "groups", groupId, "categories"), orderBy("sort_order")));
  } catch {
    // sort_order index may not exist — fall back to unordered query
    snap = await getDocs(query(collection(db, "groups", groupId, "categories")));
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

