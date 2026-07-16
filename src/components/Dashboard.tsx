import React from 'react';
import { ServiceOrder, ExecutionEntry } from '../types';
import { 
  Wrench, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  FileText, 
  PlusCircle, 
  Play
} from 'lucide-react';

interface DashboardProps {
  orders: ServiceOrder[];
  onNavigateToTab: (tab: 'list' | 'create') => void;
  onSelectOrder: (orderId: string) => void;
}

export default function Dashboard({ orders, onNavigateToTab, onSelectOrder }: DashboardProps) {
  // Calculations
  const totalOrders = orders.length;
  const openOrders = orders.filter(o => o.status === 'OPEN').length;
  const inProgressOrders = orders.filter(o => o.status === 'IN_PROGRESS').length;
  const closedOrders = orders.filter(o => o.status === 'CLOSED').length;
  const reworkOrders = orders.filter(o => o.status === 'REWORK').length;
  const activeOrdersCount = openOrders + inProgressOrders + reworkOrders;

  // Calculate total hours
  const totalHours = orders.reduce((sum, order) => {
    const orderHours = order.executions.reduce((acc, curr) => acc + curr.totalHours, 0);
    return sum + orderHours;
  }, 0);

  // Get all recent executions across all orders
  const allExecutionsWithOrder: { exec: ExecutionEntry; orderCode: string; client: string; orderId: string }[] = [];
  orders.forEach(order => {
    order.executions.forEach(exec => {
      allExecutionsWithOrder.push({
        exec,
        orderCode: order.code,
        client: order.client,
        orderId: order.id
      });
    });
  });

  // Sort executions by date desc (most recent first)
  const recentExecutions = allExecutionsWithOrder
    .sort((a, b) => {
      // Compare date, if equal compare start time
      if (b.exec.date !== a.exec.date) {
        return b.exec.date.localeCompare(a.exec.date);
      }
      return b.exec.startTime.localeCompare(a.exec.startTime);
    })
    .slice(0, 5);

  // Section/Department workload (total hours by section)
  const sectionHours: { [key: string]: number } = {};
  orders.forEach(order => {
    order.executions.forEach(exec => {
      if (exec.section && exec.section.trim() !== '') {
        sectionHours[exec.section] = (sectionHours[exec.section] || 0) + exec.totalHours;
      }
    });
  });

  const sectionData = Object.keys(sectionHours).map(section => ({
    name: section,
    hours: sectionHours[section]
  })).sort((a, b) => b.hours - a.hours);

  // Format hours as HH:MM
  const formatHours = (hoursDecimal: number) => {
    const h = Math.floor(hoursDecimal);
    const m = Math.round((hoursDecimal - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}h`;
  };

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Detecta <span className="text-blue-400">Service</span></h1>
          <p className="text-slate-400 mt-2 max-w-xl text-xs md:text-sm font-medium leading-relaxed">
            Controle de ordens de serviço, apontamentos de horas por seção e relatórios técnicos. 
            Desenvolvido para máxima agilidade e visualização em campo.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <button
            onClick={() => onNavigateToTab('create')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl transition duration-200 shadow-md shadow-blue-500/10 text-xs md:text-sm cursor-pointer"
            id="btn-quick-new-os"
          >
            <PlusCircle className="h-4 w-4" />
            Nova O.S.
          </button>
          <button
            onClick={() => onNavigateToTab('list')}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2.5 rounded-xl transition duration-200 text-xs md:text-sm border border-slate-700 cursor-pointer"
            id="btn-quick-view-os"
          >
            <FileText className="h-4 w-4 text-slate-400" />
            Ver Ordens
          </button>
        </div>
      </div>

      {/* Stats Cards Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Active */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">Ativas em Campo</span>
            <div className="text-3xl font-extrabold text-slate-900">{activeOrdersCount}</div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1 font-semibold">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              {inProgressOrders} em execução | {openOrders} pendentes
            </div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200/50 rounded-xl text-slate-700 shadow-sm">
            <Wrench className="h-5.5 w-5.5 text-blue-600" />
          </div>
        </div>

        {/* Concluded */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">Concluídas</span>
            <div className="text-3xl font-extrabold text-slate-900">{closedOrders}</div>
            <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 inline" />
              Taxa de entrega: {totalOrders > 0 ? Math.round((closedOrders / totalOrders) * 100) : 0}%
            </div>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 shadow-sm">
            <CheckCircle2 className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* Total Hours */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">Horas Apontadas</span>
            <div className="text-3xl font-extrabold text-slate-900 font-mono">{formatHours(totalHours)}</div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1 font-semibold">
              <Clock className="h-3 w-3 inline" />
              Média: {totalOrders > 0 ? formatHours(totalHours / totalOrders) : '00:00h'} por O.S.
            </div>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 shadow-sm">
            <Clock className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* Rework Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">Retrabalho</span>
            <div className="text-3xl font-extrabold text-slate-900">{reworkOrders}</div>
            <div className={`text-[11px] font-bold flex items-center gap-1 ${reworkOrders > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
              <AlertTriangle className="h-3 w-3 inline" />
              {reworkOrders > 0 ? 'Atenção corretiva exigida' : 'Nenhuma inconformidade'}
            </div>
          </div>
          <div className={`p-3 rounded-xl border shadow-sm ${reworkOrders > 0 ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-slate-50 border-slate-200/50 text-slate-400'}`}>
            <AlertTriangle className="h-5.5 w-5.5" />
          </div>
        </div>
      </div>

      {/* Main Content Area: Hours by Department & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Department Hours Breakdown */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Horas de Trabalho por Seção
              </h2>
              <p className="text-xs text-slate-400 mt-1">Apontamentos acumulados para todas as Ordens de Serviço</p>
            </div>
          </div>

          {sectionData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Users className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm font-semibold">Nenhum apontamento de horas registrado até o momento.</p>
              <button 
                onClick={() => onNavigateToTab('list')}
                className="mt-3 text-xs font-bold text-blue-600 hover:underline"
              >
                Selecionar O.S. para apontar horas →
              </button>
            </div>
          ) : (
            <div className="space-y-5 py-2">
              {sectionData.map((sec, idx) => {
                const maxHours = Math.max(...sectionData.map(s => s.hours));
                const percentage = maxHours > 0 ? (sec.hours / maxHours) * 100 : 0;
                
                // Assign matching progress bar styles - Sleek bright colors
                let barColor = 'bg-blue-600';
                if (sec.name.includes('PINTURA')) barColor = 'bg-indigo-600';
                else if (sec.name.includes('USINAGEM')) barColor = 'bg-amber-500';
                else if (sec.name.includes('MONTAGEM')) barColor = 'bg-emerald-500';
                else if (sec.name.includes('INSPEC')) barColor = 'bg-rose-500';

                return (
                  <div key={sec.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                        <span className="font-bold text-slate-800 text-xs md:text-sm">{sec.name}</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-700">
                        {formatHours(sec.hours)}
                      </span>
                    </div>
                    <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Recent Executions / Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Atividades Recentes
              </h2>
              <p className="text-xs text-slate-400 mt-1">Últimos apontamentos de campo</p>
            </div>
          </div>

          <div className="space-y-4">
            {recentExecutions.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Clock className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm font-semibold">Nenhum apontamento registrado.</p>
              </div>
            ) : (
              <div className="flow-root">
                <ul className="-mb-8">
                  {recentExecutions.map((item, itemIdx) => {
                    const formattedDate = item.exec.date.split('-').reverse().join('/');
                    
                    return (
                      <li key={item.exec.id}>
                        <div className="relative pb-8">
                          {itemIdx !== recentExecutions.length - 1 ? (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-100" aria-hidden="true" />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 ring-4 ring-white">
                                <Play className="h-3 w-3 fill-slate-600 text-slate-600" />
                              </span>
                            </div>
                            <div className="flex-1 min-w-0 pt-1.5">
                              <p className="text-xs text-slate-500">
                                <span className="font-extrabold text-slate-800">{item.exec.operator}</span> apontou{' '}
                                <span className="font-bold text-slate-900 font-mono">{formatHours(item.exec.totalHours)}</span> em{' '}
                                <span className="font-bold text-blue-600">{item.exec.section}</span>
                              </p>
                              <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-400">
                                <span className="font-medium">{formattedDate} • {item.exec.startTime} - {item.exec.endTime}</span>
                                <span>•</span>
                                <button 
                                  onClick={() => onSelectOrder(item.orderId)}
                                  className="text-blue-600 hover:underline font-bold font-mono"
                                >
                                  O.S. {item.orderCode}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
