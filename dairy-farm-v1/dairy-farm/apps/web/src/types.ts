export type FarmMode = 'HERD' | 'INDIVIDUAL' | 'HYBRID';
export type RecordScope = 'HERD' | 'GROUP' | 'ANIMAL';

export interface Farm {
  id: string;
  name: string;
  mode: FarmMode;
  currencySymbol: string;
  milkPriceCents: number;
}

export interface HerdGroup {
  id: string;
  name: string;
  type: string;
  headcount: number;
  _count?: { animals: number };
}

export interface Animal {
  id: string;
  tag: string;
  name: string | null;
  breed: string | null;
  status: string;
  group?: { id: string; name: string } | null;
}

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
