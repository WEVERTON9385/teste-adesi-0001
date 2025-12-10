import React, { useEffect, useState } from 'react';
import { Order, OrderStatus, Priority } from '../types';
import { storageService } from '../services/storage';
import { AlertTriangle, CheckCircle2, Clock, Calendar, BarChart3 } from 'lucide-react';

export const PerformanceAnalysis: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    setOrders(storageService.getOrders());
  }, []);

  // Data helpers
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filtros Básicos
  const monthlyOrders = orders.filter(o => {
    const d = new Date(o.dueDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const completedInMonth = monthlyOrders.filter(o => o.status === OrderStatus.COMPLETED).length;
  const activeOrders = orders.filter(o => o.status === OrderStatus.IN_PROGRESS || o.status === OrderStatus.PENDING).length;

  // Lógica: Ranking de Urgência por Vendedor (Mês Atual)
  const urgencyRanking = monthlyOrders.reduce((acc, order) => {
    if (order.priority === Priority.URGENTE && order.salesperson) {
      acc[order.salesperson] = (acc[order.salesperson] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const sortedUrgencyList = Object.entries(urgencyRanking)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  // Lógica: Volume Geral por Vendedor (Mês Atual)
  const volumeRanking = monthlyOrders.reduce((acc, order) => {
    if (order.salesperson) {
      acc[order.salesperson] = (acc[order.salesperson] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const sortedVolumeList = Object.entries(volumeRanking)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5) // Top 5
    .map(([name, count]) => ({ name, count }));
    
  const maxVolume = sortedVolumeList.length > 0 ? sortedVolumeList[0].count : 1;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
       <div className="flex justify-between items-end border-b border-gray-200 dark:border-white/10 pb-6">
          <div>
            <h2 className="text-4xl font-black text-black dark:text-white tracking-tighter">Desempenho</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Resumo de {now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>
          </div>
       </div>

       {/* KPIs Simplificados */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 p-6 rounded-2xl flex items-center gap-4">
               <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                  <Clock className="w-8 h-8" />
               </div>
               <div>
                  <div className="text-4xl font-black text-black dark:text-white">{activeOrders}</div>
                  <div className="text-xs text-gray-500 uppercase font-bold tracking-widest">Ativos na Fila</div>
               </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 p-6 rounded-2xl flex items-center gap-4">
               <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-8 h-8" />
               </div>
               <div>
                  <div className="text-4xl font-black text-black dark:text-white">{completedInMonth}</div>
                  <div className="text-xs text-gray-500 uppercase font-bold tracking-widest">Entregues no Mês</div>
               </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 p-6 rounded-2xl flex items-center gap-4">
               <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl text-gray-600 dark:text-gray-400">
                  <BarChart3 className="w-8 h-8" />
               </div>
               <div>
                  <div className="text-4xl font-black text-black dark:text-white">{monthlyOrders.length}</div>
                  <div className="text-xs text-gray-500 uppercase font-bold tracking-widest">Volume Total (Mês)</div>
               </div>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           
           {/* Ranking de Urgência (Solicitado) */}
           <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-3xl p-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <AlertTriangle className="w-40 h-40 text-red-500" />
               </div>
               
               <h3 className="text-xl font-black text-red-900 dark:text-red-100 mb-6 flex items-center gap-2 relative z-10">
                   <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" /> 
                   Ranking de Urgência
               </h3>
               <p className="text-xs text-red-700 dark:text-red-300 mb-6 uppercase tracking-wide font-bold opacity-70">
                 Vendedores com mais pedidos urgentes este mês
               </p>
               
               <div className="space-y-3 relative z-10">
                   {sortedUrgencyList.length === 0 && (
                     <div className="text-center py-10 text-red-400/50 font-bold">Sem pedidos urgentes este mês.</div>
                   )}
                   {sortedUrgencyList.map((item, idx) => (
                       <div key={item.name} className="flex items-center justify-between p-4 bg-white/80 dark:bg-black/40 backdrop-blur-sm rounded-xl border border-red-100 dark:border-red-500/10">
                           <div className="flex items-center gap-4">
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                 idx === 0 ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                               }`}>
                                   {idx + 1}
                               </div>
                               <span className="font-bold text-gray-900 dark:text-white text-lg">{item.name}</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <span className="text-2xl font-black text-red-600 dark:text-red-400">{item.count}</span>
                              <span className="text-[10px] font-bold text-red-400 uppercase">Urgentes</span>
                           </div>
                       </div>
                   ))}
               </div>
           </div>

           {/* Ranking de Volume Geral */}
           <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-3xl p-8">
               <h3 className="text-xl font-black text-black dark:text-white mb-6 flex items-center gap-2">
                   Volume Geral
               </h3>
               <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 uppercase tracking-wide font-bold">
                 Top 5 Vendedores por quantidade de OCs (Mês)
               </p>

               <div className="space-y-4">
                   {sortedVolumeList.length === 0 && (
                     <div className="text-center py-10 text-gray-300 font-bold">Sem dados no período.</div>
                   )}
                   {sortedVolumeList.map((item, idx) => (
                       <div key={item.name} className="relative">
                           <div className="flex justify-between items-center mb-1 relative z-10">
                               <span className="font-bold text-gray-700 dark:text-gray-200">{item.name}</span>
                               <span className="font-mono font-bold text-gray-900 dark:text-white">{item.count} OCs</span>
                           </div>
                           <div className="h-3 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                               <div 
                                 className="h-full bg-black dark:bg-white rounded-full opacity-80"
                                 style={{ width: `${(item.count / maxVolume) * 100}%` }}
                               ></div>
                           </div>
                       </div>
                   ))}
               </div>
           </div>
       </div>
    </div>
  );
};