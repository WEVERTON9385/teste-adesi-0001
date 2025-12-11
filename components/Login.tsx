import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { storageService } from '../services/storage';
import { Settings, Server, X, Check, Laptop, Wifi, AlertCircle, Loader2 } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [serverIp, setServerIp] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  useEffect(() => {
    const currentIp = storageService.getServerIp();
    if (currentIp) setServerIp(currentIp);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = storageService.authenticate(username, password);
    if (user) {
      if (rememberMe) {
        storageService.saveUserSession(user.id);
      }
      onLogin(user);
    } else {
      setError('Acesso negado. Verifique suas credenciais.');
    }
  };

  const handleTestConnection = async () => {
    if (!serverIp) return;
    setTestStatus('testing');
    const success = await storageService.testConnection(serverIp);
    setTestStatus(success ? 'success' : 'error');
    if (success) {
      setTimeout(() => setTestStatus('idle'), 3000);
    }
  };

  const handleSaveSettings = () => {
    storageService.setServerIp(serverIp);
    setShowSettings(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-4 transition-colors duration-500">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl mix-blend-screen"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl mix-blend-screen"></div>
      </div>

      <div className="absolute top-4 right-4">
        <button 
          onClick={() => setShowSettings(true)}
          className="p-3 text-gray-400 hover:text-black dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
          title="Configurações de Rede"
        >
           <Settings className="w-6 h-6" />
        </button>
      </div>

      <div className="w-full max-w-md bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/20 dark:border-white/10 relative z-10">
        <div className="text-center mb-12">
          <div className="inline-block mb-2">
             <h1 className="text-6xl font-black tracking-tighter text-black dark:text-white" style={{ fontFamily: 'Inter' }}>
                CRS
             </h1>
          </div>
          <div className="text-sm font-bold tracking-[0.8em] text-gray-400 dark:text-gray-500 uppercase ml-1">
                Vision
          </div>
          {storageService.getServerIp() && (
             <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                 <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Rede Conectada</span>
             </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 focus:border-black dark:focus:border-white focus:ring-0 outline-none transition-all dark:text-white font-medium placeholder-gray-400"
              placeholder="Identificação"
            />
          </div>
          <div className="space-y-2">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 focus:border-black dark:focus:border-white focus:ring-0 outline-none transition-all dark:text-white font-medium placeholder-gray-400"
              placeholder="Senha de Acesso"
            />
          </div>

          <div className="flex items-center gap-2 px-2">
            <input 
              type="checkbox" 
              id="remember"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-black/50 text-black dark:text-white focus:ring-black dark:focus:ring-white"
            />
            <label htmlFor="remember" className="text-xs text-gray-500 dark:text-gray-400 font-medium select-none cursor-pointer">
              Manter conectado neste dispositivo
            </label>
          </div>

          {error && (
            <div className="text-red-500 text-xs text-center bg-red-50 dark:bg-red-500/10 py-3 rounded-xl border border-red-100 dark:border-red-500/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 mt-2 bg-black dark:bg-white text-white dark:text-black font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-xs shadow-lg shadow-black/20 dark:shadow-white/10"
          >
            Acessar Sistema
          </button>
        </form>
        
        <div className="mt-10 text-center">
           <span className="text-[10px] text-gray-300 dark:text-zinc-700 font-mono">SECURE LOGIN &bull; V 2.0</span>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-sm p-8 shadow-2xl border border-gray-200 dark:border-white/10 relative">
             <button 
                onClick={() => setShowSettings(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-black dark:hover:text-white transition-colors"
             >
                <X className="w-5 h-5" />
             </button>

             <div className="flex flex-col items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
                   <Server className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black dark:text-white text-center">Configurar Rede</h3>
                <p className="text-xs text-gray-500 text-center mt-1">Conecte-se ao computador principal</p>
             </div>

             <div className="space-y-4">
               <div>
                 <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 ml-1">IP do Servidor</label>
                 <div className="relative">
                    <Laptop className="absolute left-4 top-4 w-4 h-4 text-gray-400" />
                    <input 
                      type="text"
                      value={serverIp || ''}
                      onChange={e => { setServerIp(e.target.value); setTestStatus('idle'); }}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                      placeholder="Ex: 192.168.1.15"
                    />
                 </div>
                 
                 <div className="flex justify-between items-center mt-2 px-1">
                   <p className="text-[10px] text-gray-400">
                     Deixe em branco para usar Offline.
                   </p>
                   {serverIp && (
                     <button 
                       type="button" 
                       onClick={handleTestConnection} 
                       disabled={testStatus === 'testing'}
                       className="text-[10px] font-bold uppercase text-blue-500 hover:text-blue-400 flex items-center gap-1"
                     >
                       {testStatus === 'testing' && <Loader2 className="w-3 h-3 animate-spin" />}
                       {testStatus === 'idle' && 'Testar Conexão'}
                       {testStatus === 'testing' && 'Testando...'}
                       {testStatus === 'success' && <span className="text-green-500 flex items-center gap-1"><Check className="w-3 h-3"/> Ok</span>}
                       {testStatus === 'error' && <span className="text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Falha</span>}
                     </button>
                   )}
                 </div>
               </div>

               <button 
                 onClick={handleSaveSettings}
                 className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all uppercase tracking-widest text-xs shadow-lg flex items-center justify-center gap-2"
               >
                 <Check className="w-4 h-4" />
                 Salvar e Conectar
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};