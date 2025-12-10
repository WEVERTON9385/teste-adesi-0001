import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { OrderBoard } from './components/OrderBoard';
import { WeeklySchedule } from './components/WeeklySchedule';
import { ClicheControl } from './components/ClicheControl';
import { UserManagement } from './components/UserManagement';
import { PerformanceAnalysis } from './components/PerformanceAnalysis';
import { storageService } from './services/storage';
import { ViewState, User } from './types';
import { Loader2 } from 'lucide-react';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('orders');
  const [theme, setTheme] = useState<'light'|'dark'>('dark');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initSystem = async () => {
      // Inicializar banco de dados
      await storageService.init();
      
      // Carregar tema
      const savedTheme = storageService.getTheme();
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Simular um pequeno delay estético se o DB carregar muito rápido
      setTimeout(() => setIsInitializing(false), 800);
    };

    initSystem();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    storageService.setTheme(newTheme);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const renderContent = () => {
    if (!currentUser) return null;

    switch (currentView) {
      case 'orders':
        return <OrderBoard currentUser={currentUser} />;
      case 'schedule':
        return <WeeklySchedule />;
      case 'cliche':
        return <ClicheControl currentUser={currentUser} />;
      case 'users':
        return <UserManagement currentUser={currentUser} />;
      case 'performance':
        // Double check admin role logic just in case
        return currentUser.role === 'admin' ? <PerformanceAnalysis /> : <div className="p-10 text-center">Acesso restrito</div>;
      default:
        return <OrderBoard currentUser={currentUser} />;
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-black text-black dark:text-white">
          <div className="relative">
             <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse"></div>
             <Loader2 className="w-12 h-12 animate-spin relative z-10" />
          </div>
          <h2 className="mt-8 text-2xl font-black tracking-tighter">CRS VISION</h2>
          <p className="text-xs font-mono text-gray-400 mt-2 uppercase tracking-widest">Carregando Banco de Dados...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout 
      currentView={currentView} 
      onViewChange={setCurrentView}
      theme={theme}
      toggleTheme={toggleTheme}
      currentUser={currentUser}
      onLogout={handleLogout}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;