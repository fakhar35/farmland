import { useEffect, useState } from 'react';
import { get } from '../api';
import { DashboardPayload, Farm } from '../types';

const money = (cents: number, sym: string) =>
  `${sym} ${(Math.abs(cents) / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const liters = (l: number) => `${l.toLocaleString(undefined, { maximumFractionDigits: 1 })} L`;

export default function Dashboard({ farm }: { farm: Farm }) {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sym = farm.currencySymbol;

  useEffect(() => {
    get<DashboardPayload>(`/farms/${farm.id}/dashboard`)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load the dashboard'));
  }, [farm.id]);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="empty">Loading today's numbers…</div>;

  const t = data.today;
  const costs = t.feedCostCents + t.expenseCents;
  const maxMilk = Math.max(...data.series7d.map((d) => d.milkLiters), 1);

  return (
    <>
      <div className="ledger">
        <div className="day">Today · {t.date}</div>
        <div className={'profit' + (t.profitCents < 0 ? ' neg' : '')}>
          {t.profitCents < 0 ? '−' : ''}{money(t.profitCents, sym)}
        </div>
        <div style={{ fontSize: 13, opacity: 0.9 }}>today's profit</div>
        <div className="flow">
          <div>Milk produced<b>{liters(t.milkLiters)}</b></div>
          <div>Milk sold<b>{liters(t.soldLiters)}</b></div>
          <div>Revenue<b>{money(t.revenueCents, sym)}</b></div>
          <div>Feed + expenses<b>{money(costs, sym)}</b></div>
        </div>
      </div>

      <div className="grid4">
        <div className="card stat">
          <div className="lbl">Total animals</div>
          <div className="val">{data.totalAnimals}</div>
          <div className="sub">{data.milkingCount} milking</div>
        </div>
        <div className="card stat">
          <div className="lbl">Avg / milking cow</div>
          <div className="val">
            {data.milkingCount ? (t.milkLiters / data.milkingCount).toFixed(1) : '0'} L
          </div>
          <div className="sub">today</div>
        </div>
        <div className="card stat">
          <div className="lbl">Milk balance</div>
          <div className="val">{liters(t.milkLiters - t.soldLiters)}</div>
          <div className="sub">unsold / on-farm use</div>
        </div>
        <div className="card stat">
          <div className="lbl">Outstanding</div>
          <div className="val" style={{ color: data.unpaidCents ? 'var(--alert)' : 'inherit' }}>
            {money(data.unpaidCents, sym)}
          </div>
          <div className="sub">unpaid sales</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15 }}>Milk — last 7 days</h3>
        <div className="barwrap">
          {data.series7d.map((d) => (
            <div className="barcol" key={d.date}>
              <div className="bar" style={{ height: `${(d.milkLiters / maxMilk) * 100}%` }} title={liters(d.milkLiters)} />
              <div className="barlbl">{d.date.slice(8)}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
