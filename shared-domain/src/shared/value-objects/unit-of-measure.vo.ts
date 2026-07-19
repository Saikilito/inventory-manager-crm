export const UnitOfMeasure = Object.freeze({
  UNIT: 'UNIT',
  LITER: 'LITER',
  KILOGRAM: 'KILOGRAM',
  METER: 'METER'
} as const);

export type UnitOfMeasure = typeof UnitOfMeasure[keyof typeof UnitOfMeasure];
