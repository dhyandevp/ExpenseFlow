import { useEffect } from "react";

const PAGE_DESCRIPTIONS = {
  "Create a Group": "Create a new expense-sharing group. Add members, set categories, and start tracking who pays what.",
  "Join Group": "Join an existing BalanceBoard group with an invite code.",
  "Log Expenses": "Log and track shared expenses. See who paid and how costs are split among group members.",
  "Dashboard": "View expense summaries, net balances, category breakdowns, and fairness scores for your group.",
  "Scenario Planner": "Simulate future expenses before they happen. See how payments would affect fairness.",
  "Fairness Report": "Auto-generated expense summary with category breakdown, member contributions, and settlement plan.",
  "Group Settings": "Manage group name, members, categories, recurring expenses, invite code, and security settings.",
};

export default function useDocumentTitle(title) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) {
      document.title = title + " — BalanceBoard";
    }

    // Set per-page meta description
    const desc = PAGE_DESCRIPTIONS[title];
    let metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute("content");
    if (desc && metaDesc) {
      metaDesc.setAttribute("content", desc);
    }

    return () => {
      document.title = prevTitle;
      if (prevDesc && metaDesc) {
        metaDesc.setAttribute("content", prevDesc);
      }
    };
  }, [title]);
}
