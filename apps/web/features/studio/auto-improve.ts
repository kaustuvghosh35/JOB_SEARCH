const key = (resumeId: string) => `autoImprove:${resumeId}`;

export const markAutoImprove = (resumeId: string) => {
  try {
    sessionStorage.setItem(key(resumeId), "1");
  } catch {}
};

export const consumeAutoImprove = (resumeId: string): boolean => {
  try {
    const set = sessionStorage.getItem(key(resumeId)) === "1";
    sessionStorage.removeItem(key(resumeId));
    return set;
  } catch {
    return false;
  }
};
