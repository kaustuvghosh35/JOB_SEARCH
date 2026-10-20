type Prefs = { role: string; location: string };

const key = (resumeId: string) => `searchPrefs:${resumeId}`;

export const loadSearchPrefs = (resumeId: string): Prefs | null => {
  try {
    const raw = localStorage.getItem(key(resumeId));
    return raw ? (JSON.parse(raw) as Prefs) : null;
  } catch {
    return null;
  }
};

export const saveSearchPrefs = (resumeId: string, prefs: Prefs) => {
  try {
    localStorage.setItem(key(resumeId), JSON.stringify(prefs));
  } catch {}
};
