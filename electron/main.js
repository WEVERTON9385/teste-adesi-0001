const { app, BrowserWindow } = require('electron');
const path = require('path');

// Variável para manter referência ao servidor
let serverProcess = null;

function startServer() {
  try {
    // Em produção, iniciamos o servidor API internamente
    // Isso permite que o app funcione como Servidor na rede
    const serverPath = path.join(__dirname, '../server/index.js');
    console.log('Iniciando servidor interno:', serverPath);
    
    // Require executa o arquivo e inicia o express listener
    require(serverPath);
  } catch (error) {
    console.error('Falha ao iniciar servidor interno:', error);
  }
}

function createWindow() {
  const isDev = !app.isPackaged;
  
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: 'CRS Vision Manager',
    backgroundColor: '#000000', // Fundo preto para combinar com Dark Mode
    show: false, // Não mostrar até estar pronto para evitar tela branca
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Necessário para uso simples de FileSystem se expandir
      webSecurity: false // Permite carregar recursos locais se necessário
    },
    autoHideMenuBar: true, // Interface limpa/minimalista
    icon: path.join(__dirname, '../public/icon.png')
  });

  // Maximizar ao iniciar
  mainWindow.maximize();

  // Mostrar janela apenas quando o conteúdo estiver carregado
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Lógica de Carregamento
  if (isDev) {
    // Em desenvolvimento: conecta ao Vite (npm run dev)
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools(); // Debug: Ctrl+Shift+I
  } else {
    // Em produção: 
    // 1. Inicia o servidor backend
    startServer();
    
    // 2. Carrega o frontend estático
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});