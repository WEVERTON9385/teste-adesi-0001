import React, { useEffect, useState } from 'react';
import { addDays, startOfWeek, format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { storageService } from '../services/storage';
import { Order, Priority } from '../types';

export const WeeklySchedule: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  useEffect(() => {
    setOrders(storageService.getOrders());
  }, []);

  const weekDays = Array.from({ length: 5 }).map((_, i) => addDays(currentWeekStart, i));

  const getOrdersForDay = (date: Date) => {
    return orders.filter(order => {
      // Comparação via String (YYYY-MM-DD) é mais segura contra fuso horário do que Date objects
      const orderDateStr = order.dueDate.split('T')[0];
      const dayDateStr = format(date, 'yyyy-MM-dd');
      return orderDateStr === dayDateStr;
    });
  };

  const nextWeek = () => setCurrentWeekStart(addDays(currentWeekStart, 7));
  const prevWeek = () => setCurrentWeekStart(addDays(currentWeekStart, -7));

  return (
    <div className="h-full flex flex-col">
       <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Organograma Semanal</h2>
          <p className="text-gray-500 dark:text-gray-400">Visualização de entregas da semana.</p>
        </div>
        <div className="flex gap-2">
           <button onClick={prevWeek} className="px-3 py-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-700">Anterior</button>
           <button onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Hoje</button>
           <button onClick={nextWeek} className="px-3 py-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-700">Próxima</button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {weekDays.map((day, idx) => {
          const dayOrders = getOrdersForDay(day);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div key={idx} className={`min-w-[200px] flex flex-col rounded-xl border ${isToday ? 'border-blue-500 bg-blue-50/10' : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'}`}>
              <div className={`p-3 text-center border-b ${isToday ? 'border-blue-200 dark:border-blue-900' : 'border-gray-100 dark:border-zinc-800'}`}>
                <div className={`font-semibold ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'}`}>
                  {format(day, 'EEEE', { locale: ptBR })}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-500">
                  {format(day, 'd MMM')}
                </div>
              </div>
              
              <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[600px]">
                {dayOrders.length === 0 && (
                   <div className="text-center text-xs text-gray-400 mt-4">Sem entregas</div>
                )}
                {dayOrders.map(order => (
                  <div key={order.id} className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-100 dark:border-zinc-700 shadow-sm">
                    <div className="flex justify-between mb-1">
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        order.priority === Priority.URGENTE ? 'bg-red-100 text-red-700' :
                        order.priority === Priority.MEDIO ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {order.priority}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{order.client}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{order.description}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};