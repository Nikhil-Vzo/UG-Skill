export const getLocalDateStr = (timezone?: string): string => {
  const tz = timezone || 'Asia/Kolkata';
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: tz });
  } catch (e) {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  }
};
