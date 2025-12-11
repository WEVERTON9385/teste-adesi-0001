const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 3001;
const DB_FILE = path.join(__dirname, 'network_db.json');
const DIST_DIR = path.join(__dirname, '../dist');

// Permitir acesso de qualquer dispositivo na rede sem restrições
app.use(cors({
  origin: '*', // Aceita requisições de qualquer IP (Celular, PC, Tablet)
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json({ limit: '50mb' }));

// 1. Servir arquivos estáticos (O App React compilado)
// Isso permite que celulares acessem http://IP:3001 e vejam o sistema
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
} else {
  console.warn("⚠️ AVISO: Pasta 'dist' não encontrada. Rode 'npm run build' para permitir acesso visual via rede.");
}

// Dados Iniciais
const INITIAL_DATA = {
  users: [{ 
    id: 'u1', 
    name: 'Weverton Ergang', 
    role: 'admin', 
    password: '938567',
    avatar: 'from-gray-700 to-black'
  }],
  orders: [],
  cliches: [],
  logs: []
};

// Carregar Banco de Dados
let db = INITIAL_DATA;
if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE);
    db = JSON.parse(raw);
    console.log('📦 Banco de dados carregado.');
  } catch (e) {
    console.error('Erro ao ler DB, recriando...', e);
  }
} else {
  saveDb();
}

function saveDb() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// --- API ROUTES ---

app.get('/api/status', (req, res) => {
  res.json({ status: 'online', version: '2.0.0', serverTime: new Date() });
});

app.get('/api/sync', (req, res) => {
  res.json(db);
});

app.post('/api/users', (req, res) => {
  db.users = req.body;
  saveDb();
  res.json({ success: true });
});

app.post('/api/orders', (req, res) => {
  const order = req.body;
  const idx = db.orders.findIndex(o => o.id === order.id);
  if (idx >= 0) db.orders[idx] = order;
  else db.orders.push(order);
  saveDb();
  res.json({ success: true });
});

app.delete('/api/orders/:id', (req, res) => {
  db.orders = db.orders.filter(o => o.id !== req.params.id);
  saveDb();
  res.json({ success: true });
});

app.post('/api/cliches', (req, res) => {
  const item = req.body;
  const idx = db.cliches.findIndex(c => c.id === item.id);
  if (idx >= 0) db.cliches[idx] = item;
  else db.cliches.push(item);
  saveDb();
  res.json({ success: true });
});

app.post('/api/logs', (req, res) => {
  const log = req.body;
  db.logs.unshift(log);
  if(db.logs.length > 1000) db.logs = db.logs.slice(0, 1000);
  saveDb();
  res.json({ success: true });
});

// Fallback para React Router (Qualquer rota não-API vai para o index.html)
app.get('*', (req, res) => {
  if (fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  } else {
    res.send('Servidor API rodando. Para ver o App, faça o build do frontend.');
  }
});

// Função para pegar IP da rede local corretamente
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Pula interfaces internas e não-IPv4
      if ('IPv4' !== iface.family || iface.internal) {
        continue;
      }
      return iface.address;
    }
  }
  return 'localhost';
}

app.listen(PORT, '0.0.0.0', () => {
  const ipAddress = getLocalIp();
  console.log('\n==================================================');
  console.log(`🚀 SERVIDOR CRS VISION ATIVO`);
  console.log(`--------------------------------------------------`);
  console.log(`📡 Para conectar outros PCs ou Celulares:`);
  console.log(`👉 Digite este IP no App:  ${ipAddress}`);
  console.log(`👉 Ou acesse no navegador: http://${ipAddress}:${PORT}`);
  console.log(`--------------------------------------------------`);
  console.log(`⚠️  IMPORTANTE: Se não conectar, verifique o FIREWALL do Windows.`);
  console.log(`⚠️  Permita o Node.js nas configurações de Rede Privada.`);
  console.log(`--------------------------------------------------`);
  console.log(`📂 Servindo arquivos de: ${DIST_DIR}`);
  console.log('==================================================\n');
});