// ==== KERAKLI MODULLAR ====
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

// ==== FUNKSIYALAR ====

function loadClients() {
  if (!fs.existsSync(CLIENTS_FILE)) return {};
  return JSON.parse(fs.readFileSync(CLIENTS_FILE));
}

function saveClients(data) {
  fs.writeFileSync(CLIENTS_FILE, JSON.stringify(data, null, 2));
}

// ==== SERVER QISMI ====

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// GET /check-lock - mijozlar lock bo'lish kerakmi, tekshiradi
app.get('/check-lock', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  if (!ip) {
    return res.status(400).send('❌ IP manzil topilmadi');
  }

  const clients = loadClients();

  if (!clients[ip]) {
    clients[ip] = { lock: false, lastSeen: new Date().toISOString() };
  } else {
    clients[ip].lastSeen = new Date().toISOString();
  }

  saveClients(clients);

  const shouldLock = clients[ip].lock === true;
  console.log(`[${ip}] lock = ${shouldLock}`);
  res.json({ lock: shouldLock });
});


// POST /lock/:hostname - kompyuterni qulflash
app.post('/lock/:ip', (req, res) => {
  const ip = req.params.ip;
  const clients = loadClients();
  if (!clients[ip]) clients[ip] = {};
  clients[ip].lock = true;
  saveClients(clients);
  console.log(`[${ip}] LOCK buyrug'i berildi.`);
  res.send(`${ip} endi LOCK qilinadi.`);
});

app.post('/unlock/:ip', (req, res) => {
  const ip = req.params.ip;
  const clients = loadClients();
  if (!clients[ip]) clients[ip] = {};
  clients[ip].lock = false;
  saveClients(clients);
  console.log(`[${ip}] UNLOCK qilindi.`);
  res.send(`${ip} endi UNLOCK.`);
});

// GET /clients - barcha mijozlar holati
app.get('/clients', (req, res) => {
  const clients = loadClients();
  res.json(clients);
});

// GET /refresh - server tirikligini tekshirish
app.get('/refresh', (req, res) => {
  console.log(`[HEALTH CHECK] ${new Date().toLocaleTimeString()} - Server hali tirik`);
  res.send('Server tirik ✅');
});

// ==== CLIENT QISMI ====

async function checkLock() {
  try {
    const res = await axios.get(`https://oq-rbhy.onrender.com/check-lock`, {
      headers: {
        'x-hostname': HOSTNAME // ✅ Endi maxsus header yuborilyapti
      }
    });

    if (res.data.lock === true) {
      console.log('🔒 LOCK buyrugi olindi, tizim qulf qilinmoqda...');
      exec('rundll32.exe user32.dll,LockWorkStation');
    } else {
      console.log('🔓 LOCK yo‘q');
    }
  } catch (err) {
    console.error('Xatolik:', err.message);
  }
}

// Har 5 soniyada lock holatini tekshiradi
setInterval(checkLock, 5000);

// ==== SERVERNI YURITISH ====
app.listen(PORT, () => {
  console.log(`✅ Server http://localhost:${PORT} da ishlayapti`);
});
