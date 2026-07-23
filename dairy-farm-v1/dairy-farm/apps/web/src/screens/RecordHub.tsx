import { useEffect, useState } from 'react';
import { get, post } from '../api';
import { Farm, HerdGroup, RecordScope } from '../types';

const CATEGORIES = ['Labor', 'Vet & medicine', 'Fuel & electricity', 'Repairs', 'Rent', 'Transport', 'Other'];
const today = () => new Date().toISOString().slice(0, 10);

type Kind = 'milk' | 'feed' | 'expense' | 'sale';

export default function RecordHub({ farm, notify }: { farm: Farm; notify: (m: string) => void }) {
  const [kind, setKind] = useState<Kind>('milk');
  const [groups, setGroups] = useState<HerdGroup[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    get<HerdGroup[]>(`/farms/${farm.id}/groups`).then(setGroups).catch(() => setGroups([]));
  }, [farm.id]);

  const kinds: [Kind, string][] = [['milk', 'Milk'], ['feed', 'Feed'], ['expense', 'Expense'], ['sale', 'Sale']];

  const save = async (path: string, body: unknown, done: () => void, label: string) => {
    setError(null);
    try {
      await post(`/farms/${farm.id}/${path}`, body);
      notify(label);
      done();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    }
  };

  return (
    <>
      <div className="pillrow">
        {kinds.map(([k, l]) => (
          <button key={k} className={'pill' + (kind === k ? ' on' : '')} onClick={() => { setKind(k); setError(null); }}>
            {l}
          </button>
        ))}
      </div>
      {error && <div className="error">{error}</div>}
      {kind === 'milk' && <MilkForm groups={groups} save={save} />}
      {kind === 'feed' && <FeedForm groups={groups} sym={farm.currencySymbol} save={save} />}
      {kind === 'expense' && <ExpenseForm sym={farm.currencySymbol} save={save} />}
      {kind === 'sale' && <SaleForm farm={farm} save={save} />}
    </>
  );
}

type SaveFn = (path: string, body: unknown, done: () => void, label: string) => Promise<void>;

function ScopePicker({
  scope, setScope, groupId, setGroupId, groups,
}: {
  scope: RecordScope;
  setScope: (s: RecordScope) => void;
  groupId: string;
  setGroupId: (g: string) => void;
  groups: HerdGroup[];
}) {
  return (
    <>
      <div className="field">
        <label>Record for</label>
        <div className="pillrow" style={{ marginBottom: 0 }}>
          <button className={'pill' + (scope === 'HERD' ? ' on' : '')} onClick={() => setScope('HERD')}>Whole herd</button>
          <button className={'pill' + (scope === 'GROUP' ? ' on' : '')} onClick={() => setScope('GROUP')}>One group</button>
        </div>
      </div>
      {scope === 'GROUP' && (
        <div className="field">
          <label>Group</label>
          <select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
      )}
    </>
  );
}

function MilkForm({ groups, save }: { groups: HerdGroup[]; save: SaveFn }) {
  const [date, setDate] = useState(today());
  const [session, setSession] = useState<'MORNING' | 'EVENING'>('MORNING');
  const [scope, setScope] = useState<RecordScope>('HERD');
  const [groupId, setGroupId] = useState('');
  const [litersStr, setLitersStr] = useState('');
  useEffect(() => { if (!groupId && groups[0]) setGroupId(groups[0].id); }, [groups, groupId]);

  return (
    <div className="card">
      <h3 style={{ marginBottom: 12, fontSize: 16 }}>Record milk</h3>
      <div className="row field">
        <div>
          <label style={lbl}>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Session</label>
          <select value={session} onChange={(e) => setSession(e.target.value as 'MORNING' | 'EVENING')}>
            <option value="MORNING">Morning</option>
            <option value="EVENING">Evening</option>
          </select>
        </div>
      </div>
      <ScopePicker scope={scope} setScope={setScope} groupId={groupId} setGroupId={setGroupId} groups={groups} />
      <div className="field">
        <label>Liters</label>
        <input type="number" min="0" value={litersStr} onChange={(e) => setLitersStr(e.target.value)} placeholder="e.g. 220" />
      </div>
      <button
        className="btn"
        onClick={() => {
          const liters = parseFloat(litersStr);
          if (!liters || liters <= 0) return;
          void save(
            'milk',
            { date, session, scope, groupId: scope === 'GROUP' ? groupId : undefined, liters },
            () => setLitersStr(''),
            'Milk recorded',
          );
        }}
      >
        Save milk record
      </button>
    </div>
  );
}

