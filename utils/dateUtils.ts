/**
 * Format a Date object to 'YYYY-MM-DD' string, handling timezone correctly.
 */
export const formatDate = (date: Date): string => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

/**
 * Get today's date as 'YYYY-MM-DD' string.
 */
export const getTodayString = (date = new Date()): string => {
  const d = new Date(date);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};
