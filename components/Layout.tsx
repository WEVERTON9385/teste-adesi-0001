import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Calendar, Stamp, Users, Moon, Sun, LogOut, Menu, X, BarChart3, History, Lock, KeyRound, Cloud, Check } from 'lucide-react';
import { ViewState, User, ActivityLog } from '../types';
import { storageService } from '../services/storage';

interface LayoutProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
  children: React.ReactNode;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  currentUser: User;
  onLogout: () => void;
}

// Configuração dos itens do menu com permissões ESTRITAS
const menuItems = [
  // Vendedor vê APENAS Orders (Meus Pedidos)
  { id: 'orders', label: 'Produção', icon: LayoutDashboard, roles: ['admin', 'operador', 'vendedor'] },
  // Organograma apenas para quem gerencia produção
  { id: 'schedule', label: 'Organograma', icon: Calendar, roles: ['admin', 'operador'] },
  // Desempenho apenas Admin
  { id: 'performance', label: 'Desempenho', icon: BarChart3, roles: ['admin'] },
  // Clicheria apenas quem gerencia produção
  { id: 'cliche', label: 'Clicheria', icon: Stamp, roles: ['admin', 'operador'] },
  // Usuários APENAS ADMIN (Autoridade Total)
  { id: 'users', label: 'Usuários', icon: Users, roles: ['admin'] },
];

