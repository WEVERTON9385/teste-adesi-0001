import React, { useState } from 'react';
import { User } from '../types';
import { storageService } from '../services/storage';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = storageService.authenticate(username, password);
    if (user) {
      onLogin(user);
    } else {
      setError('Acesso negado. Verifique suas credenciais.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-4 transition-colors duration-500">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl mix-blend-screen"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl mix-blend-screen"></div>
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

          {error && (
            <div className="text-red-500 text-xs text-center bg-red-50 dark:bg-red-500/10 py-3 rounded-xl border border-red-100 dark:border-red-500/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 mt-6 bg-black dark:bg-white text-white dark:text-black font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-xs shadow-lg shadow-black/20 dark:shadow-white/10"
          >
            Acessar Sistema
          </button>
        </form>
        
        <div className="mt-10 text-center">
           <span className="text-[10px] text-gray-300 dark:text-zinc-700 font-mono">SECURE LOGIN &bull; V 2.0</span>
        </div>
      </div>
    </div>
  );
};