import { useCallback, useEffect, useState } from 'react';
import { get, patch, post } from '../api';
import { Animal, Farm, HerdGroup } from '../types';

const TYPES: [string, string][] = [
  ['MILKING', 'Milking'], ['DRY', 'Dry'], ['HEIFER', 'Heifer'], ['CALF', 'Calf'], ['SICK', 'Sick bay'], ['OTHER', 'Other'],
];

export default function Herd({ farm, notify }: { farm: Farm; notify: (m: string) => void }) {
  const [groups, setGroups] = useState<HerdGroup[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [gName, setGName] = useState('');
  const [gType, setGType] = useState('MILKING');
  const [aTag, setATag] = useState('');
  const [aGroup, setAGroup] = useState('');

  const load = useCallback(async () => {
    try {
      const [g, a] = await Promise.all([
        get<HerdGroup[]>(`/farms/${farm.id}/groups`),
        farm.mode !== 'HERD' ? get<Animal[]>(`/farms/${farm.id}/animals`) : Promise.resolve([]),
      ]);
      setGroups(g);
      setAnimals(a);
      if (!aGroup && g[0]) setAGroup(g[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the herd');
    }
  }, [farm.id, farm.mode, aGroup]);

  useEffect(() => { void load(); }, [load]);

  const bump = async (g: HerdGroup, delta: number) => {
    const headcount = Math.max(0, g.headcount + delta);
    await patch(`/farms/${farm.id}/groups/${g.id}`, { headcount });
    void load();
  };

  return (
    <>
      {error && <div className="error">{error}</div>}
      <div className="card">
        <h3 style={{ fontSize: 16, marginBottom: 10 }}>Herd groups</h3>
        <table className="tbl">
          <thead>
            <tr><th>Group</th><th>Type</th><th>Animals</th><th></th></tr>
          </thead>
          <tbody>
            {groups.map((g) => {
              const registered = g._count?.animals ?? 0;
              return (
                <tr key={g.id}>
                  <td style={{ fontWeight: 700 }}>{g.name}</td>
                  <td>
                    <span className={'tag' + (g.type === 'MILKING' ? ' green' : g.type === 'SICK' ? ' red' : '')}>
                      {g.type.toLowerCase()}
                    </span>
                  </td>
                  <td>
                    {registered > 0 ? `${registered} tracked` : g.headcount}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {registered === 0 && (
                      <>
                        <button className="btn ghost small" onClick={() => void bump(g, -1)} aria-label={`Remove one from ${g.name}`}>−</button>{' '}
                        <button className="btn ghost small" onClick={() => void bump(g, 1)} aria-label={`Add one to ${g.name}`}>+</button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="row" style={{ marginTop: 14 }}>
          <input placeholder="New group name" value={gName} onChange={(e) => setGName(e.target.value)} />
          <select value={gType} onChange={(e) => setGType(e.target.value)}>
            {TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <button
            className="btn"
            onClick={async () => {
              if (!gName.trim()) return;
              await post(`/farms/${farm.id}/groups`, { name: gName.trim(), type: gType });
              setGName('');
              notify('Group added');
              void load();
            }}
          >
            Add group
          </button>
        </div>
      </div>

      {farm.mode !== 'HERD' && (
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 4 }}>Tracked animals</h3>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 10 }}>
            Optional in {farm.mode.toLowerCase()} mode — add only the animals you want to follow individually.
          </p>
          {animals.length === 0 ? (
            <div className="empty">No tracked animals yet. Add a tag below to start.</div>
          ) : (
            <table className="tbl">
              <thead><tr><th>Tag</th><th>Name</th><th>Breed</th><th>Status</th><th>Group</th></tr></thead>
              <tbody>
                {animals.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 700 }}>{a.tag}</td>
                    <td>{a.name ?? '—'}</td>
                    <td>{a.breed ?? '—'}</td>
                    <td><span className="tag">{a.status.toLowerCase()}</span></td>
                    <td>{a.group?.name ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="row" style={{ marginTop: 14 }}>
            <input placeholder="Tag / ID (e.g. C-120)" value={aTag} onChange={(e) => setATag(e.target.value)} />
            <select value={aGroup} onChange={(e) => setAGroup(e.target.value)}>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <button
              className="btn"
              onClick={async () => {
                if (!aTag.trim()) return;
                await post(`/farms/${farm.id}/animals`, { tag: aTag.trim(), groupId: aGroup || undefined });
                setATag('');
                notify('Animal added');
                void load();
              }}
            >
              Add animal
            </button>
          </div>
        </div>
      )}
    </>
  );
}
