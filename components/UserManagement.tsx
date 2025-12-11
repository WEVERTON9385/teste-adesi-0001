import React, { useState, useEffect, useRef } from 'react';
import { User, Shield, User as UserIcon, Trash2, Plus, Smartphone, QrCode, X, Monitor, Upload, Camera, Eye, EyeOff, Download, Upload as UploadIcon, FileText, Lock, Info, Database, ScanLine, Wifi, AlertCircle } from 'lucide-react';
import { storageService } from '../services/storage';
import { User as UserType } from '../types';

// Cores pré-definidas para avatares (Legacy support)
const AVATAR_GRADIENTS = [
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-pink-500',
  'from-orange-500 to-red-500',
  'from-green-500 to-emerald-500',
  'from-gray-700 to-black',
];

// Definição das permissões para feedback visual ao Admin
const ROLE_PERMISSIONS = {
  admin: {
    label: 'Acesso Total',
    desc: 'Pode ver e editar tudo, gerenciar usuários, senhas e configurações.',
    color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
  },
  operador: {
    label: 'Gestão de Produção',
    desc: 'Gerencia OCs, Organograma e Clicheria. NÃO pode alterar usuários ou senhas.',
    color: 'bg-black text-white dark:bg-white dark:text-black'
  },
  vendedor: {
    label: 'Acesso Limitado',
    desc: 'Visualiza APENAS seus próprios pedidos e status. Sem permissão de edição.',
    color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
  }
};

interface UserManagementProps {
    currentUser: UserType;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<UserType[]>([]);
  
  // Form States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'operador' | 'vendedor'>('operador');
  const [selectedAvatarIdx, setSelectedAvatarIdx] = useState(0);
  const [customImage, setCustomImage] = useState<string | null>(null);
  
