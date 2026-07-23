import { useCallback, useEffect, useState } from 'react';
import { get, getToken, setToken } from './api';
import { Farm } from './types';
import AuthScreen from './screens/AuthScreen';
import FarmSetup from './screens/FarmSetup';
import Dashboard from './screens/Dashboard';
import RecordHub from './screens/RecordHub';
import Herd from './screens/Herd';
import Reports from './screens/Reports';

type Tab = 'dashboard' | 'record' | 'herd' | 'reports';

export default function App() {
  const [authed, setAuthed] = useState<boolean>(() => !!getToken());
  const [farm, setFarm] = useState<Farm | null>(null);
  const [loadingFarm, setLoadingFarm] = useState(false);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [toast, setToast] = useState<string | null>(null);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const loadFarm = useCallback(async () => {
    setLoadingFarm(true);
    try {
      const farms = await get<Farm[]>('/farms/mine');
      setFarm(farms[0] ?? null);
    } catch {
      // token invalid or expired — return to login
      setToken(null);
      setAuthed(false);
    } finally {
      setLoadingFarm(false);
    }
  }, []);

  useEffect(() => {
    if (authed) void loadFarm();
  }, [authed, loadFarm]);

  const logout = () => {
    setToken(null);
    setAuthed(false);
    setFarm(null);
  };

  if (!authed) return <AuthScreen onAuthed={() => setAuthed(true)} />;
  if (loadingFarm) return <div className="empty" style={{ paddingTop: 80 }}>Loading your farm…</div>;
  if (!farm) return <FarmSetup onCreated={(f) => setFarm(f)} />;

  const tabs: [Tab, string][] = [
    ['dashboard', 'Dashboard'],
    ['record', 'Record'],
    ['herd', 'Herd'],
    ['reports', 'Reports'],
  ];

  return (
    <div className="app">
      <div className="top">
        <div className="farm">{farm.name}</div>
        <div className="right">
          <div className="mode">{farm.mode.toLowerCase()} mode</div>
          <button className="logout" onClick={logout}>Log out</button>
        </div>
      </div>
      <div className="nav">
        {tabs.map(([k, label]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </div>
      <div className="main">
        {tab === 'dashboard' && <Dashboard farm={farm} />}
        {tab === 'record' && <RecordHub farm={farm} notify={notify} />}
        {tab === 'herd' && <Herd farm={farm} notify={notify} />}
        {tab === 'reports' && <Reports farm={farm} />}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
