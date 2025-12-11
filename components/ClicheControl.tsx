import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Check, Send, Trash2, Plus, X, Calendar } from 'lucide-react';
import { ClicheItem, User } from '../types';
import { storageService } from '../services/storage';

interface ClicheControlProps {
  currentUser: User;
}

export const ClicheControl: React.FC<ClicheControlProps> = ({ currentUser }) => {
  const [items, setItems] = useState<ClicheItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [desc, setDesc] = useState('');
  const [client, setClient] = useState('');

  // States for Receiving
  const [receivingItem, setReceivingItem] = useState<ClicheItem | null>(null);
  const [manualReceiveDate, setManualReceiveDate] = useState('');

  useEffect(() => {
    setItems(storageService.getCliches());
  }, []);

  const handleSend = () => {
    if (!desc || !client) return;
    const newItem: ClicheItem = {
      id: crypto.randomUUID(),
      description: desc,
      client: client,
      sentDate: new Date().toISOString(),
      status: 'sent'
    };
    const updated = storageService.saveCliche(newItem);
    setItems(updated);
    
    storageService.addLog(
      'Clichê Enviado',
      `Enviou clichê de ${client} para clicheria`,
      currentUser.name,
      'create'
    );

    setDesc('');
    setClient('');
    setIsModalOpen(false);
  };

  const handleReceiveClick = (item: ClicheItem) => {
      setReceivingItem(item);
      setManualReceiveDate(new Date().toISOString().split('T')[0]); // Default to today
  };

  const confirmReceive = () => {
    if (!receivingItem) return;

    // Use selected date + fixed time to avoid TZ issues
    const finalDate = manualReceiveDate.includes('T') ? manualReceiveDate : `${manualReceiveDate}T12:00:00.000Z`;

    const updatedItem: ClicheItem = {
      ...receivingItem,
      status: 'received',
      receivedDate: finalDate
    };
    const updated = storageService.saveCliche(updatedItem);
    setItems(updated);
    
    storageService.addLog(
      'Clichê Recebido',
      `Recebeu clichê de ${updatedItem.client}`,
      currentUser.name,
      'update'
    );

    setReceivingItem(null);
  };

  const sentItems = items.filter(i => i.status === 'sent');
  const receivedItems = items.filter(i => i.status === 'received').sort((a,b) => 
    new Date(b.receivedDate!).getTime() - new Date(a.receivedDate!).getTime()
  );

  return (
    <div>
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h2 className="text-4xl font-black text-black dark:text-white tracking-tighter">Clicheria</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Controle de envios e recebimentos</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="group flex items-center px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold shadow-xl shadow-black/20 dark:shadow-white/10 hover:scale-105 transition-all uppercase tracking-wider text-xs"
          >
            <Send className="w-4 h-4 mr-2" />
            Novo Envio
          </button>
       </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sent List */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-orange-50/50 dark:bg-orange-500/5">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                <h3 className="font-bold text-gray-900 dark:text-white">Aguardando Retorno</h3>
             </div>
             <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 text-xs font-black px-2 py-1 rounded-lg">{sentItems.length}</span>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {sentItems.length === 0 && <div className="p-10 text-center text-gray-400 text-sm">Nenhum clichê enviado.</div>}
            {sentItems.map(item => (
              <div key={item.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <div>
                  <div className="font-bold text-lg text-gray-900 dark:text-white">{item.client}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-light">{item.description}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-orange-500 mt-2">Enviado: {new Date(item.sentDate).toLocaleDateString()}</div>
                </div>
                <button 
                  onClick={() => handleReceiveClick(item)}
                  className="px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-200 dark:hover:border-green-800 hover:text-green-600 transition-all shadow-sm"
                >
                  Receber
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Received List */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm opacity-90">
          <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <h3 className="font-bold text-gray-900 dark:text-white">Recebidos Recentemente</h3>
             </div>
          </div>
           <div className="divide-y divide-gray-100 dark:divide-white/5 max-h-[500px] overflow-y-auto">
            {receivedItems.length === 0 && <div className="p-10 text-center text-gray-400 text-sm">Histórico vazio.</div>}
            {receivedItems.map(item => (
              <div key={item.id} className="p-6 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <div>
                  <div className="text-gray-900 dark:text-white font-medium">{item.client}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
                </div>
                <div className="text-right">
                   <div className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md text-[10px] font-black uppercase tracking-widest inline-block mb-1">Recebido</div>
                   <div className="text-[10px] text-gray-400 font-mono">{new Date(item.receivedDate!).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Novo Envio */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md p-8 shadow-2xl border border-gray-200 dark:border-white/10 relative">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h3 className="text-2xl font-black mb-8 dark:text-white tracking-tighter">Registrar Envio</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 ml-1">Cliente</label>
                  <input 
                    value={client}
                    onChange={e => setClient(e.target.value)}
                    className="w-full p-4 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
                    placeholder="Nome do cliente"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 ml-1">Descrição</label>
                  <textarea 
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    className="w-full p-4 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
                    rows={3}
                    placeholder="Detalhes do material..."
                  />
                </div>
                
                <button 
                  onClick={handleSend}
                  className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl hover:scale-[1.02] transition-all uppercase tracking-widest text-xs shadow-lg"
                >
                  Confirmar Envio
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Modal Confirmar Recebimento */}
      {receivingItem && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-sm p-8 shadow-2xl border border-gray-200 dark:border-white/10 relative">
               <button 
                onClick={() => setReceivingItem(null)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
               
               <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mb-4">
                      <Check className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black dark:text-white">Confirmar Recebimento</h3>
                  <p className="text-gray-500 text-sm mt-1">Clichê de <strong>{receivingItem.client}</strong></p>
               </div>

               <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 ml-1">Data do Recebimento</label>
                    <input 
                      type="date"
                      value={manualReceiveDate}
                      onChange={e => setManualReceiveDate(e.target.value)}
                      className="w-full p-4 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
                    />
                  </div>

                  <button 
                    onClick={confirmReceive}
                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all uppercase tracking-widest text-xs shadow-lg"
                  >
                    Confirmar
                  </button>
               </div>
           </div>
         </div>
      )}
    </div>
  );
};