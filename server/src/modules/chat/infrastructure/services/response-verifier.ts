export const PRICE_MATCH_TOLERANCE_UNITS = 1;

const CURRENCY_TOKEN_REGEX = /(?:\$\s*|bs\.?\s*)\d+(?:[.,]\d{1,2})?|\b\d+[.,]\d{1,2}\b/gi;

export interface AuthoritativeFacts {
  orderTotal?: number;
}

export interface VerifyReplyResult {
  ok: boolean;
  reason?: string;
}

const parseAmountToken = (token: string): number => {
  const digitsAndSeparators = token.replace(/\$|bs\.?/gi, '').trim();
  const normalized = digitsAndSeparators.includes(',') && !digitsAndSeparators.includes('.')
    ? digitsAndSeparators.replace(',', '.')
    : digitsAndSeparators.replace(/,/g, '');
  return Number.parseFloat(normalized);
};

export const verifyReply = (
  reply: string,
  authoritativeFacts: AuthoritativeFacts
): VerifyReplyResult => {
  if (authoritativeFacts.orderTotal === undefined) {
    return { ok: true };
  }

  const matches = reply.match(CURRENCY_TOKEN_REGEX);
  if (!matches || matches.length === 0) {
    return { ok: true };
  }

  const mentionedAmounts = matches.map(parseAmountToken).filter((amount) => !Number.isNaN(amount));
  const hasMatchingAmount = mentionedAmounts.some(
    (amount) => Math.abs(amount - authoritativeFacts.orderTotal!) <= PRICE_MATCH_TOLERANCE_UNITS
  );

  if (hasMatchingAmount) {
    return { ok: true };
  }

  return {
    ok: false,
    reason: `Reply mentions price(s) [${mentionedAmounts.join(', ')}] that do not match the authoritative order total ${authoritativeFacts.orderTotal}`,
  };
};
