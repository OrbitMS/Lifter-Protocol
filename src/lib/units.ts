export type Units = 'kg' | 'lb';

const KG_PER_LB = 0.45359237;

/** Convert a stored kg value to the display unit (lb rounded to nearest 5). */
export function kgToDisplay(kg: number, units: Units): number {
  return units === 'lb' ? Math.round(kg / KG_PER_LB / 5) * 5 : kg;
}

/** Convert a user-entered display value back to kg for storage. */
export function displayToKg(value: number, units: Units): number {
  return units === 'lb' ? value * KG_PER_LB : value;
}

export function fmtWeight(kg: number, units: Units): string {
  return `${kgToDisplay(kg, units)} ${units}`;
}
