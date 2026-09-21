/**
 * Get color hex based on fairness score (Aurora Forest palette)
 */
export function getFairnessColor(score) {
  if (score >= 80) return "#009A6E";   // Mayan Jade — healthy
  if (score >= 40) return "#E8E300";   // Neo Solar — needs attention
  return "#767F7D";                      // Timeless Grey — calm, not alarming
}

/**
 * Get status label based on fairness score
 */
export function getFairnessStatus(score) {
  if (score >= 80) return { label: "Fair", color: "success" };
  if (score >= 40) return { label: "Needs Attention", color: "accent" };
  return { label: "Significantly Off", color: "text-muted" };
}

/**
 * Get a color class based on balance (Aurora Forest rules)
 * Positive = Mayan Jade, Negative = Silver Cloud (not red!), Neutral = Mint of Spring
 */
export function getBalanceColor(netBalance) {
  if (netBalance > 0) return "text-success";
  if (netBalance < 0) return "text-text-muted";
  return "text-text-dark";
}

/**
 * Get category color from Aurora Forest palette
 */
export function getCategoryColor(category) {
  const colors = {
    Rent: "#105D5E",      // Aquamarine
    Utilities: "#E8E300", // Neo Solar
    Groceries: "#009A6E", // Mayan Jade
    Repairs: "#767F7D",   // Timeless Grey
    Outings: "#B3EDA9",   // Mint of Spring
    Other: "#C2CBC9",     // Silver Cloud
  };
  return colors[category] || "#767F7D";
}
