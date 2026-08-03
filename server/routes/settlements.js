import { Router } from "express";
import { z } from "zod";
import { getDB } from "../db.js";

const router = Router();

const recordSettlementSchema = z.object({
  from_member: z.number().int().positive(),
  to_member: z.number().int().positive(),
  amount: z.number().positive(),
  note: z.string().default(""),
});

// GET /api/groups/:id/settlements — List settlement history
router.get("/:id/settlements", (req, res, next) => {
  try {
    const db = getDB();
    const settlements = db
      .prepare(
        `SELECT s.*, 
                fm.name as from_name, fm.emoji as from_emoji, fm.color as from_color,
                tm.name as to_name, tm.emoji as to_emoji, tm.color as to_color
         FROM settlements s
         JOIN members fm ON s.from_member = fm.id
         JOIN members tm ON s.to_member = tm.id
         WHERE s.group_id = ?
         ORDER BY s.date DESC`
      )
      .all(req.params.id);

    res.json({ success: true, data: settlements });
  } catch (err) {
    next(err);
  }
});

// POST /api/groups/:id/settlements — Record a settlement
router.post("/:id/settlements", (req, res, next) => {
  try {
    const data = recordSettlementSchema.parse(req.body);
    const db = getDB();

    // Validate members belong to group
    const fromMember = db
      .prepare("SELECT id FROM members WHERE id = ? AND group_id = ?")
      .get(data.from_member, req.params.id);
    const toMember = db
      .prepare("SELECT id FROM members WHERE id = ? AND group_id = ?")
      .get(data.to_member, req.params.id);

    if (!fromMember || !toMember) {
      return res.status(400).json({ success: false, message: "One or both members not found in this group." });
    }

    if (data.from_member === data.to_member) {
      return res.status(400).json({ success: false, message: "Cannot settle with yourself." });
    }

    const result = db
      .prepare(
        "INSERT INTO settlements (group_id, from_member, to_member, amount, note) VALUES (?, ?, ?, ?, ?)"
      )
      .run(req.params.id, data.from_member, data.to_member, data.amount, data.note);

    const settlement = db
      .prepare(
        `SELECT s.*, 
                fm.name as from_name, fm.emoji as from_emoji, fm.color as from_color,
                tm.name as to_name, tm.emoji as to_emoji, tm.color as to_color
         FROM settlements s
         JOIN members fm ON s.from_member = fm.id
         JOIN members tm ON s.to_member = tm.id
         WHERE s.id = ?`
      )
      .get(result.lastInsertRowid);

    res.status(201).json({ success: true, data: settlement, message: "Settlement recorded!" });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/groups/:id/settlements/:sid — Delete a settlement
router.delete("/:id/settlements/:sid", (req, res, next) => {
  try {
    const db = getDB();
    const result = db
      .prepare("DELETE FROM settlements WHERE id = ? AND group_id = ?")
      .run(req.params.sid, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: "Settlement not found." });
    }
    res.json({ success: true, message: "Settlement deleted." });
  } catch (err) {
    next(err);
  }
});

export default router;