function FeedForm({ groups, sym, save }: { groups: HerdGroup[]; sym: string; save: SaveFn }) {
  const [date, setDate] = useState(today());
  const [scope, setScope] = useState<RecordScope>('HERD');
  const [groupId, setGroupId] = useState('');
  const [feedType, setFeedType] = useState('Mixed ration');
  const [kg, setKg] = useState('');
  const [cost, setCost] = useState('');
  useEffect(() => { if (!groupId && groups[0]) setGroupId(groups[0].id); }, [groups, groupId]);

  return (
    <div className="card">
      <h3 style={{ marginBottom: 12, fontSize: 16 }}>Record feed</h3>
      <div className="field">
        <label>Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <ScopePicker scope={scope} setScope={setScope} groupId={groupId} setGroupId={setGroupId} groups={groups} />
      <div className="row field">
        <div>
          <label style={lbl}>Feed type</label>
          <input value={feedType} onChange={(e) => setFeedType(e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Quantity (kg)</label>
          <input type="number" min="0" value={kg} onChange={(e) => setKg(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Total cost ({sym})</label>
        <input type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="cost of feed used today" />
      </div>
      <button
        className="btn"
        onClick={() => {
          const quantityKg = parseFloat(kg || '0');
          const costCents = Math.round(parseFloat(cost || '0') * 100);
          if (!quantityKg && !costCents) return;
          void save(
            'feed',
            { date, scope, groupId: scope === 'GROUP' ? groupId : undefined, feedType, quantityKg, costCents },
            () => { setKg(''); setCost(''); },
            'Feed recorded',
          );
        }}
      >
        Save feed record
      </button>
    </div>
  );
}

function ExpenseForm({ sym, save }: { sym: string; save: SaveFn }) {
  const [date, setDate] = useState(today());
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  return (
    <div className="card">
      <h3 style={{ marginBottom: 12, fontSize: 16 }}>Record expense</h3>
      <div className="row field">
        <div>
          <label style={lbl}>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="field">
        <label>Amount ({sym})</label>
        <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div className="field">
        <label>Note (optional)</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <button
        className="btn"
        onClick={() => {
          const amountCents = Math.round(parseFloat(amount || '0') * 100);
          if (!amountCents) return;
          void save(
            'expenses',
            { date, category, amountCents, note: note || undefined },
            () => { setAmount(''); setNote(''); },
            'Expense recorded',
          );
        }}
      >
        Save expense
      </button>
    </div>
  );
}

function SaleForm({ farm, save }: { farm: Farm; save: SaveFn }) {
  const [date, setDate] = useState(today());
  const [litersStr, setLitersStr] = useState('');
  const [price, setPrice] = useState((farm.milkPriceCents / 100).toFixed(2));
  const [customer, setCustomer] = useState('');
  const [paid, setPaid] = useState(true);
  const total = (parseFloat(litersStr || '0') * parseFloat(price || '0')) || 0;

  return (
    <div className="card">
      <h3 style={{ marginBottom: 12, fontSize: 16 }}>Record milk sale</h3>
      <div className="field">
        <label>Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="row field">
        <div>
          <label style={lbl}>Liters sold</label>
          <input type="number" min="0" value={litersStr} onChange={(e) => setLitersStr(e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Price per liter ({farm.currencySymbol})</label>
          <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Customer</label>
        <input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="e.g. Valley Dairy Co-op" />
      </div>
      <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} id="paidchk" />
        <label htmlFor="paidchk" style={{ margin: 0, fontSize: 14, color: 'var(--ink)' }}>Paid now</label>
      </div>
      <div style={{ fontSize: 14, marginBottom: 12, color: 'var(--ink-soft)' }}>
        Total: <b style={{ color: 'var(--ink)' }}>{farm.currencySymbol} {total.toFixed(2)}</b>
      </div>
      <button
        className="btn"
        onClick={() => {
          const liters = parseFloat(litersStr);
          const priceCentsPerLiter = Math.round(parseFloat(price || '0') * 100);
          if (!liters || !priceCentsPerLiter) return;
          void save(
            'sales',
            { date, liters, priceCentsPerLiter, customerName: customer || undefined, paid },
            () => setLitersStr(''),
            'Sale recorded',
          );
        }}
      >
        Save sale
      </button>
    </div>
  );
}

const lbl: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 5,
};
