const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { exec } = require('child_process');
const os = require('os');

const app = express();
const PORT = 3000;
const CLIENTS_FILE = path.join(__dirname, 'clients.json');
const HOSTNAME = os.hostname(); // Client hostname

// ==== SERVER QISMI ====

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function loadClients() {
  if (!fs.existsSync(CLIENTS_FILE)) return {};
  return JSON.parse(fs.readFileSync(CLIENTS_FILE));
}

function saveClients(data) {
  fs.writeFileSync(CLIENTS_FILE, JSON.stringify(data, null, 2));
}

app.get('/check-lock', (req, res) => {
  const hostname = req.headers['user-agent'];
  const clients = loadClients();

  if (!clients[hostname]) {
    clients[hostname] = { lock: false, lastSeen: new Date().toISOString() };
  } else {
    clients[hostname].lastSeen = new Date().toISOString();
  }

  saveClients(clients);

  const shouldLock = clients[hostname].lock === true;
  console.log(`[${hostname}] lock = ${shouldLock}`);
  res.json({ lock: shouldLock });
});

app.post('/lock/:hostname', (req, res) => {
  const hostname = req.params.hostname;
  const clients = loadClients();
  if (!clients[hostname]) clients[hostname] = {};
  clients[hostname].lock = true;
  saveClients(clients);
  console.log(`[${hostname}] LOCK buyrug'i berildi.`);
  res.send(`${hostname} endi LOCK qilinadi.`);
});

app.post('/unlock/:hostname', (req, res) => {
  const hostname = req.params.hostname;
  const clients = loadClients();
  if (!clients[hostname]) clients[hostname] = {};
  clients[hostname].lock = false;
  saveClients(clients);
  console.log(`[${hostname}] UNLOCK qilindi.`);
  res.send(`${hostname} endi UNLOCK.`);
});

app.get('/clients', (req, res) => {
  const clients = loadClients();
  res.json(clients);
});

app.listen(PORT, () => {
  console.log(`✅ Server http://localhost:${PORT} da ishlayapti`);
});

// ==== CLIENT QISMI ====

async function checkLock() {
  try {
    const res = await axios.get(`https://oq-ysum.onrender.com/check-lock`, {
      headers: {
        'User-Agent': HOSTNAME
      }
    });

    if (res.data.lock === true) {
      console.log('🔒 LOCK buyrugi olindi, tizim qulf qilinmoqda...');
      exec('rundll32.exe user32.dll,LockWorkStation');
    } else {
      console.log('🔓 LOCK yoq');
    }
  } catch (err) {
    console.error('Xatolik:', err.message);
  }
}

app.get('/refresh', (req, res) => {
  console.log(`[HEALTH CHECK] ${new Date().toLocaleTimeString()} - Server hali tirik`);
  res.send('Server tirik ✅');
});


// Har 5 sekundda tekshiradi
setInterval(checkLock, 5000);
