/**
 * Format a number to Indian number format (e.g., ₹1,20,000)
 */
export function formatINR(amount, currency = "₹") {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${currency}0`;
  }

  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  // toLocaleString("en-IN") handles Indian grouping (lakhs/crores) natively
  const formatted = absAmount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });

  return `${sign}${currency}${formatted}`;
}

/**
 * Format a number with compact notation for balance chips
 */
export function formatCompact(amount, currency = "₹") {
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? "-" : "+";

  if (absAmount >= 10000000) {
    return `${sign}${currency}${(absAmount / 10000000).toFixed(1)}Cr`;
  }
  if (absAmount >= 100000) {
    return `${sign}${currency}${(absAmount / 100000).toFixed(1)}L`;
  }
  if (absAmount >= 1000) {
    return `${sign}${currency}${(absAmount / 1000).toFixed(1)}K`;
  }
  return `${sign}${currency}${Math.round(absAmount)}`;
}
