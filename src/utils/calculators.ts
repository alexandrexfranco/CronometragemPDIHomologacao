export const calculateTotalTime = (activities: any[], now: number, getActivityTime: (activity: any, now: number) => number): number => {
  return activities.reduce((acc, act) => acc + getActivityTime(act, now), 0);
};

export const calculateIdleTime = (totalIdleMs: number): number => {
  return totalIdleMs / 60000;
};

export const calculateCapacity = (totalTime: number, workday: number): number => {
  return totalTime > 0 ? (workday / totalTime) : 0;
};

export const calculateAverageTimePerCar = (totalTime: number, carsCount: number): number => {
  return carsCount > 0 ? (totalTime / carsCount) : 0;
};
