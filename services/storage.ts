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
};

// Usuário Admin Inicial
const INITIAL_ADMIN: User = { 
  id: 'u1', 
  name: 'Weverton Ergang', 
  role: 'admin', 
  password: '938567',
  avatar: 'from-gray-700 to-black'
};

// Cache em memória para acesso síncrono ultra-rápido pela UI
let memoryCache = {
  users: [] as User[],
  orders: [] as Order[],
  cliches: [] as ClicheItem[],
  logs: [] as ActivityLog[]
};

let dbInstance: IDBDatabase | null = null;

// Helpers de Banco de Dados Interno
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

export const storageService = {
  // Inicialização do Sistema
  init: async (): Promise<void> => {
    try {
      await openDB();
      
      // Carregar dados para memória
      memoryCache.users = await getAllFromStore<User>(STORES.USERS);
      memoryCache.orders = await getAllFromStore<Order>(STORES.ORDERS);
      memoryCache.cliches = await getAllFromStore<ClicheItem>(STORES.CLICHES);
      memoryCache.logs = await getAllFromStore<ActivityLog>(STORES.LOGS);

      // Seed inicial se vazio
      if (memoryCache.users.length === 0) {
        await dbOp(STORES.USERS, 'readwrite', (store) => store.put(INITIAL_ADMIN));
        memoryCache.users = [INITIAL_ADMIN];
      }
      
      // Ordenar logs por data (mais recente primeiro)
      memoryCache.logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      console.log('CRS Vision Database: Inicializado com sucesso.');
    } catch (e) {
      console.error('Falha ao inicializar banco de dados:', e);
      // Fallback básico para não quebrar a UI se o IDB falhar (modo somente leitura/memória temporária)
      if (memoryCache.users.length === 0) memoryCache.users = [INITIAL_ADMIN];
    }
  },

  // Theme (Mantém no LocalStorage para evitar FOUC - Flash of Unstyled Content)
  getTheme: (): 'light' | 'dark' => {
    return (localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark') || 'dark';
  },

  setTheme: (theme: 'light' | 'dark') => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  // Users
  getUsers: (): User[] => memoryCache.users,

  addUser: (user: User) => {
    memoryCache.users = [...memoryCache.users, user];
    dbOp(STORES.USERS, 'readwrite', store => store.put(user));
    return memoryCache.users;
  },

  deleteUser: (id: string) => {
    if(id === 'u1') return memoryCache.users; // Proteção Admin Principal
    memoryCache.users = memoryCache.users.filter(u => u.id !== id);
    dbOp(STORES.USERS, 'readwrite', store => store.delete(id));
    return memoryCache.users;
  },

  updateUser: (updatedUser: User) => {
    memoryCache.users = memoryCache.users.map(u => u.id === updatedUser.id ? updatedUser : u);
    dbOp(STORES.USERS, 'readwrite', store => store.put(updatedUser));
    return memoryCache.users;
  },

  authenticate: (username: string, password: string): User | null => {
    return memoryCache.users.find(u => u.name.toLowerCase() === username.toLowerCase() && u.password === password) || null;
  },

  // Orders
  getOrders: (): Order[] => memoryCache.orders,

  saveOrder: (order: Order) => {
    const index = memoryCache.orders.findIndex(o => o.id === order.id);
    if (index >= 0) {
      memoryCache.orders[index] = order;
    } else {
      memoryCache.orders = [...memoryCache.orders, order];
    }
    dbOp(STORES.ORDERS, 'readwrite', store => store.put(order));
    return [...memoryCache.orders]; // Return copy to trigger React re-render
  },

  deleteOrder: (id: string) => {
    memoryCache.orders = memoryCache.orders.filter(o => o.id !== id);
    dbOp(STORES.ORDERS, 'readwrite', store => store.delete(id));
    return [...memoryCache.orders];
  },

  // Cliches
  getCliches: (): ClicheItem[] => memoryCache.cliches,

  saveCliche: (item: ClicheItem) => {
    const index = memoryCache.cliches.findIndex(i => i.id === item.id);
    if (index >= 0) {
      memoryCache.cliches[index] = item;
    } else {
      memoryCache.cliches = [...memoryCache.cliches, item];
    }
    dbOp(STORES.CLICHES, 'readwrite', store => store.put(item));
    return [...memoryCache.cliches];
  },

  // Log System
  addLog: (action: string, details: string, userName: string, type: ActivityLog['type'] = 'info') => {
    const newLog: ActivityLog = {
      id: crypto.randomUUID(),
      action,
      details,
      userName,
      timestamp: new Date().toISOString(),
      type
    };
    
    // Manter memória atualizada (LIFO)
    memoryCache.logs = [newLog, ...memoryCache.logs].slice(0, 1000); // Aumentado limite para 1000
    
    dbOp(STORES.LOGS, 'readwrite', store => store.put(newLog));
    
    // Limpeza opcional: se logs > 1000, remover antigos do DB (pode ser feito periodicamente)
    return memoryCache.logs;
  },

  getLogs: (): ActivityLog[] => memoryCache.logs,

  // Backup System
  createBackup: () => {
    const backup = {
      orders: memoryCache.orders,
      users: memoryCache.users,
      cliches: memoryCache.cliches,
      logs: memoryCache.logs,
      timestamp: new Date().toISOString(),
      version: '2.0-IDB'
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
          
          if (!data.users || !Array.isArray(data.users)) throw new Error("Arquivo de backup inválido");

          // Limpar BD e Memória
          await dbOp(STORES.USERS, 'readwrite', s => s.clear());
          await dbOp(STORES.ORDERS, 'readwrite', s => s.clear());
          await dbOp(STORES.CLICHES, 'readwrite', s => s.clear());
          await dbOp(STORES.LOGS, 'readwrite', s => s.clear());

          // Restaurar Dados (Async em lote)
          const promises = [];
          
          memoryCache.users = data.users || [];
          memoryCache.orders = data.orders || [];
          memoryCache.cliches = data.cliches || [];
          memoryCache.logs = data.logs || [];

          for(const u of memoryCache.users) promises.push(dbOp(STORES.USERS, 'readwrite', s => s.put(u)));
          for(const o of memoryCache.orders) promises.push(dbOp(STORES.ORDERS, 'readwrite', s => s.put(o)));
          for(const c of memoryCache.cliches) promises.push(dbOp(STORES.CLICHES, 'readwrite', s => s.put(c)));
          for(const l of memoryCache.logs) promises.push(dbOp(STORES.LOGS, 'readwrite', s => s.put(l)));

          await Promise.all(promises);
          resolve(true);
        } catch (err) {
          console.error(err);
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file);
    });
  }
};