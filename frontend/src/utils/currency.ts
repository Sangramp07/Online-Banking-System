/**
 * Format a number as Indian Rupees (INR).
 * Uses en-IN locale to show lakh/crore grouping style.
 */
export const formatINR = (amount: number | string | undefined | null): string => {
  const num = Number(amount || 0);
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/**
 * Compact rupee format for large numbers (e.g., ₹1.2L, ₹45K)
 */
export const formatINRCompact = (amount: number | string | undefined | null): string => {
  const num = Number(amount || 0);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
  return formatINR(num);
};
