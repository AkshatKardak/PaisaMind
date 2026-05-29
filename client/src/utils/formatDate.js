/**
 * Consistent date formatter — always outputs "29 May 2026" (en-IN, day+month+year)
 * Use this everywhere instead of raw toLocaleDateString() to prevent
 * format flickering between "29/5/2026" and "29 May 2026" across renders.
 */
export const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default formatDate;
