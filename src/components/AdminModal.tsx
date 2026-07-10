import React, { useState, useEffect } from 'react';
import { Settings, X, Lock, Instagram, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export function AdminModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [igUsername, setIgUsername] = useState('');
  const [igPassword, setIgPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [igStatus, setIgStatus] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'session'>('password');
  const [sessionId, setSessionId] = useState('');

  
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsLoggedIn(true);
      checkIgStatus();
    }
  }, [isOpen]);

  const checkIgStatus = async () => {
    try {
      const res = await fetch('/api/admin/status');
      const data = await res.json();
      if (data.success) {
        setIgStatus(data.instagramEnabled);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        setIsLoggedIn(true);
        checkIgStatus();
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (e) {
      setError('Network error');
    }
    setLoading(false);
  };

  const handleIgLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/ig-login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(loginMethod === 'password' ? { username: igUsername, password: igPassword } : { sessionId })
      });
      const data = await res.json();
      if (data.success) {
        setIgStatus(true);
        setIgUsername('');
        setIgPassword('');
      } else {
        setError(data.message || 'Instagram login failed');
      }
    } catch (e) {
      setError('Network error');
    }
    setLoading(false);
  };

  const handleIgDisable = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/ig-disable', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setIgStatus(false);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            Admin Panel
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {!isLoggedIn ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <p className="text-sm text-zinc-400 mb-6">Sign in to manage global settings and integrations.</p>
              {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm flex gap-2 items-start"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}</div>}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg mt-2 flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Sign In
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Instagram className={`w-5 h-5 ${igStatus ? 'text-pink-500' : 'text-zinc-500'}`} />
                    <h3 className="font-medium text-white">Instagram Integration</h3>
                  </div>
                  {igStatus ? (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Global Active
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-zinc-500 bg-zinc-800 px-2 py-1 rounded-full">
                      Disabled
                    </span>
                  )}
                </div>

                {igStatus ? (
                  <div className="space-y-4">
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Instagram features are globally enabled for all users. The session is securely stored on the server.
                    </p>
                    <button onClick={handleIgDisable} disabled={loading} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-2 rounded-lg text-sm font-medium transition-colors">
                      {loading ? 'Disabling...' : 'Disable Integration'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleIgLogin} className="space-y-3">
                    <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                      Log in to a real Instagram account to enable reel/post extraction globally.
                    </p>
                    
                    <div className="flex bg-zinc-900 rounded-lg p-1 mb-4">
                      <button type="button" onClick={() => setLoginMethod('password')} className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${loginMethod === 'password' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Password</button>
                      <button type="button" onClick={() => setLoginMethod('session')} className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${loginMethod === 'session' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Session ID</button>
                    </div>

                    {error && <div className="text-red-400 text-xs bg-red-500/10 p-2 rounded border border-red-500/20">{error}</div>}
                    
                    {loginMethod === 'password' ? (
                      <>
                        <div>
                          <input type="text" placeholder="IG Username" value={igUsername} onChange={e => setIgUsername(e.target.value)} required className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-pink-500" />
                        </div>
                        <div>
                          <input type="password" placeholder="IG Password" value={igPassword} onChange={e => setIgPassword(e.target.value)} required className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-pink-500" />
                        </div>
                      </>
                    ) : (
                      <div>
                        <input type="text" placeholder="sessionid cookie value" value={sessionId} onChange={e => setSessionId(e.target.value)} required className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-pink-500" />
                        <p className="text-[10px] text-zinc-500 mt-1">Get this from instagram.com cookies. On a phone, use an app like EditThisCookie (via Kiwi Browser) or do this once on a computer (DevTools → Application → Cookies → sessionid).</p>
                      </div>
                    )}
                    
                    <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-2 rounded-lg text-sm mt-2 disabled:opacity-50">
                      {loading ? 'Logging in...' : 'Enable globally'}
                    </button>
                  </form>
                )}
              </div>
              <button onClick={() => { localStorage.removeItem('adminToken'); setIsLoggedIn(false); }} className="w-full text-zinc-500 hover:text-zinc-300 text-xs font-medium">
                Sign out of Admin
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
