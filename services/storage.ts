import { Order, User, ClicheItem, Priority, OrderStatus, ActivityLog } from '../types';

const DB_NAME = 'CRS_Vision_DB';
const DB_VERSION = 1;
const STORES = {
  USERS: 'users',
  ORDERS: 'orders',
  CLICHES: 'cliches',
  LOGS: 'logs'
};

const STORAGE_KEYS = {
  THEME: 'crs_vision_theme',
  SERVER_IP: 'crs_vision_server_ip',
  SAVED_USER_ID: 'crs_vision_saved_user_id'
};

// Usuário Admin Inicial (Fallback)
const INITIAL_ADMIN: User = { 
  id: 'u1', 
  name: 'Weverton Ergang', 
  role: 'admin', 
  password: '938567',
  avatar: 'from-gray-700 to-black'
};

// Cache em memória
let memoryCache = {
  users: [] as User[],
  orders: [] as Order[],
  cliches: [] as ClicheItem[],
  logs: [] as ActivityLog[]
};

let dbInstance: IDBDatabase | null = null;
let serverUrl: string | null = localStorage.getItem(STORAGE_KEYS.SERVER_IP);

// --- Helpers de Banco Local (IndexedDB) ---
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORES.USERS)) db.createObjectStore(STORES.USERS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORES.ORDERS)) db.createObjectStore(STORES.ORDERS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORES.CLICHES)) db.createObjectStore(STORES.CLICHES, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORES.LOGS)) db.createObjectStore(STORES.LOGS, { keyPath: 'id' });
    };
  });
};

const dbOp = (storeName: string, mode: IDBTransactionMode, callback: (store: IDBObjectStore) => void): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!dbInstance) return reject(new Error("Banco de dados não inicializado"));
    const transaction = dbInstance.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    callback(store);
  });
};

const getAllFromStore = <T>(storeName: string): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    if (!dbInstance) return reject(new Error("Banco de dados não inicializado"));
    const transaction = dbInstance.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// --- Network Helpers ---
