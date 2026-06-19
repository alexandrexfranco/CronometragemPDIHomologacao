export const formatTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  const s = Math.floor((minutes * 60) % 60);
  return `${h > 0 ? `${h.toString().padStart(2, '0')}:` : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const getActivityTime = (activity: any, now: number): number => {
  if (!activity.isRunning || !activity.startTime) return activity.duration;
  const elapsedMin = (now - activity.startTime) / 60000;
  return activity.duration + elapsedMin;
};
