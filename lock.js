const axios = require('axios');
const { exec } = require('child_process');
const os = require('os');

const SERVER_URL = 'https://oq-ysum.onrender.com/check-lock'; // Bu yerga server IP
const HOSTNAME = os.hostname();

async function checkLock() {
  try {
    const res = await axios.get(SERVER_URL, {
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

// Har 5 sekundda tekshiradi
setInterval(checkLock, 500);
