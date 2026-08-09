/**
 * balanceMath.js
 * Pure functions for calculating balances, fairness scores, and category breakdowns.
 * 🐴 Ponytail Ultra: Moved from backend Express server to frontend to eliminate
 * the need for Netlify Functions and dynamic database triggers. 
 */

export function calculateBalances(members, expenses, settlements = []) {
  const paidMap = {};
  const shareMap = {};
  const sentMap = {};
  const receivedMap = {};

  let totalExpenses = 0;

  // Aggregate expenses (Equal Split logic for now)
  const equalShare = members.length > 0 ? (expenses.reduce((s, e) => s + e.amount, 0) / members.length) : 0;

  for (const e of expenses) {
    paidMap[e.paid_by] = (paidMap[e.paid_by] || 0) + e.amount;
    totalExpenses += e.amount;
  }

  // Aggregate settlements
  for (const s of settlements) {
    sentMap[s.from_member] = (sentMap[s.from_member] || 0) + s.amount;
    receivedMap[s.to_member] = (receivedMap[s.to_member] || 0) + s.amount;
  }

  const balances = members.map((m) => {
    const paid = paidMap[m.id] || 0;
    const share = equalShare; // In future, handle complex splits
    const settled_out = sentMap[m.id] || 0;
    const settled_in = receivedMap[m.id] || 0;
    
    // Net = what you paid - your fair share - what you already settled + what others settled to you
    const net = (paid - share) - settled_out + settled_in;
    
    return {
      member_id: m.id,
      name: m.name,
      color: m.color,
      emoji: m.emoji,
      total_paid: Math.round(paid * 100) / 100,
      total_share: Math.round(share * 100) / 100,
      net_balance: Math.round(net * 100) / 100,
    };
  });

  const settlement_suggestions = calculateSettlementSuggestions(balances);

  return {
    balances,
    total_expenses: totalExpenses,
    settlement_suggestions,
  };
}

function calculateSettlementSuggestions(balances) {
  const debtors = balances.filter((b) => b.net_balance < 0).sort((a, b) => a.net_balance - b.net_balance);
  const creditors = balances.filter((b) => b.net_balance > 0).sort((a, b) => b.net_balance - a.net_balance);

  const suggestions = [];
  let di = 0, ci = 0;
  
  // Clone balances to not mutate the original array objects
  const dList = debtors.map(d => ({ ...d }));
  const cList = creditors.map(c => ({ ...c }));

  while (di < dList.length && ci < cList.length) {
    const debt = Math.abs(dList[di].net_balance);
    const credit = cList[ci].net_balance;
    const amount = Math.min(debt, credit);
    
    if (amount > 1) {
      suggestions.push({
        from: dList[di].name,
        to: cList[ci].name,
        from_id: dList[di].member_id,
        to_id: cList[ci].member_id,
        amount: Math.round(amount * 100) / 100,
      });
    }
    
    if (debt <= credit) {
      cList[ci].net_balance -= debt;
      di++;
    }
    if (credit <= debt) {
      dList[di].net_balance += credit;
      ci++;
    }
  }

  return suggestions;
}

export function calculateCategoryBreakdown(members, expenses) {
  const breakdown = {};
  const totalPerCategory = {};

  for (const e of expenses) {
    totalPerCategory[e.category] = (totalPerCategory[e.category] || 0) + e.amount;
  }

  for (const cat of Object.keys(totalPerCategory)) {
    breakdown[cat] = { total: totalPerCategory[cat], members: {} };
    for (const m of members) {
      breakdown[cat].members[m.id] = {
        name: m.name,
        color: m.color,
        amount: 0,
        percentage: 0,
      };
    }
  }

  for (const e of expenses) {
    if (breakdown[e.category]) {
      breakdown[e.category].members[e.paid_by].amount += e.amount;
    }
  }

  // Calculate percentages
  for (const cat of Object.keys(breakdown)) {
    for (const mid of Object.keys(breakdown[cat].members)) {
      const memberData = breakdown[cat].members[mid];
      memberData.amount = Math.round(memberData.amount * 100) / 100;
      memberData.percentage = breakdown[cat].total > 0
        ? Math.round((memberData.amount / breakdown[cat].total) * 100)
        : 0;
    }
  }

  // Insight cards
  const insights = [];
  for (const [category, data] of Object.entries(breakdown)) {
    const topMember = Object.values(data.members).sort((a, b) => b.percentage - a.percentage)[0];
    if (topMember && topMember.percentage > 50) {
      insights.push({
        text: `${topMember.name} covers ${topMember.percentage}% of ${category}`,
        type: "dominant",
        category,
      });
    } else if (topMember && topMember.percentage > 30) {
      insights.push({
        text: `${category} is fairly distributed`,
        type: "balanced",
        category,
      });
    }
  }

  return { breakdown, insights, members };
}

export function calculateFairnessScore(members, expenses) {
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const equalShare = members.length > 0 ? totalExpenses / members.length : 0;

  const memberPaid = {};
  for (const e of expenses) {
    memberPaid[e.paid_by] = (memberPaid[e.paid_by] || 0) + e.amount;
  }

  const scores = members.map((m) => {
    const paid = memberPaid[m.id] || 0;
    const diff = Math.abs(paid - equalShare);
    
    let score = 100;
    if (equalShare > 0) {
      const ratio = diff / equalShare;
      score = Math.max(0, Math.min(100, Math.round(100 - ratio * 50)));
    }

    let status = "fair";
    let explanation = `${m.name} has contributed ${paid >= equalShare ? "more than" : paid === 0 ? "nothing compared to" : "less than"} their fair share.`;

    if (score >= 80) {
      status = "fair";
      explanation = `${m.name} is contributing close to their fair share. Great balance!`;
    } else if (score >= 50) {
      status = "slightly_off";
      explanation = `${m.name} is ${paid > equalShare ? "ahead by ₹" + Math.round((paid - equalShare) * 100) / 100 : "behind by ₹" + Math.round((equalShare - paid) * 100) / 100}. A small adjustment would balance things.`;
    } else {
      status = "significantly_off";
      explanation = `${m.name} is ${paid > equalShare ? "significantly ahead by ₹" + Math.round((paid - equalShare) * 100) / 100 : "significantly behind by ₹" + Math.round((equalShare - paid) * 100) / 100}. Consider settling some expenses.`;
    }

    return {
      member_id: m.id,
      name: m.name,
      color: m.color,
      emoji: m.emoji,
      score,
      paid: Math.round(paid * 100) / 100,
      fair_share: Math.round(equalShare * 100) / 100,
      difference: Math.round((paid - equalShare) * 100) / 100,
      status,
      explanation,
    };
  });

  const groupScore = scores.length > 0 
    ? Math.round(scores.reduce((s, sc) => s + sc.score, 0) / scores.length) 
    : 100;

  return {
    scores,
    group_score: groupScore,
    total_expenses: totalExpenses,
    equal_share: Math.round(equalShare * 100) / 100,
  };
}

/**
 * Sanitize a string for CSV output — prevents formula injection
 */
export function csvSafe(value) {
  if (typeof value !== "string") return value;
  if (/^[=+\-@\t\r]/.test(value)) {
    return "'" + value;
  }
  return value;
}
