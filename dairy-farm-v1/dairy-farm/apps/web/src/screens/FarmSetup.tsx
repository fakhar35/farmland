import { useState } from 'react';
import { post } from '../api';
import { Farm, FarmMode } from '../types';

const MODES: [FarmMode, string, string][] = [
  ['HERD', 'Herd mode', 'Record milk, feed and costs as farm totals. Fastest daily entry.'],
  ['INDIVIDUAL', 'Individual mode', 'Track every animal separately — milk, health and cost per cow.'],
  ['HYBRID', 'Hybrid mode', 'Herd totals by default, with per-animal tracking whenever you need it.'],
];

export default function FarmSetup({ onCreated }: { onCreated: (f: Farm) => void }) {
  const [name, setName] = useState('');
  const [mode, setMode] = useState<FarmMode>('HYBRID');
  const [symbol, setSymbol] = useState('$');
  const [milkPrice, setMilkPrice] = useState('0.68');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setError(null);
    setBusy(true);
    try {
      const farm = await post<Farm>('/farms', {
        name: name.trim() || 'My Farm',
        mode,
        currencySymbol: symbol || '$',
        milkPriceCents: Math.round(parseFloat(milkPrice || '0') * 100),
      });
      onCreated(farm);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the farm');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="setup-wrap">
      <h1 style={{ fontSize: 26, marginBottom: 6 }}>Set up your farm</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 20 }}>
        A few questions and you're recording milk. Everything can be changed later.
      </p>
      <div className="field">
        <label>Farm name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Green Valley Dairy" />
      </div>
      <div className="row field">
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 5 }}>Currency symbol</label>
          <input value={symbol} onChange={(e) => setSymbol(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 5 }}>Default milk price / liter</label>
          <input type="number" step="0.01" min="0" value={milkPrice} onChange={(e) => setMilkPrice(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>How does this farm operate?</label>
        {MODES.map(([k, title, desc]) => (
          <div key={k} className={'modecard' + (mode === k ? ' on' : '')} onClick={() => setMode(k)}>
            <b>{title}</b>
            <span>{desc}</span>
          </div>
        ))}
      </div>
      {error && <div className="error">{error}</div>}
      <button className="btn block" disabled={busy} onClick={() => void create()}>
        Create farm
      </button>
    </div>
  );
}
