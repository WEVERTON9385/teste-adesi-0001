import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, CheckCircle, Clock, Search, Printer, Hash, Calendar as CalendarIcon, Activity, X, User as UserIcon, Eye } from 'lucide-react';
import { Order, Priority, OrderStatus, User } from '../types';
import { storageService } from '../services/storage';

const STATUS_STYLES = {
  [OrderStatus.PENDING]: 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400 border-gray-200 dark:border-zinc-700',
  [OrderStatus.IN_PROGRESS]: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]',
  [OrderStatus.COMPLETED]: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
  [OrderStatus.STOPPED]: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border-red-100 dark:border-red-900/50',
};

interface OrderBoardProps {
  currentUser: User;
}

export const OrderBoard: React.FC<OrderBoardProps> = ({ currentUser }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Order>>({
    priority: Priority.NORMAL,
    status: OrderStatus.PENDING
  });

  const isVendor = currentUser.role === 'vendedor';

  useEffect(() => {
    setOrders(storageService.getOrders());
    setAllUsers(storageService.getUsers());
  }, []);

  const handleSave = () => {
    if (!formData.client || !formData.description || !formData.dueDate || !formData.ocNumber || !formData.salesperson) {
        alert("Preencha todos os campos obrigatórios, incluindo o Vendedor.");
        return;
    }

    const isNew = !editingId;
    const newOrder: Order = {
      id: editingId || crypto.randomUUID(),
      ocNumber: formData.ocNumber,
      client: formData.client,
      description: formData.description,
      priority: formData.priority as Priority,
      status: formData.status as OrderStatus,
      dueDate: formData.dueDate,
      createdAt: editingId ? (orders.find(o => o.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      salesperson: formData.salesperson,
      completedAt: formData.status === OrderStatus.COMPLETED && !orders.find(o => o.id === editingId)?.completedAt ? new Date().toISOString() : undefined
    };

    const updatedOrders = storageService.saveOrder(newOrder);
    setOrders(updatedOrders);
    
    // Log Activity
    storageService.addLog(
      isNew ? 'Nova OC Criada' : 'OC Atualizada',
      `${isNew ? 'Criou' : 'Editou'} a OC #${newOrder.ocNumber} - ${newOrder.client}`,
      currentUser.name,
      isNew ? 'create' : 'update'
    );

    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ priority: Priority.NORMAL, status: OrderStatus.PENDING });
  };

  const handleDelete = (id: string, ocNumber: string) => {
    if (confirm('Tem certeza que deseja excluir esta ordem?')) {
      setOrders(storageService.deleteOrder(id));
      storageService.addLog(
        'OC Removida',
        `Excluiu a OC #${ocNumber}`,
        currentUser.name,
        'delete'
      );
    }
  };

  const openEdit = (order: Order) => {
    setEditingId(order.id);
    setFormData(order);
    setIsModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredOrders = orders
    .filter(o => {
        // Vendor Filter Logic: Vendors see only their own orders (Case Insensitive)
        if (isVendor) {
            return o.salesperson?.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
        }
        return true;
    })
    .filter(o => 
      o.client.toLowerCase().includes(searchTerm.toLowerCase()) || 
      o.ocNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
       const p = { [Priority.URGENTE]: 3, [Priority.MEDIO]: 2, [Priority.NORMAL]: 1 };
       return p[b.priority] - p[a.priority];
    });

  const availableVendors = allUsers.filter(u => u.role === 'vendedor' || u.role === 'admin');

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 no-print relative">
        <div>
          <h2 className="text-4xl font-black text-black dark:text-white tracking-tighter">{isVendor ? 'Meus Pedidos' : 'Produção'}</h2>
          <p className="text-gray-500 dark:text-gray-400 tracking-wide mt-1">{isVendor ? 'Acompanhe suas OCs' : 'Controle de OCs'}</p>
        </div>
        
        <div className="flex gap-3 items-center">
          {/* Minimalist Search */}
          <div className={`flex items-center transition-all duration-300 ${isSearchExpanded ? 'w-64 bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl px-2' : 'w-10 bg-transparent'}`}>
             <button 
               onClick={() => setIsSearchExpanded(!isSearchExpanded)}
               className={`p-2.5 rounded-xl text-gray-500 hover:text-black dark:hover:text-white transition-colors ${!isSearchExpanded ? 'hover:bg-gray-100 dark:hover:bg-zinc-800' : ''}`}
             >
                {isSearchExpanded ? <X className="w-4 h-4" /> : <Search className="w-5 h-5" />}
             </button>
             {isSearchExpanded && (
               <input 
                  autoFocus
                  type="text"
                  placeholder="Buscar OC ou Cliente..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm w-full text-gray-900 dark:text-white placeholder-gray-400"
               />
             )}
          </div>

          <button
            onClick={handlePrint}
            className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-gray-300 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all shadow-sm"
            title="Imprimir Relatório"
          >
            <Printer className="w-4 h-4" />
          </button>
          
          {/* Vendedor cannot create new OCs */}
          {!isVendor && (
            <button
                onClick={() => {
                setEditingId(null);
                setFormData({ priority: Priority.NORMAL, status: OrderStatus.PENDING, dueDate: new Date().toISOString().split('T')[0] });
                setIsModalOpen(true);
                }}
                className="bg-black dark:bg-white hover:scale-105 active:scale-95 text-white dark:text-black px-5 py-3 rounded-xl flex items-center shadow-lg shadow-black/20 dark:shadow-white/10 transition-all font-bold text-sm uppercase tracking-wide"
            >
                <Plus className="w-4 h-4 mr-2" /> Nova OC
            </button>
          )}
        </div>
      </div>

      {isVendor && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl flex items-center gap-3 no-print">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <Eye className="w-5 h-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                  <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300">Modo de Visualização Restrita</h3>
                  <p className="text-xs text-blue-700 dark:text-blue-400">Você está vendo apenas os pedidos vinculados ao seu nome ({currentUser.name}).</p>
              </div>
          </div>
      )}

      {/* Print Header */}
      <div className="hidden print:block mb-8 border-b border-black pb-4">
        <h1 className="text-4xl font-black uppercase">CRS Vision</h1>
        <p className="text-lg">Relatório de Produção - {new Date().toLocaleDateString()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2">
        {filteredOrders.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-400">
                <p>Nenhuma ordem de produção encontrada.</p>
            </div>
        )}
        {filteredOrders.map(order => (
          <div key={order.id} className="group relative bg-white dark:bg-black/40 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-2xl p-6 hover:border-gray-300 dark:hover:border-white/20 transition-all duration-300 print:border-black break-inside-avoid">
            {/* OC Number Badge */}
            <div className="absolute -top-3 -right-3">
               <div className="bg-black dark:bg-white text-white dark:text-black text-xs font-black px-3 py-1 rounded-lg shadow-lg flex items-center gap-1">
                 <Hash className="w-3 h-3" />
                 {order.ocNumber}
               </div>
            </div>

            <div className="flex justify-between items-start mb-4">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${
                  order.priority === Priority.URGENTE ? 'text-red-500 border-red-500/30 bg-red-500/10' :
                  order.priority === Priority.MEDIO ? 'text-orange-500 border-orange-500/30 bg-orange-500/10' :
                  'text-blue-500 border-blue-500/30 bg-blue-500/10'
              }`}>
                {order.priority}
              </span>
              
              {!isVendor && (
                  <div className="flex gap-2 no-print opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(order)} className="text-gray-400 hover:text-white transition-colors">
                    <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(order.id, order.ocNumber)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                    </button>
                </div>
              )}
            </div>
            
            <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2 leading-tight">{order.client}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed font-light">{order.description}</p>
            
            <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-2">
                       <CalendarIcon className="w-4 h-4 text-gray-400" />
                       <div className="flex flex-col">
                          <span className="text-[10px] uppercase text-gray-400 font-bold">Entrega</span>
                          <span className="text-sm font-mono font-bold text-gray-900 dark:text-white">{new Date(order.dueDate).toLocaleDateString('pt-BR')}</span>
                       </div>
                    </div>
                </div>

                {!isVendor && order.salesperson && (
                    <div className="flex items-center gap-2 px-1">
                        <UserIcon className="w-3 h-3 text-gray-400" />
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Vend: {order.salesperson}</span>
                    </div>
                )}

                <div className={`flex items-center justify-center p-2 rounded-lg border text-xs font-bold uppercase tracking-wider ${STATUS_STYLES[order.status]}`}>
                    {order.status === OrderStatus.COMPLETED && <CheckCircle className="w-4 h-4 mr-2" />}
                    {order.status === OrderStatus.IN_PROGRESS && <Activity className="w-4 h-4 mr-2 animate-pulse" />}
                    {order.status === OrderStatus.PENDING && <Clock className="w-4 h-4 mr-2" />}
                    {order.status}
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal - Hidden for Vendors generally, but logic prevents opening anyway */}
      {isModalOpen && !isVendor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 no-print animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg p-8 shadow-2xl border border-gray-200 dark:border-white/10 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-3xl font-black mb-8 dark:text-white tracking-tighter">{editingId ? 'Editar Produção' : 'Nova Ordem de Corte'}</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 ml-1">Número da OC</label>
                    <input
                      type="text"
                      className="w-full p-4 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none font-mono"
                      value={formData.ocNumber || ''}
                      onChange={e => setFormData({ ...formData, ocNumber: e.target.value })}
                      placeholder="0000"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 ml-1">Data de Entrega</label>
                    <input
                      type="date"
                      className="w-full p-4 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
                      value={formData.dueDate?.split('T')[0] || ''}
                      onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 ml-1">Cliente</label>
                <input
                  type="text"
                  className="w-full p-4 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
                  value={formData.client || ''}
                  onChange={e => setFormData({ ...formData, client: e.target.value })}
                  placeholder="Nome do cliente"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 ml-1">Vendedor <span className="text-red-500">*</span></label>
                <select
                  className="w-full p-4 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 dark:text-white outline-none"
                  value={formData.salesperson || ''}
                  onChange={e => setFormData({ ...formData, salesperson: e.target.value })}
                >
                  <option value="">Selecione o Vendedor</option>
                  {availableVendors.map(user => (
                      <option key={user.id} value={user.name}>{user.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 ml-1">Descrição do Serviço</label>
                <textarea
                  className="w-full p-4 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
                  rows={3}
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalhes da produção..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 ml-1">Prioridade</label>
                  <select
                    className="w-full p-4 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 dark:text-white outline-none"
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value as Priority })}
                  >
                    {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                   <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 ml-1">Status</label>
                  <select
                    className="w-full p-4 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 dark:text-white outline-none"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as OrderStatus })}
                  >
                    {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-10">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors">Cancelar</button>
              <button onClick={handleSave} className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:scale-105 transition-all font-bold uppercase tracking-wider text-xs shadow-lg shadow-black/20 dark:shadow-white/20">Salvar OC</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};