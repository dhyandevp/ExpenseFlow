import { Router } from "express";
import { getDB } from "../db.js";

const router = Router();

// GET /api/groups/:id/fairness-trend — Get per-member fairness scores over last 6 months
router.get("/:id/fairness-trend", (req, res, next) => {
  try {
    const db = getDB();

    const snapshots = db
      .prepare(
        `SELECT fs.*, m.name, m.color, m.emoji
         FROM fairness_snapshots fs
         JOIN members m ON fs.member_id = m.id
         WHERE fs.group_id = ?
         ORDER BY fs.snapshot_month ASC`
      )
      .all(req.params.id);

    // Group by month
    const byMonth = {};
    for (const s of snapshots) {
      if (!byMonth[s.snapshot_month]) {
        byMonth[s.snapshot_month] = { month: s.snapshot_month, members: [] };
      }
      byMonth[s.snapshot_month].members.push({
        member_id: s.member_id,
        name: s.name,
        color: s.color,
        emoji: s.emoji,
        score: s.score,
        total_paid: s.total_paid,
        total_share: s.total_share,
      });
    }

    // Return last 6 months
    const months = Object.values(byMonth).slice(-6);

    res.json({ success: true, data: months });
  } catch (err) {
    next(err);
  }
});

// POST /api/groups/:id/fairness-trend/snapshot — Snapshot current fairness scores
router.post("/:id/fairness-trend/snapshot", (req, res, next) => {
  try {
    const db = getDB();
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Check if snapshot already exists for this month
    const existing = db
      .prepare(
        "SELECT id FROM fairness_snapshots WHERE group_id = ? AND snapshot_month = ? LIMIT 1"
      )
      .get(req.params.id, month);

    if (existing) {
      return res.json({ success: true, message: "Snapshot already exists for this month.", skipped: true });
    }

    const members = db
      .prepare("SELECT * FROM members WHERE group_id = ? ORDER BY id")
      .all(req.params.id);

    const expenses = db
      .prepare("SELECT * FROM expenses WHERE group_id = ?")
      .all(req.params.id);

    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const equalShare = members.length > 0 ? totalExpenses / members.length : 0;

    // Calculate paid totals
    const memberPaid = {};
    for (const e of expenses) {
      memberPaid[e.paid_by] = (memberPaid[e.paid_by] || 0) + e.amount;
    }

    // Calculate share totals
    const splitTotals = db
      .prepare(
        `SELECT es.member_id, SUM(es.share_amount) as total_share
         FROM expense_splits es
         JOIN expenses e ON es.expense_id = e.id
         WHERE e.group_id = ?
         GROUP BY es.member_id`
      )
      .all(req.params.id);

    const shareMap = {};
    for (const row of splitTotals) {
      shareMap[row.member_id] = row.total_share;
    }

    const insert = db.prepare(
      `INSERT INTO fairness_snapshots (group_id, snapshot_month, member_id, score, total_paid, total_share)
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    const transaction = db.transaction(() => {
      for (const m of members) {
        const paid = memberPaid[m.id] || 0;
        const share = shareMap[m.id] || 0;
        const diff = Math.abs(paid - equalShare);
        let score = 100;
        if (equalShare > 0) {
          const ratio = diff / equalShare;
          score = Math.max(0, Math.min(100, Math.round(100 - ratio * 50)));
        }

        insert.run(
          req.params.id, month, m.id, score,
          Math.round(paid * 100) / 100,
          Math.round(share * 100) / 100
        );
      }
    });

    transaction();

    res.status(201).json({ success: true, message: "Fairness snapshot created.", month });
  } catch (err) {
    next(err);
  }
});

export default router;
