import { Router } from "express";
import { z } from "zod";
import { getDB } from "../db.js";

const router = Router();

const createTemplateSchema = z.object({
  paid_by: z.number().int().positive(),
  amount: z.number().positive(),
  category: z.string().min(1).max(30),
  description: z.string().default(""),
  split_type: z.enum(["equal", "custom_amounts", "custom_percentages"]).default("equal"),
  frequency: z.enum(["monthly", "weekly"]),
  next_due: z.string(), // YYYY-MM-DD
});

const updateTemplateSchema = z.object({
  paid_by: z.number().int().positive().optional(),
  amount: z.number().positive().optional(),
  category: z.string().min(1).max(30).optional(),
  description: z.string().optional(),
  split_type: z.enum(["equal", "custom_amounts", "custom_percentages"]).optional(),
  frequency: z.enum(["monthly", "weekly"]).optional(),
  next_due: z.string().optional(),
  is_active: z.number().int().min(0).max(1).optional(),
});

// GET /api/groups/:id/recurring — List templates
router.get("/:id/recurring", (req, res, next) => {
  try {
    const db = getDB();
    const templates = db
      .prepare(
        `SELECT rt.*, m.name as payer_name, m.emoji as payer_emoji, m.color as payer_color
         FROM recurring_templates rt
         JOIN members m ON rt.paid_by = m.id
         WHERE rt.group_id = ?
         ORDER BY rt.is_active DESC, rt.next_due ASC`
      )
      .all(req.params.id);
    res.json({ success: true, data: templates });
  } catch (err) {
    next(err);
  }
});

// POST /api/groups/:id/recurring — Create template
router.post("/:id/recurring", (req, res, next) => {
  try {
    const data = createTemplateSchema.parse(req.body);
    const db = getDB();

    const group = db.prepare("SELECT id FROM groups WHERE id = ?").get(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found." });
    }

    const result = db
      .prepare(
        `INSERT INTO recurring_templates (group_id, paid_by, amount, category, description, split_type, frequency, next_due)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        req.params.id, data.paid_by, data.amount, data.category,
        data.description, data.split_type, data.frequency, data.next_due
      );

    const template = db
      .prepare("SELECT * FROM recurring_templates WHERE id = ?")
      .get(result.lastInsertRowid);

    res.status(201).json({ success: true, data: template, message: "Recurring expense created!" });
  } catch (err) {
    next(err);
  }
});

// PUT /api/groups/:id/recurring/:rid — Update template
router.put("/:id/recurring/:rid", (req, res, next) => {
  try {
    const data = updateTemplateSchema.parse(req.body);
    const db = getDB();

    const existing = db
      .prepare("SELECT id FROM recurring_templates WHERE id = ? AND group_id = ?")
      .get(req.params.rid, req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Template not found." });
    }

    const updates = [];
    const values = [];
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        updates.push(`${key} = ?`);
        values.push(val);
      }
    }
    if (updates.length === 0) {
      return res.json({ success: true, message: "No changes." });
    }

    values.push(req.params.rid);
    db.prepare(`UPDATE recurring_templates SET ${updates.join(", ")} WHERE id = ?`).run(...values);

    const updated = db.prepare("SELECT * FROM recurring_templates WHERE id = ?").get(req.params.rid);
    res.json({ success: true, data: updated, message: "Template updated." });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/groups/:id/recurring/:rid — Delete template
router.delete("/:id/recurring/:rid", (req, res, next) => {
  try {
    const db = getDB();
    const result = db
      .prepare("DELETE FROM recurring_templates WHERE id = ? AND group_id = ?")
      .run(req.params.rid, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: "Template not found." });
    }
    res.json({ success: true, message: "Template deleted." });
  } catch (err) {
    next(err);
  }
});

// POST /api/groups/:id/recurring/:rid/apply — Manually apply one template
router.post("/:id/recurring/:rid/apply", (req, res, next) => {
  try {
    const db = getDB();
    const template = db
      .prepare("SELECT * FROM recurring_templates WHERE id = ? AND group_id = ?")
      .get(req.params.rid, req.params.id);

    if (!template) {
      return res.status(404).json({ success: false, message: "Template not found." });
    }

    const members = db
      .prepare("SELECT id FROM members WHERE group_id = ?")
      .all(req.params.id);

    const today = new Date().toISOString().split("T")[0];

    const transaction = db.transaction(() => {
      const result = db
        .prepare(
          `INSERT INTO expenses (group_id, paid_by, amount, category, description, expense_date, split_type)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          req.params.id, template.paid_by, template.amount,
          template.category, template.description || `Recurring: ${template.category}`,
          today, template.split_type
        );

      const expenseId = result.lastInsertRowid;
      const shareAmount = template.amount / members.length;
      const insertSplit = db.prepare(
        "INSERT INTO expense_splits (expense_id, member_id, share_amount, share_percent) VALUES (?, ?, ?, ?)"
      );
      for (const m of members) {
        insertSplit.run(expenseId, m.id, shareAmount, 100 / members.length);
      }

      return expenseId;
    });

    const expenseId = transaction();
    res.status(201).json({
      success: true,
      data: { expense_id: expenseId },
      message: "Recurring expense applied!",
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/groups/:id/recurring/apply-due — Batch-apply all overdue templates
router.post("/:id/recurring/apply-due", (req, res, next) => {
  try {
    const db = getDB();
    const today = new Date().toISOString().split("T")[0];

    const dueTemplates = db
      .prepare(
        "SELECT * FROM recurring_templates WHERE group_id = ? AND is_active = 1 AND next_due <= ?"
      )
      .all(req.params.id, today);

    if (dueTemplates.length === 0) {
      return res.json({ success: true, data: { applied: 0 }, message: "No recurring expenses due." });
    }

    const members = db
      .prepare("SELECT id FROM members WHERE group_id = ?")
      .all(req.params.id);

    const applied = [];

    const transaction = db.transaction(() => {
      for (const template of dueTemplates) {
        const result = db
          .prepare(
            `INSERT INTO expenses (group_id, paid_by, amount, category, description, expense_date, split_type)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
            req.params.id, template.paid_by, template.amount,
            template.category, template.description || `Recurring: ${template.category}`,
            template.next_due, template.split_type
          );

        const expenseId = result.lastInsertRowid;
        const shareAmount = template.amount / members.length;
        const insertSplit = db.prepare(
          "INSERT INTO expense_splits (expense_id, member_id, share_amount, share_percent) VALUES (?, ?, ?, ?)"
        );
        for (const m of members) {
          insertSplit.run(expenseId, m.id, shareAmount, 100 / members.length);
        }

        // Advance next_due
        const dueDate = new Date(template.next_due);
        if (template.frequency === "monthly") {
          dueDate.setMonth(dueDate.getMonth() + 1);
        } else {
          dueDate.setDate(dueDate.getDate() + 7);
        }
        const newDue = dueDate.toISOString().split("T")[0];
        db.prepare("UPDATE recurring_templates SET next_due = ? WHERE id = ?").run(newDue, template.id);

        applied.push({ template_id: template.id, expense_id: expenseId, category: template.category });
      }
    });

    transaction();

    res.json({
      success: true,
      data: { applied: applied.length, details: applied },
      message: `${applied.length} recurring expense(s) applied!`,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
