import { useEffect, useState } from 'react';
import { get } from '../api';
import { DashboardPayload, Farm } from '../types';

interface Expense { date: string; category: string; amountCents: number; }
interface FeedRec { date: string; costCents: number; }

const money = (cents: number, sym: string) =>
  `${sym} ${(Math.abs(cents) / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function Reports({ farm }: { farm: Farm }) {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [feed, setFeed] = useState<FeedRec[]>([]);
  const [error, setError] = useState<string | null>(null);
  const sym = farm.currencySymbol;

  useEffect(() => {
    const from = new Date();
    from.setDate(from.getDate() - 6);
    const fromStr = from.toISOString().slice(0, 10);
    const toStr = new Date().toISOString().slice(0, 10);
    Promise.all([
      get<DashboardPayload>(`/farms/${farm.id}/dashboard`),
      get<Expense[]>(`/farms/${farm.id}/expenses?from=${fromStr}&to=${toStr}`),
      get<FeedRec[]>(`/farms/${farm.id}/feed?from=${fromStr}&to=${toStr}`),
    ])
      .then(([d, e, f]) => { setData(d); setExpenses(e); setFeed(f); })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load reports'));
  }, [farm.id]);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="empty">Building your reports…</div>;

  const milk7 = data.series7d.reduce((s, d) => s + d.milkLiters, 0);
  const rev7 = data.series7d.reduce((s, d) => s + d.revenueCents, 0);
  const cost7 = data.series7d.reduce((s, d) => s + d.feedCostCents + d.expenseCents, 0);
  const profit7 = rev7 - cost7;
  const costPerL = milk7 ? cost7 / milk7 : 0;
  const maxAbs = Math.max(...data.series7d.map((d) => Math.abs(d.profitCents)), 1);

  const byCat: Record<string, number> = {};
  expenses.forEach((e) => { byCat[e.category] = (byCat[e.category] ?? 0) + e.amountCents; });
  const feedTotal = feed.reduce((s, f) => s + f.costCents, 0);
  if (feedTotal) byCat['Feed'] = (byCat['Feed'] ?? 0) + feedTotal;

  return (
    <>
      <div className="grid4">
        <div className="card stat">
          <div className="lbl">7-day milk</div>
          <div className="val">{milk7.toLocaleString(undefined, { maximumFractionDigits: 0 })} L</div>
        </div>
        <div className="card stat">
          <div className="lbl">7-day revenue</div>
          <div className="val">{money(rev7, sym)}</div>
        </div>
        <div className="card stat">
          <div className="lbl">7-day profit</div>
          <div className="val" style={{ color: profit7 < 0 ? 'var(--alert)' : 'var(--pasture)' }}>
            {profit7 < 0 ? '−' : ''}{money(profit7, sym)}
          </div>
        </div>
        <div className="card stat">
          <div className="lbl">Cost per liter</div>
          <div className="val">{sym} {(costPerL / 100).toFixed(2)}</div>
          <div className="sub">feed + expenses ÷ milk</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15 }}>Daily profit — last 7 days</h3>
        <div className="barwrap">
          {data.series7d.map((d) => (
            <div className="barcol" key={d.date}>
              <div
                className={'bar' + (d.profitCents < 0 ? ' amber' : '')}
                style={{ height: `${(Math.abs(d.profitCents) / maxAbs) * 100}%` }}
                title={money(d.profitCents, sym)}
              />
              <div className="barlbl">{d.date.slice(8)}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 8 }}>Amber bars are loss days.</p>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, marginBottom: 10 }}>Cost breakdown (7 days)</h3>
        {Object.keys(byCat).length === 0 ? (
          <div className="empty">No costs recorded yet this week.</div>
        ) : (
          <table className="tbl">
            <thead><tr><th>Category</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
            <tbody>
              {Object.entries(byCat)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, cents]) => (
                  <tr key={cat}>
                    <td>{cat}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{money(cents, sym)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
