
const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Disable menu
Menu.setApplicationMenu(null);

// --- Data directory discovery (prefers OneDrive) ---
function guessOneDriveDir() {
  const env = process.env;
  // Common OneDrive env
  const candidates = [
    env.ONEDRIVE,
    env.OneDrive,
    path.join(os.homedir(), 'OneDrive'),
    path.join(os.homedir(), 'OneDrive - Personal'),
    path.join(os.homedir(), 'OneDrive - Kişisel'),
  ].filter(Boolean);
  for (const p of candidates) {
    try {
      if (p && fs.existsSync(p)) return p;
    } catch {}
  }
  return null;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

// Config path sits next to exe (portable) or project root (dev)
const appRoot = path.dirname(app.getPath('exe'));
const configPath = path.join(appRoot, 'config.json');
let config = {};
try {
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
} catch {}

// Decide data folder
let baseDataDir = config.dataDir;
if (!baseDataDir) {
  const od = guessOneDriveDir();
  if (od) baseDataDir = path.join(od, 'BirlesikProgramData');
  else baseDataDir = path.join(app.getPath('documents'), 'BirlesikProgramData');
}
ensureDir(baseDataDir);

// JSON DB file (simple) and SQLite DB file (robust). You can use either via API.
const jsonDB = path.join(baseDataDir, 'db.json');
const sqliteDB = path.join(baseDataDir, 'db.sqlite3');

// Init JSON db if missing
if (!fs.existsSync(jsonDB)) fs.writeFileSync(jsonDB, JSON.stringify({ records: [] }, null, 2));

// Setup SQLite (optional but robust for big data)
let sql;
try {
  const Database = require('better-sqlite3');
  sql = new Database(sqliteDB);
  sql.pragma('journal_mode = WAL');
  sql.exec(`CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    createdAt INTEGER NOT NULL
  )`);
} catch (e) {
  console.warn('SQLite init failed (optional):', e.message);
}

// --- IPC endpoints (bridge) ---
function readJSON() {
  try {
    const raw = fs.readFileSync(jsonDB, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { records: [] };
  }
}
function writeJSON(obj) {
  fs.writeFileSync(jsonDB, JSON.stringify(obj, null, 2));
}

ipcMain.handle('db:list', async () => {
  const data = readJSON();
  return data.records;
});

ipcMain.handle('db:add', async (_e, rec) => {
  const data = readJSON();
  const id = rec.id || String(Date.now()) + '-' + Math.random().toString(16).slice(2);
  const createdAt = rec.createdAt || Date.now();
  const payload = { ...rec, id, createdAt };
  data.records.unshift(payload);
  writeJSON(data);
  // mirror to sqlite if available
  try {
    if (sql) {
      sql.prepare('INSERT OR REPLACE INTO records (id, payload, createdAt) VALUES (?,?,?)')
         .run(id, JSON.stringify(rec), createdAt);
    }
  } catch {}
  return payload;
});

ipcMain.handle('db:update', async (_e, rec) => {
  const data = readJSON();
  const idx = data.records.findIndex(r => r.id === rec.id);
  if (idx >= 0) {
    data.records[idx] = { ...data.records[idx], ...rec };
    writeJSON(data);
    try {
      if (sql) {
        sql.prepare('INSERT OR REPLACE INTO records (id, payload, createdAt) VALUES (?,?,?)')
           .run(rec.id, JSON.stringify(data.records[idx]), data.records[idx].createdAt || Date.now());
      }
    } catch {}
    return data.records[idx];
  }
  throw new Error('Not found');
});

ipcMain.handle('db:remove', async (_e, id) => {
  const data = readJSON();
  const next = data.records.filter(r => r.id !== id);
  writeJSON({ records: next });
  try {
    if (sql) sql.prepare('DELETE FROM records WHERE id=?').run(id);
  } catch {}
  return true;
});

ipcMain.handle('sys:paths', async () => {
  return {
    baseDataDir,
    jsonDB,
    sqliteDB,
    configPath,
    appRoot
  };
});

function createWindow () {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
    icon: path.join(__dirname, 'icon.ico')
  });

  win.loadFile(path.join(__dirname, 'app', 'birlesik_program_bulut_sultan_v11.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
