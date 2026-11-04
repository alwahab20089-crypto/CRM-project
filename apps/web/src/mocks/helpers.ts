export const ORG_ID = 'org_001';
const DAY = 86_400_000;

export const daysAgo = (days: number, hour = 10) => {
  const d = new Date(Date.now() - days * DAY);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};
export const daysFromNow = (days: number, hour = 10) => daysAgo(-days, hour);
export const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();