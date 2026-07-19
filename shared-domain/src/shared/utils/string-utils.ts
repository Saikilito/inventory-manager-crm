export const toCamelCase = (str: string): string => {
  if (!str) return '';
  const cleaned = str.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  if (!cleaned) return '';
  const words = cleaned.split(/\s+/);
  return words
    .map((word, index) => {
      if (index === 0) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
};
