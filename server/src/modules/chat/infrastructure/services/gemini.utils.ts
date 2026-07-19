export const cleanAndAlternateHistory = (history: Array<{ role: string; text: string }>): Array<{ role: string; text: string }> => {
  if (history.length === 0) return [];

  const merged: Array<{ role: string; text: string }> = [];
  let current = { ...history[0] };

  for (let i = 1; i < history.length; i++) {
    const next = history[i];
    if (next.role === current.role) {
      current.text += "\n" + next.text;
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);

  const firstUserIdx = merged.findIndex(h => h.role === "user");
  if (firstUserIdx === -1) {
    return [];
  }

  return merged.slice(firstUserIdx);
};

export const getSpanishSingular = (word: string): string => {
  const w = word.trim().toLowerCase();
  if (w.length <= 3) return w;

  if (w.endsWith("es")) {
    const base = w.slice(0, -2);
    const lastChar = base[base.length - 1];
    if (["d", "j", "l", "n", "r", "y", "c"].includes(lastChar)) {
      if (lastChar === "c") {
        return base.slice(0, -1) + "z";
      }
      return base;
    }
    return w.slice(0, -1);
  }

  if (w.endsWith("s")) {
    return w.slice(0, -1);
  }

  return w;
};
