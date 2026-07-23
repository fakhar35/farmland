// ---------------------------------------------------------------
// @dairy/shared — types and utilities used by both API and web.
// All money values are integer minor units (cents). Never floats.
// ---------------------------------------------------------------

export type FarmMode = 'HERD' | 'INDIVIDUAL' | 'HYBRID';
export type Role = 'OWNER' | 'MANAGER' | 'ACCOUNTANT' | 'WORKER' | 'VET';
export type GroupType = 'MILKING' | 'DRY' | 'HEIFER' | 'CALF' | 'SICK' | 'OTHER';
export type AnimalStatus = 'CALF' | 'HEIFER' | 'MILKING' | 'DRY' | 'SOLD' | 'CULLED' | 'DEAD';
export type RecordScope = 'HERD' | 'GROUP' | 'ANIMAL';
export type MilkSession = 'MORNING' | 'EVENING';

export const EXPENSE_CATEGORIES = [
  'Labor', 'Vet & medicine', 'Fuel & electricity', 'Repairs', 'Rent', 'Transport', 'Other',
] as const;

// The scope rule: a production record points at exactly one level.
// HERD   -> no groupId, no animalId
// GROUP  -> groupId only
// ANIMAL -> animalId only
// Reports must aggregate one scope level per day, never mixing.
export function validateScope(
  scope: RecordScope,
  groupId?: string | null,
  animalId?: string | null,
): string | null {
  if (scope === 'HERD' && (groupId || animalId)) return 'Herd-scope records must not reference a group or animal';
  if (scope === 'GROUP' && (!groupId || animalId)) return 'Group-scope records require a groupId and no animalId';
  if (scope === 'ANIMAL' && (!animalId || groupId)) return 'Animal-scope records require an animalId and no groupId';
  return null;
}

// ---- money helpers (integer cents) ----
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}
export function centsToDisplay(cents: number, symbol = '$'): string {
  const neg = cents < 0;
  const v = (Math.abs(cents) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 });
  return `${neg ? '−' : ''}${symbol} ${v}`;
}

// ---- dates as YYYY-MM-DD strings at the API boundary ----
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
export function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// ---- dashboard payload shared between API and web ----
export interface DayTotals {
  date: string;
  milkLiters: number;
  soldLiters: number;
  revenueCents: number;
  feedCostCents: number;
  expenseCents: number;
  profitCents: number;
}
export interface DashboardPayload {
  today: DayTotals;
  series7d: DayTotals[];
  totalAnimals: number;
  milkingCount: number;
  unpaidCents: number;
}
