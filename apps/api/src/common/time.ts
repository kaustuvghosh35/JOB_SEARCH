export const hoursToMs = (hours: number) => hours * 3_600_000;

export const hoursFromNow = (hours: number) => new Date(Date.now() + hoursToMs(hours));