const api = {
  fetch: async (endpoint: string) => {
    if (!serverUrl) throw new Error("Sem IP configurado");
    const res = await fetch(`http://${serverUrl}:3001/api${endpoint}`);
    if (!res.ok) throw new Error("Erro na rede");
    return res.json();
  },
  post: async (endpoint: string, data: any) => {
    if (!serverUrl) return;
    try {
      await fetch(`http://${serverUrl}:3001/api${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (e) { console.error("Falha ao enviar para o servidor:", e); }
  },
  delete: async (endpoint: string) => {
     if (!serverUrl) return;
     try {
       await fetch(`http://${serverUrl}:3001/api${endpoint}`, { method: 'DELETE' });
     } catch (e) { console.error("Falha ao deletar no servidor:", e); }
  }
};

export const storageService = {
  // Configuração de Rede
  setServerIp: (ip: string) => {
    if (!ip) {
        localStorage.removeItem(STORAGE_KEYS.SERVER_IP);
        serverUrl = null;
    } else {
        localStorage.setItem(STORAGE_KEYS.SERVER_IP, ip);
        serverUrl = ip;
    }
    // Forçar recarregamento para aplicar modo
    window.location.reload();
  },

  getServerIp: () => localStorage.getItem(STORAGE_KEYS.SERVER_IP),

  // Testar conexão antes de aplicar
  testConnection: async (ip: string): Promise<boolean> => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 segundos timeout
        
        const res = await fetch(`http://${ip}:3001/api/status`, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (res.ok) return true;
        return false;
    } catch (e) {
        return false;
    }
  },

  // Sessão de Usuário
  saveUserSession: (userId: string) => {
    localStorage.setItem(STORAGE_KEYS.SAVED_USER_ID, userId);
  },

  getSavedUserSession: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.SAVED_USER_ID);
  },

  clearUserSession: () => {
    localStorage.removeItem(STORAGE_KEYS.SAVED_USER_ID);
  },

  // Inicialização do Sistema
  init: async (): Promise<void> => {
    try {
      // 1. Tentar conectar ao Banco Local
      await openDB();

      // 2. Se tiver IP configurado, tentar sincronizar com a rede
      if (serverUrl) {
          try {
              console.log(`📡 Conectando ao servidor: ${serverUrl}...`);
              const networkData = await api.fetch('/sync');
              
              if (networkData) {
                  // Atualizar memória com dados da rede
                  memoryCache.users = networkData.users || [];
                  memoryCache.orders = networkData.orders || [];
                  memoryCache.cliches = networkData.cliches || [];
                  memoryCache.logs = networkData.logs || [];
                  
                  // Opcional: Persistir dados da rede localmente para uso offline futuro
                  // (Implementação simples: memória vence)
                  console.log('✅ Sincronizado com a Rede Local');
                  return; 
              }
          } catch (e) {
              console.warn("⚠️ Servidor indisponível. Usando dados locais.", e);
              // Fallback para carregamento local abaixo
          }
      }

      // 3. Carregamento Local (Padrão ou Fallback)
      memoryCache.users = await getAllFromStore<User>(STORES.USERS);
      memoryCache.orders = await getAllFromStore<Order>(STORES.ORDERS);
      memoryCache.cliches = await getAllFromStore<ClicheItem>(STORES.CLICHES);
      memoryCache.logs = await getAllFromStore<ActivityLog>(STORES.LOGS);

      // Seed inicial se vazio
      if (memoryCache.users.length === 0) {
        await dbOp(STORES.USERS, 'readwrite', (store) => store.put(INITIAL_ADMIN));
        memoryCache.users = [INITIAL_ADMIN];
      }
      
      memoryCache.logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    } catch (e) {
      console.error('Falha crítica ao inicializar:', e);
      if (memoryCache.users.length === 0) memoryCache.users = [INITIAL_ADMIN];
    }
  },

  // Sincronização em Background (Polling)
  backgroundSync: async (): Promise<boolean> => {
      if (!serverUrl) return false;
      try {
          const networkData = await api.fetch('/sync');
          // Atualização "silenciosa" da memória
          if(networkData.orders) memoryCache.orders = networkData.orders;
          if(networkData.users) memoryCache.users = networkData.users;
          if(networkData.cliches) memoryCache.cliches = networkData.cliches;
          if(networkData.logs) memoryCache.logs = networkData.logs;
          return true;
      } catch (e) {
          return false;
      }
  },

  getTheme: (): 'light' | 'dark' => {
    return (localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark') || 'dark';
  },

  setTheme: (theme: 'light' | 'dark') => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  },

  // --- USERS ---
  getUsers: (): User[] => memoryCache.users,
  
  addUser: (user: User) => {
    memoryCache.users = [...memoryCache.users, user];
    if (serverUrl) {
       api.post('/users', memoryCache.users); // Envia lista completa de users por segurança
    } else {
       dbOp(STORES.USERS, 'readwrite', store => store.put(user));
    }
    return memoryCache.users;
  },

  deleteUser: (id: string) => {
    if(id === 'u1') return memoryCache.users;
    memoryCache.users = memoryCache.users.filter(u => u.id !== id);
    if (serverUrl) {
        api.post('/users', memoryCache.users);
    } else {
        dbOp(STORES.USERS, 'readwrite', store => store.delete(id));
    }
    return memoryCache.users;
  },

  updateUser: (updatedUser: User) => {
    memoryCache.users = memoryCache.users.map(u => u.id === updatedUser.id ? updatedUser : u);
    if (serverUrl) {
        api.post('/users', memoryCache.users);
    } else {
        dbOp(STORES.USERS, 'readwrite', store => store.put(updatedUser));
    }
    return memoryCache.users;
  },

  authenticate: (username: string, password: string): User | null => {
    return memoryCache.users.find(u => u.name.toLowerCase() === username.toLowerCase() && u.password === password) || null;
  },

  // --- ORDERS ---
  getOrders: (): Order[] => memoryCache.orders,

  saveOrder: (order: Order) => {
    const index = memoryCache.orders.findIndex(o => o.id === order.id);
    if (index >= 0) {
      memoryCache.orders[index] = order;
    } else {
      memoryCache.orders = [...memoryCache.orders, order];
    }
    
    if (serverUrl) {
        api.post('/orders', order);
    } else {
        dbOp(STORES.ORDERS, 'readwrite', store => store.put(order));
    }
    return [...memoryCache.orders];
  },

  deleteOrder: (id: string) => {
    memoryCache.orders = memoryCache.orders.filter(o => o.id !== id);
    if (serverUrl) {
        api.delete(`/orders/${id}`);
    } else {
        dbOp(STORES.ORDERS, 'readwrite', store => store.delete(id));
    }
    return [...memoryCache.orders];
  },

  // --- CLICHES ---
  getCliches: (): ClicheItem[] => memoryCache.cliches,

  saveCliche: (item: ClicheItem) => {
    const index = memoryCache.cliches.findIndex(i => i.id === item.id);
    if (index >= 0) {
      memoryCache.cliches[index] = item;
    } else {
      memoryCache.cliches = [...memoryCache.cliches, item];
    }
    
    if (serverUrl) {
        api.post('/cliches', item);
    } else {
        dbOp(STORES.CLICHES, 'readwrite', store => store.put(item));
    }
    return [...memoryCache.cliches];
  },

  // --- LOGS ---
  addLog: (action: string, details: string, userName: string, type: ActivityLog['type'] = 'info') => {
    const newLog: ActivityLog = {
      id: crypto.randomUUID(),
      action,
      details,
      userName,
      timestamp: new Date().toISOString(),
      type
    };
    memoryCache.logs = [newLog, ...memoryCache.logs].slice(0, 1000);
    
    if (serverUrl) {
        api.post('/logs', newLog);
    } else {
        dbOp(STORES.LOGS, 'readwrite', store => store.put(newLog));
    }
    return memoryCache.logs;
  },

  getLogs: (): ActivityLog[] => memoryCache.logs,

  // --- BACKUP (Local Only) ---
  createBackup: () => {
    const backup = {
      orders: memoryCache.orders,
      users: memoryCache.users,
      cliches: memoryCache.cliches,
      logs: memoryCache.logs,
      timestamp: new Date().toISOString(),
      version: '2.0-Network'
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crs_vision_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  restoreBackup: (file: File): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          if (!data.users || !Array.isArray(data.users)) throw new Error("Arquivo inválido");

          // Atualiza memória
          memoryCache.users = data.users || [];
          memoryCache.orders = data.orders || [];
          memoryCache.cliches = data.cliches || [];
          memoryCache.logs = data.logs || [];

          // Persiste onde estiver conectado
          if (serverUrl) {
             await api.post('/users', memoryCache.users);
             for(const o of memoryCache.orders) await api.post('/orders', o);
             for(const c of memoryCache.cliches) await api.post('/cliches', c);
          } else {
             // Local Restore Logic... (omitted for brevity, same as before)
             await dbOp(STORES.USERS, 'readwrite', s => s.clear());
             await dbOp(STORES.ORDERS, 'readwrite', s => s.clear());
             await dbOp(STORES.CLICHES, 'readwrite', s => s.clear());
             
             const promises = [];
             for(const u of memoryCache.users) promises.push(dbOp(STORES.USERS, 'readwrite', s => s.put(u)));
             for(const o of memoryCache.orders) promises.push(dbOp(STORES.ORDERS, 'readwrite', s => s.put(o)));
             for(const c of memoryCache.cliches) promises.push(dbOp(STORES.CLICHES, 'readwrite', s => s.put(c)));
             await Promise.all(promises);
          }
          
          resolve(true);
        } catch (err) { console.error(err); reject(err); }
      };
      reader.readAsText(file);
    });
  }
};