export const Layout: React.FC<LayoutProps> = ({ 
  currentView, 
  onViewChange, 
  children, 
  theme, 
  toggleTheme,
  currentUser,
  onLogout
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  
  // Password Change State
  const [isPwdModalOpen, setIsPwdModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Update logs periodically
  useEffect(() => {
    setLogs(storageService.getLogs());
    const interval = setInterval(() => {
      setLogs(storageService.getLogs());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const isAdmin = currentUser.role === 'admin';
  const isVendor = currentUser.role === 'vendedor';

  const handleChangePassword = () => {
    if (!newPassword || newPassword !== confirmPassword) {
      alert("As senhas não coincidem ou estão vazias.");
      return;
    }
    
    const updatedUser = { ...currentUser, password: newPassword };
    storageService.updateUser(updatedUser);
    storageService.addLog('Senha Alterada', 'Usuário alterou a própria senha', currentUser.name, 'update');
    
    setNewPassword('');
    setConfirmPassword('');
    setIsPwdModalOpen(false);
    alert("Senha alterada com sucesso!");
  };

  // Filter menu items based on user role
  const visibleMenuItems = menuItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <div className="h-screen w-full bg-gray-50 dark:bg-black transition-colors duration-300 flex flex-col overflow-hidden">
      {/* Modern Top Navbar (Static, not fixed, to flow in flex container) */}
      <nav className="flex-none h-16 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 no-print">
        <div className="w-full h-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-full">
            {/* Logo Section */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col leading-none select-none">
                 <span className="text-2xl font-black tracking-tighter text-black dark:text-white">CRS</span>
                 <span className="text-[0.6rem] font-bold tracking-[0.6em] text-gray-500 dark:text-gray-400 uppercase">Vision</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              {visibleMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                // Special label for vendors on the orders tab
                const label = (item.id === 'orders' && isVendor) ? 'Meus Pedidos' : item.label;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id as ViewState)}
                    className={`flex items-center px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all duration-300
                      ${isActive 
                        ? 'bg-black dark:bg-white text-white dark:text-black shadow-[0_0_15px_rgba(0,0,0,0.2)] dark:shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                      }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Right Actions */}
            <div className="hidden md:flex items-center gap-2 pl-4 border-l border-gray-200 dark:border-white/10">
               {!isVendor && (
                   <div className="hidden lg:flex items-center gap-2 mr-4 text-[10px] text-green-600 dark:text-green-400 font-bold uppercase tracking-widest bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800">
                      <Cloud className="w-3 h-3" />
                      Salvo
                   </div>
               )}

               <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10 rounded-full transition-colors"
                title="Mudar Tema"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <div className="flex items-center gap-3 ml-2">
                <div className="text-right hidden lg:block">
                  <div className="text-xs font-bold text-gray-900 dark:text-white">{currentUser.name}</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-500 uppercase tracking-widest">{currentUser.role}</div>
                </div>
                
                {/* Ocultar botão de senha para Vendedores */}
                {!isVendor && (
                  <button 
                    onClick={() => setIsPwdModalOpen(true)}
                    className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10 rounded-lg transition-colors"
                    title="Alterar Senha"
                  >
                    <Lock className="w-5 h-5" />
                  </button>
                )}

                <button 
                  onClick={onLogout}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Sair"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
               <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600 dark:text-gray-300">
                 {isMobileMenuOpen ? <X /> : <Menu />}
               </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container - Adjusted for full screen scrolling */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 print-content scroll-smooth">
          {children}
        </main>

        {/* Right Sidebar - History Log (Admin Only) */}
        {isAdmin && (
          <aside className="w-80 flex-none bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-l border-gray-200 dark:border-white/10 hidden lg:flex flex-col z-40 shadow-[-10px_0_20px_rgba(0,0,0,0.02)]">
            <div className="p-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between flex-none">
              <h3 className="font-bold text-sm uppercase tracking-widest text-gray-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4" /> Histórico
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] text-green-500 font-bold uppercase">
                 <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                 </span>
                 Sync
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {logs.length === 0 && (
                <div className="text-center text-xs text-gray-400 py-10">Nenhuma atividade recente.</div>
              )}
              {logs.map((log) => (
                <div key={log.id} className="relative pl-4 border-l-2 border-gray-100 dark:border-zinc-800">
                  <div className={`absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-black ${
                    log.type === 'create' ? 'bg-green-500' : 
                    log.type === 'delete' ? 'bg-red-500' : 
                    log.type === 'update' ? 'bg-blue-500' : 'bg-gray-400'
                  }`}></div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                      {log.action}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
                      {log.details}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                       <div className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-[8px] font-bold text-gray-700">
                          {log.userName.charAt(0)}
                       </div>
                       <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300">{log.userName}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/20 flex-none">
               <div className="text-[10px] text-center text-gray-400">
                 Backup automático ativo.
               </div>
            </div>
          </aside>
        )}
      </div>

      {/* Password Change Modal */}
      {isPwdModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-sm p-8 shadow-2xl border border-gray-200 dark:border-white/10 relative">
              <button 
                onClick={() => setIsPwdModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center mb-6">
                 <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-black dark:bg-white text-white dark:text-black mb-3">
                    <KeyRound className="w-6 h-6" />
                 </div>
                 <h3 className="text-xl font-black dark:text-white">Alterar Senha</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 ml-1">Nova Senha</label>
                  <input 
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
                    placeholder="••••••"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 ml-1">Confirmar Senha</label>
                  <input 
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
                    placeholder="••••••"
                  />
                </div>
                
                <button 
                  onClick={handleChangePassword}
                  className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl hover:scale-[1.02] transition-all uppercase tracking-widest text-xs shadow-lg mt-2"
                >
                  Salvar
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-md" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white dark:bg-zinc-900 shadow-2xl p-4 pt-20 border-l border-white/10" onClick={e => e.stopPropagation()}>
             <div className="space-y-2">
               {visibleMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  const label = (item.id === 'orders' && isVendor) ? 'Meus Pedidos' : item.label;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onViewChange(item.id as ViewState);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center w-full px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wide transition-all
                        ${isActive 
                          ? 'bg-black dark:bg-white text-white dark:text-black' 
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                        }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {label}
                    </button>
                  );
                })}
             </div>
             
             <div className="mt-8 pt-8 border-t border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-3 px-4 mb-6">
                   <div className="flex-1">
                      <div className="font-bold text-gray-900 dark:text-white">{currentUser.name}</div>
                      <div className="text-xs text-gray-500">Logado</div>
                   </div>
                   {!isVendor && <button onClick={() => setIsPwdModalOpen(true)} className="text-gray-500 mr-3"><Lock className="w-5 h-5"/></button>}
                   <button onClick={onLogout} className="text-red-500"><LogOut className="w-5 h-5"/></button>
                </div>
                <button 
                  onClick={toggleTheme} 
                  className="flex items-center justify-center w-full py-3 bg-gray-100 dark:bg-white/5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {theme === 'dark' ? <><Sun className="w-4 h-4 mr-2"/> Modo Claro</> : <><Moon className="w-4 h-4 mr-2"/> Modo Escuro</>}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};