  // Password Visibility State (Map of userID -> boolean)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Device Connection States
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [currentServerIp, setCurrentServerIp] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUsers(storageService.getUsers());
    // Get stored server IP or try to infer context
    const storedIp = storageService.getServerIp();
    setCurrentServerIp(storedIp || '');
  }, []);

  // SECURITY CHECK
  if (currentUser.role !== 'admin') {
      return (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center p-8">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Acesso Restrito</h2>
              <p className="text-gray-500 mt-2">Apenas Administradores podem gerenciar usuários.</p>
          </div>
      );
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Use existing password if editing and field is empty
    const finalPassword = password.trim() ? password : (editingId ? users.find(u => u.id === editingId)?.password : '');
    
    if (!finalPassword) return;

    const userData: UserType = {
      id: editingId || crypto.randomUUID(),
      name,
      password: finalPassword,
      role,
      avatar: customImage || AVATAR_GRADIENTS[selectedAvatarIdx],
      isCustomImage: !!customImage
    };

    if (editingId) {
        setUsers(storageService.updateUser(userData));
        storageService.addLog('Usuário Editado', `Alterou perfil de ${name}`, currentUser.name, 'update');
    } else {
        setUsers(storageService.addUser(userData));
        storageService.addLog('Usuário Criado', `Criou novo usuário: ${name}`, currentUser.name, 'create');
    }

    resetForm();
  };

  const resetForm = () => {
    setName('');
    setPassword('');
    setRole('operador');
    setCustomImage(null);
    setSelectedAvatarIdx(0);
    setEditingId(null);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEdit = (user: UserType) => {
      setEditingId(user.id);
      setName(user.name);
      setRole(user.role);
      setPassword(''); // Don't show password initially
      if (user.isCustomImage) {
          setCustomImage(user.avatar || null);
      } else {
          setCustomImage(null);
          // Try to find index of gradient
          const idx = AVATAR_GRADIENTS.indexOf(user.avatar || '');
          setSelectedAvatarIdx(idx >= 0 ? idx : 0);
      }
  };

  const handleDelete = (id: string, userName: string) => {
    if (confirm('Remover este usuário?')) {
      setUsers(storageService.deleteUser(id));
      storageService.addLog('Usuário Removido', `Removeu o usuário ${userName}`, currentUser.name, 'delete');
      if (editingId === id) resetForm();
    }
  };

  const togglePasswordVisibility = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering card edit
    setVisiblePasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const openDeviceModal = () => {
    // If no IP is configured, we can't generate a valid QR code
    setShowDeviceModal(true);
  };

  const handleBackup = () => {
    storageService.createBackup();
    storageService.addLog('Backup Criado', 'Download da base de dados realizado', currentUser.name, 'info');
  };

  const handleExportUsers = () => {
    const headers = ['ID', 'Nome', 'Função', 'Senha'];
    const csvContent = [
      headers.join(','),
      ...users.map(u => `${u.id},${u.name},${u.role},${u.password || ''}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'lista_usuarios_crs.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if(confirm("ATENÇÃO CRÍTICA:\n\nIsso irá substituir TODO o Banco de Dados atual pelos dados do arquivo.\nEssa ação não pode ser desfeita.\n\nDeseja continuar?")) {
          try {
              await storageService.restoreBackup(file);
              alert("Banco de dados restaurado com sucesso! O sistema será reiniciado.");
              window.location.reload();
          } catch(err) {
              console.error(err);
              alert("Erro crítico ao restaurar. Verifique se o arquivo é um backup válido do CRS Vision.");
          }
      }
    }
  };

  const getQRData = () => {
     if (!currentServerIp) return '';
     return `http://${currentServerIp}:3001`;
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h2 className="text-4xl font-black text-black dark:text-white tracking-tighter mb-2">Equipe & Dados</h2>
            <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
              Gerencie perfis e segurança. 
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-white/10 rounded-full text-xs font-bold text-gray-900 dark:text-white">
                {users.length} usuários salvos
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
                onClick={handleExportUsers}
                className="flex items-center px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all text-xs uppercase tracking-wide"
                title="Baixar lista em CSV"
            >
                <FileText className="w-4 h-4 mr-2" />
                Lista
            </button>
            <button 
                onClick={handleBackup}
                className="flex items-center px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all text-xs uppercase tracking-wide"
            >
                <Download className="w-4 h-4 mr-2" />
                Backup BD
            </button>
            <button 
                onClick={() => backupInputRef.current?.click()}
                className="flex items-center px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all text-xs uppercase tracking-wide"
            >
                <Database className="w-4 h-4 mr-2" />
                Restaurar BD
                <input ref={backupInputRef} type="file" accept=".json" className="hidden" onChange={handleRestore} />
            </button>
            <button 
                onClick={openDeviceModal}
                className="group flex items-center px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold shadow-xl shadow-black/20 dark:shadow-white/10 hover:scale-105 transition-all uppercase tracking-wide text-xs"
            >
                <QrCode className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                Conectar Mobile
            </button>
          </div>
       </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulário */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm sticky top-24 backdrop-blur-sm">
            <h3 className="text-lg font-bold mb-6 dark:text-white flex items-center">
              <Plus className="w-5 h-5 mr-2" /> {editingId ? 'Editar Perfil' : 'Novo Membro'}
            </h3>
            
            <div className="space-y-6">
              {/* Foto de Perfil */}
              <div className="flex flex-col items-center gap-4">
                  <div className={`w-24 h-24 rounded-full shadow-lg overflow-hidden border-4 border-gray-100 dark:border-zinc-800 relative bg-gray-100 dark:bg-zinc-800`}>
                      {customImage ? (
                          <img src={customImage} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${AVATAR_GRADIENTS[selectedAvatarIdx]}`}></div>
                      )}
                      <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                          <Camera className="w-8 h-8 text-white" />
                          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                  </div>
                  
                  {!customImage && (
                    <div className="flex gap-2 justify-center flex-wrap">
                        {AVATAR_GRADIENTS.map((gradient, idx) => (
                            <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedAvatarIdx(idx)}
                            className={`w-6 h-6 rounded-full bg-gradient-to-br ${gradient} transition-all ${selectedAvatarIdx === idx ? 'ring-2 ring-offset-2 ring-black dark:ring-white scale-110' : 'opacity-50'}`}
                            />
                        ))}
                    </div>
                  )}
                  {customImage && (
                      <button type="button" onClick={() => { setCustomImage(null); if(fileInputRef.current) fileInputRef.current.value = ''; }} className="text-xs text-red-500 hover:underline">
                          Remover foto
                      </button>
                  )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 ml-1">Nome</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-zinc-700 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none font-medium"
                  placeholder="Nome do colaborador"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 ml-1">Senha {editingId && '(Deixe em branco para manter)'}</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-zinc-700 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none font-medium"
                  placeholder="••••••"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 ml-1">Autorizar Acesso Como:</label>
                
                {/* Visual Guide for Permissions */}
                <div className={`mb-4 p-4 rounded-xl border transition-all duration-300 ${
                  role === 'admin' ? 'bg-purple-50 border-purple-100 dark:bg-purple-900/10 dark:border-purple-800' :
                  role === 'vendedor' ? 'bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-800' :
                  'bg-gray-50 border-gray-100 dark:bg-zinc-800 dark:border-zinc-700'
                }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className={`w-4 h-4 ${
                         role === 'admin' ? 'text-purple-600' : role === 'vendedor' ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                      <span className="text-xs font-bold text-gray-900 dark:text-white">{ROLE_PERMISSIONS[role].label}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
                      {ROLE_PERMISSIONS[role].desc}
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('operador')}
                    className={`py-3 rounded-xl text-[10px] font-bold border transition-all uppercase ${role === 'operador' ? 'bg-black text-white dark:bg-white dark:text-black border-transparent shadow-md' : 'border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
                  >
                    Operador
                  </button>
                   <button
                    type="button"
                    onClick={() => setRole('vendedor')}
                    className={`py-3 rounded-xl text-[10px] font-bold border transition-all uppercase ${role === 'vendedor' ? 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white border-transparent shadow-md' : 'border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
                  >
                    Vendedor
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`py-3 rounded-xl text-[10px] font-bold border transition-all uppercase ${role === 'admin' ? 'bg-purple-600 text-white dark:bg-purple-500 dark:text-white border-transparent shadow-md' : 'border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                  {editingId && (
                      <button type="button" onClick={resetForm} className="px-4 py-4 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800">
                          Cancelar
                      </button>
                  )}
                  <button type="submit" className="flex-1 py-4 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-90 transition-colors shadow-lg shadow-black/20 dark:shadow-white/20 uppercase tracking-widest text-xs">
                    {editingId ? 'Salvar Alterações' : 'Criar Acesso'}
                  </button>
              </div>
            </div>
          </form>
        </div>

        {/* Grid de Usuários */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map(user => (
              <div key={user.id} onClick={() => handleEdit(user)} className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                
                <div className="flex items-center gap-4">
                     <div className={`w-16 h-16 rounded-2xl border-2 border-white dark:border-zinc-700 shadow-md overflow-hidden flex-shrink-0 relative ${!user.isCustomImage ? `bg-gradient-to-br ${user.avatar || 'from-gray-400 to-gray-600'}` : ''}`}>
                        {user.isCustomImage ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                             <div className="w-full h-full flex items-center justify-center text-white font-black text-xl uppercase">{user.name.substring(0, 2)}</div>
                        )}
                     </div>
                     
                     <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{user.name}</h3>
                        <div className="flex flex-col gap-1 mt-1">
                            <div>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300' : user.role === 'vendedor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400'}`}>
                                  {user.role}
                              </span>
                            </div>
                            
                            {currentUser.role === 'admin' && (
                              <div className="flex items-center mt-1">
                                <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-black/50 px-2 py-1 rounded-md flex items-center">
                                   {visiblePasswords[user.id] ? user.password : '••••••'}
                                   <button 
                                      onClick={(e) => togglePasswordVisibility(user.id, e)} 
                                      className="ml-2 text-gray-400 hover:text-black dark:hover:text-white"
                                      title="Ver Senha"
                                   >
                                      {visiblePasswords[user.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                   </button>
                                </span>
                              </div>
                            )}
                        </div>
                     </div>

                     {user.id !== 'u1' && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(user.id, user.name); }}
                            className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                </div>
              </div>
            ))}
            
            {/* Card Placeholder */}
            <div className="relative border-2 border-dashed border-gray-200 dark:border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center text-center min-h-[150px] opacity-40 hover:opacity-60 transition-opacity">
                <Monitor className="w-8 h-8 text-gray-300 dark:text-white mb-2" />
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Terminal Local</p>
                <div className="flex items-center gap-2 mt-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                   <span className="text-[10px] text-green-500 font-bold uppercase">Conectado</span>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Conectar Dispositivo - ESTILO CYBERPUNK MINIMALISTA */}
      {showDeviceModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
          <div className="bg-white/10 dark:bg-zinc-950/80 w-full max-w-sm rounded-[2rem] p-1 relative shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden group">
            
            {/* Background Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-50 blur-xl pointer-events-none"></div>

            <div className="bg-white dark:bg-zinc-950 rounded-[1.8rem] p-8 relative overflow-hidden">
                <button 
                  onClick={() => setShowDeviceModal(false)}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-black dark:hover:text-white transition-colors z-20"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="flex flex-col items-center justify-center relative z-10">
                  <div className="flex items-center gap-2 mb-6 opacity-70">
                     <Wifi className="w-4 h-4 text-green-500 animate-pulse" />
                     <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Mobile Connect</span>
                  </div>

                  {/* QR Container Stylized */}
                  <div className="relative group cursor-pointer mb-6">
                       {currentServerIp ? (
                        <>
                           <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-700"></div>
                           <div className="relative p-3 bg-white rounded-xl border-4 border-white dark:border-zinc-900 shadow-xl overflow-hidden">
                              <img 
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(getQRData())}&color=000000&bgcolor=ffffff`} 
                                  alt="QR Code" 
                                  className="w-40 h-40 rounded-lg"
                              />
                              {/* Scan Line Animation */}
                              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent h-full w-full animate-pulse pointer-events-none" style={{ animationDuration: '2s' }}></div>
                           </div>
                        </>
                       ) : (
                         <div className="w-40 h-40 bg-gray-100 dark:bg-zinc-800 rounded-xl flex flex-col items-center justify-center p-4 text-center">
                            <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="text-[10px] text-gray-500">IP do Servidor não configurado neste terminal.</p>
                         </div>
                       )}
                  </div>

                  <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight mb-1">Acesso Remoto</h3>
                  <p className="text-xs text-gray-500 text-center px-4 leading-relaxed mb-6">
                    Aponte a câmera para acessar o sistema pelo celular ou tablet na mesma rede Wi-Fi.
                  </p>
                </div>

                <div className="space-y-4">
                   {/* Code Display */}
                   <div className="bg-gray-50 dark:bg-black/40 rounded-2xl p-4 border border-gray-200 dark:border-white/10 flex flex-col items-center">
                      <span className="text-[9px] font-bold uppercase text-gray-400 tracking-[0.2em] mb-1">Endereço Manual</span>
                      {currentServerIp ? (
                         <div className="font-mono text-lg font-black text-gray-900 dark:text-white tracking-widest select-all">
                            http://{currentServerIp}:3001
                         </div>
                      ) : (
                         <div className="text-xs text-red-400 font-bold">Configure o IP na tela de Login</div>
                      )}
                   </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};