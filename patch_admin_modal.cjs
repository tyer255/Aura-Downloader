const fs = require('fs');
let code = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

const sessionState = `
  const [loginMethod, setLoginMethod] = useState<'password' | 'session'>('password');
  const [sessionId, setSessionId] = useState('');
`;

code = code.replace(/const \[igStatus, setIgStatus\] = useState\(false\);/, "const [igStatus, setIgStatus] = useState(false);" + sessionState);

code = code.replace(/body: JSON\.stringify\(\{ username: igUsername, password: igPassword \}\)/, "body: JSON.stringify(loginMethod === 'password' ? { username: igUsername, password: igPassword } : { sessionId })");

const renderLogin = `
                  <form onSubmit={handleIgLogin} className="space-y-3">
                    <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                      Log in to a real Instagram account to enable reel/post extraction globally.
                    </p>
                    
                    <div className="flex bg-zinc-900 rounded-lg p-1 mb-4">
                      <button type="button" onClick={() => setLoginMethod('password')} className={\`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors \${loginMethod === 'password' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}\`}>Password</button>
                      <button type="button" onClick={() => setLoginMethod('session')} className={\`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors \${loginMethod === 'session' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}\`}>Session ID</button>
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
                        <p className="text-[10px] text-zinc-500 mt-1">Get this from instagram.com cookies (Application tab in DevTools -> Cookies -> sessionid)</p>
                      </div>
                    )}
                    
                    <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-2 rounded-lg text-sm mt-2 disabled:opacity-50">
                      {loading ? 'Logging in...' : 'Enable globally'}
                    </button>
                  </form>
`;

code = code.replace(/<form onSubmit=\{handleIgLogin\} className="space-y-3">[\s\S]*?<\/form>/, renderLogin.trim());

fs.writeFileSync('src/components/AdminModal.tsx', code);
console.log("Patched AdminModal.tsx with Session ID support.");
