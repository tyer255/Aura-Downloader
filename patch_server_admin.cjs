const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const adminImports = `
import { IgApiClient } from 'instagram-private-api';
import jwt from 'jsonwebtoken';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_12345';

const CONFIG_FILE = path.join(process.cwd(), 'admin-config.json');

function getAdminConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch (e) {
      return { instagramEnabled: false, instagramState: null };
    }
  }
  return { instagramEnabled: false, instagramState: null };
}

function saveAdminConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Initialize IG Client
let igClient = null;

async function setupIgClient() {
  const config = getAdminConfig();
  if (config.instagramEnabled && config.instagramState) {
    igClient = new IgApiClient();
    igClient.state.generateDevice('admin_device');
    await igClient.state.deserialize(config.instagramState);
    console.log("Instagram client restored from saved state.");
  }
}
setupIgClient();

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const token = authHeader.split(' ')[1];
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
}
`;

const adminEndpoints = `
  app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body;
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ success: true, token });
    }
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  });

  app.get('/api/admin/status', (req, res) => {
    const config = getAdminConfig();
    res.json({ success: true, instagramEnabled: config.instagramEnabled });
  });

  app.post('/api/admin/ig-login', authenticateAdmin, async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: 'Missing credentials' });
    
    try {
      const ig = new IgApiClient();
      ig.state.generateDevice(username);
      await ig.simulate.preLoginFlow();
      const loggedInUser = await ig.account.login(username, password);
      
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
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post('/api/admin/ig-disable', authenticateAdmin, (req, res) => {
    const config = getAdminConfig();
    config.instagramEnabled = false;
    config.instagramState = null;
    saveAdminConfig(config);
    igClient = null;
    res.json({ success: true, message: 'Instagram integration disabled.' });
  });
`;

// Insert imports after Express import
code = code.replace(/import express from "express";/, 'import express from "express";\nimport fs from "fs";\n' + adminImports);

// Insert endpoints after app.use(express.json());
code = code.replace(/app\.use\(express\.json\(\)\);/, 'app.use(express.json());\n' + adminEndpoints);

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts with admin endpoints.");
