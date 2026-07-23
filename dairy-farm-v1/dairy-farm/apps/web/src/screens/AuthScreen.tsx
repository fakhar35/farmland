import { useState } from 'react';
import { post, setToken } from '../api';

interface AuthResponse {
  token: string;
  user: { id: string; email: string; name: string };
}

export default function AuthScreen({ onAuthed }: { onAuthed: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      const body = mode === 'login' ? { email, password } : { email, password, name };
      const res = await post<AuthResponse>(`/auth/${mode}`, body);
      setToken(res.token);
      onAuthed();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="setup-wrap">
      <h1 style={{ fontSize: 26, marginBottom: 6 }}>Dairy Farm Manager</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 20 }}>
        {mode === 'login' ? 'Log in to your farm.' : 'Create your account — the farm comes next.'}
      </p>
      {mode === 'register' && (
        <div className="field">
          <label>Your name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </div>
      )}
      <div className="field">
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </div>
      <div className="field">
        <label>Password {mode === 'register' && '(at least 8 characters)'}</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          onKeyDown={(e) => e.key === 'Enter' && void submit()}
        />
      </div>
      {error && <div className="error">{error}</div>}
      <button className="btn block" disabled={busy} onClick={() => void submit()}>
        {mode === 'login' ? 'Log in' : 'Create account'}
      </button>
      <p style={{ marginTop: 14, fontSize: 13, textAlign: 'center', color: 'var(--ink-soft)' }}>
        {mode === 'login' ? (
          <>New here?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); setMode('register'); setError(null); }}>Create an account</a>
          </>
        ) : (
          <>Already have an account?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); setError(null); }}>Log in</a>
          </>
        )}
      </p>
    </div>
  );
}
