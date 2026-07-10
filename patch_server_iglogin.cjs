const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const loginEndpoint = `
  app.post('/api/admin/ig-login', authenticateAdmin, async (req, res) => {
    const { username, password, sessionId } = req.body;
    
    try {
      const ig = new IgApiClient();
      
      if (sessionId) {
        ig.state.generateDevice('session_user');
        // Set the sessionid cookie manually
        const cookieStr = JSON.stringify({
          "cookies": [
            {
              "key": "sessionid",
              "value": sessionId,
              "domain": "instagram.com",
              "path": "/",
              "hostOnly": false,
              "creation": new Date().toISOString(),
              "lastAccessed": new Date().toISOString()
            }
          ]
        });
        await ig.state.deserializeCookieJar(cookieStr);
        // Verify it works by fetching current user info
        const currentUser = await ig.account.currentUser();
        console.log("Logged in via session ID as:", currentUser.username);
      } else {
        if (!username || !password) return res.status(400).json({ success: false, message: 'Missing credentials' });
        ig.state.generateDevice(username);
        await ig.simulate.preLoginFlow();
        await ig.account.login(username, password);
      }
      
      const serialized = await ig.state.serialize();
      
      const config = getAdminConfig();
      config.instagramEnabled = true;
      config.instagramState = serialized;
      saveAdminConfig(config);
      
      // Update running client
      igClient = ig;
      
      res.json({ success: true, message: 'Instagram login successful and enabled globally.' });
    } catch (e) {
      console.error('IG Login error:', e.message);
      let errorMsg = e.message;
      if (errorMsg.includes('linked Facebook account')) {
        errorMsg = 'This account is linked to Facebook. Please use an account with a direct Instagram password, or log in using a Session ID (cookie).';
      } else if (errorMsg.includes('checkpoint_required')) {
        errorMsg = 'Instagram requires verification (checkpoint). Please log in via the official app first, or use a Session ID.';
      } else if (errorMsg.includes('challenge_required')) {
        errorMsg = 'Instagram requires a challenge. Please log in via the official app, approve the login, or use a Session ID.';
      }
      res.status(500).json({ success: false, message: errorMsg });
    }
  });
`;

code = code.replace(/app\.post\('\/api\/admin\/ig-login'[\s\S]*?res\.json\(\{ success: true, message: 'Instagram integration disabled\.' \}\);\n  \}\);/, 
  loginEndpoint.trim() + `\n\n  app.post('/api/admin/ig-disable', authenticateAdmin, (req, res) => {
    const config = getAdminConfig();
    config.instagramEnabled = false;
    config.instagramState = null;
    saveAdminConfig(config);
    igClient = null;
    res.json({ success: true, message: 'Instagram integration disabled.' });
  });`);

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts with better IG login handler.");
