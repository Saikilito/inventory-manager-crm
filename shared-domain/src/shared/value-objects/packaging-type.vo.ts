export const PackagingType = Object.freeze({
  UNIT: 'UNIT',
  BOTTLE: 'BOTTLE',
  DRUM: 'DRUM',
  BAG: 'BAG',
  ROLL: 'ROLL',
  BOX: 'BOX',
  BULK: 'BULK'
} as const);

export type PackagingType = typeof PackagingType[keyof typeof PackagingType];
