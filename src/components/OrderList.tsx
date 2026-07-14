import React, { useState } from 'react';
import { ServiceOrder, OrderStatus } from '../types';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Layers, 
  ArrowRight,
  RefreshCw,
  PlusCircle,
  Trash2
} from 'lucide-react';

interface OrderListProps {
  orders: ServiceOrder[];
  onSelectOrder: (orderId: string) => void;
  onEditOrder: (order: ServiceOrder) => void;
  onPrintOrder: (order: ServiceOrder) => void;
  onNavigateToTab: (tab: 'list' | 'create') => void;
  onDeleteOrder: (orderId: string) => void;
}

export default function OrderList({ 
  orders, 
  onSelectOrder, 
  onEditOrder, 
  onPrintOrder,
  onNavigateToTab,
  onDeleteOrder
}: OrderListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');
  const [onlyRework, setOnlyRework] = useState(false);

  // Extract all unique sections for filtering
  const allSections = Array.from(
    new Set(
      orders.flatMap(order => order.executions.map(exec => exec.section))
    )
  ).filter(Boolean);

  // Apply filters
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.drawingNumber && order.drawingNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      order.details.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    
    const matchesSection = sectionFilter === 'ALL' || 
      order.executions.some(exec => exec.section === sectionFilter);

    const matchesRework = !onlyRework || order.rework;

    return matchesSearch && matchesStatus && matchesSection && matchesRework;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Aberto
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Em Andamento
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Concluído
          </span>
        );
      case 'REWORK':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Retrabalho
          </span>
        );
    }
  };

  const calculateHours = (order: ServiceOrder) => {
    const total = order.executions.reduce((sum, exec) => sum + exec.totalHours, 0);
    const h = Math.floor(total);
    const m = Math.round((total - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}h`;
  };

  const calculateProgress = (order: ServiceOrder) => {
    if (order.subServices.length === 0) return 0;
    const completed = order.subServices.filter(s => s.executed).length;
    return Math.round((completed / order.subServices.length) * 100);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return dateStr.split('-').reverse().join('/');
  };

  const getActivityCode = (name?: string): string => {
    if (!name) return '';
    const saved = localStorage.getItem('detecta_registered_activities');
    if (saved) {
      try {
        const list = JSON.parse(saved);
        const found = list.find((act: any) => act.name.toUpperCase() === name.toUpperCase());
        return found ? found.code : '';
      } catch (e) {
        return '';
      }
    }
    return '';
  };

  return (
    <div className="space-y-6" id="order-list-section">
      {/* Header and Quick stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">
            Gestão de Ordens de Serviço
          </h1>
          <p className="text-sm text-slate-500">
            Acompanhe o progresso, ordene, filtre e emita relatórios técnicos.
          </p>
        </div>
        <button
          onClick={() => onNavigateToTab('create')}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl transition duration-200 shadow-md shadow-blue-500/10 text-xs md:text-sm cursor-pointer"
          id="btn-list-new-os"
        >
          <PlusCircle className="h-4 w-4" />
          Nova O.S.
        </button>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Search Query */}
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
            <input
              type="text"
              placeholder="Buscar por O.S., Cliente, Atividade ou Detalhes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs md:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-slate-800 font-medium"
              id="input-search-query"
            />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'ALL')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-700 font-bold cursor-pointer"
              id="select-status-filter"
            >
              <option value="ALL">Todos os Status</option>
              <option value="OPEN">Aberto</option>
              <option value="IN_PROGRESS">Em Andamento</option>
              <option value="CLOSED">Concluído</option>
              <option value="REWORK">Retrabalho</option>
            </select>
          </div>

          {/* Section Filter */}
          <div className="md:col-span-2">
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-700 font-bold cursor-pointer"
              id="select-section-filter"
            >
              <option value="ALL">Todas as Seções</option>
              {allSections.map(sec => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>

          {/* Rework Toggler */}
          <div className="md:col-span-2 flex items-center justify-start md:justify-center">
            <label className="flex items-center gap-2 cursor-pointer text-xs md:text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={onlyRework}
                onChange={(e) => setOnlyRework(e.target.checked)}
                className="rounded border-slate-350 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                id="checkbox-only-rework"
              />
              Sinal de Retrabalho
            </label>
          </div>
        </div>
      </div>

      {/* Table & List Area */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="max-w-md mx-auto space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-full w-fit mx-auto text-slate-400">
              <Filter className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Nenhuma O.S. Encontrada</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Ajuste seus filtros de busca ou crie uma nova Ordem de Serviço no sistema de campo.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setSectionFilter('ALL');
                  setOnlyRework(false);
                }}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" /> Limpar Filtros
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Responsive Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse" id="desktop-order-table">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-5">Código / Cliente</th>
                  <th className="py-4 px-4">Atividade / Rev / Qtd</th>
                  <th className="py-4 px-4">Prazo de Entrega Estimado</th>
                  <th className="py-4 px-4">Apontamento Horas</th>
                  <th className="py-4 px-4">Progresso O.S.</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-xs md:text-sm">
                {filteredOrders.map(order => {
                  const progress = calculateProgress(order);
                  const isOverdue = order.status !== 'CLOSED' && order.deliveryDeadline && new Date(order.deliveryDeadline + 'T23:59:59') < new Date();
                  
                  const getDeadlineStatusText = () => {
                    if (!order.deliveryDeadline) return null;
                    const deadline = new Date(order.deliveryDeadline + 'T23:59:59');
                    if (order.status === 'CLOSED') {
                      const actual = order.completedAt ? new Date(order.completedAt + 'T00:00:00') : new Date();
                      const deadlineDateOnly = new Date(order.deliveryDeadline + 'T00:00:00');
                      const diffTime = actual.getTime() - deadlineDateOnly.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      if (diffDays > 0) {
                        return (
                          <div className="text-[10px] text-rose-500 font-bold mt-0.5">
                            (Atrasado {diffDays} {diffDays === 1 ? 'dia' : 'dias'})
                          </div>
                        );
                      } else {
                        return (
                          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                            (No prazo)
                          </div>
                        );
                      }
                    } else {
                      const today = new Date();
                      today.setHours(0,0,0,0);
                      const deadlineDateOnly = new Date(order.deliveryDeadline + 'T00:00:00');
                      const diffTime = today.getTime() - deadlineDateOnly.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      if (diffDays > 0) {
                        return (
                          <div className="text-[10px] text-rose-500 font-extrabold mt-0.5 uppercase">
                            Atrasado ({diffDays}d)
                          </div>
                        );
                      } else {
                        const remainingDays = Math.ceil((deadlineDateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        return (
                          <div className="text-[10px] text-blue-500 font-semibold mt-0.5">
                            {remainingDays === 0 ? 'Vence hoje' : `${remainingDays}d restantes`}
                          </div>
                        );
                      }
                    }
                  };

                  return (
                    <tr 
                      key={order.id} 
                      className="hover:bg-slate-50 transition-colors group cursor-pointer"
                      onClick={() => onSelectOrder(order.id)}
                    >
                      {/* Code / Client */}
                      <td className="py-4 px-5">
                        <div className="font-mono text-sm font-extrabold text-slate-900">
                          {order.code}
                        </div>
                        <div className="font-bold text-slate-700 text-xs mt-0.5">
                          {order.client}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1.5 font-semibold flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>Abertura: {formatDate(order.date)}{order.startTime ? ` às ${order.startTime}` : ''}</span>
                        </div>
                      </td>

                      {/* Drawing / Revision / Quantity */}
                      <td className="py-4 px-4">
                        <div className="text-slate-800 text-xs font-semibold">
                          Atividade: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-150">{getActivityCode(order.drawingNumber) ? `[${getActivityCode(order.drawingNumber)}] ` : ''}{order.drawingNumber || 'N/A'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 flex gap-2 font-semibold">
                          <span>Rev: {order.revision || '-'}</span>
                          <span>•</span>
                          <span>Qtd: {order.quantity}</span>
                        </div>
                      </td>

                      {/* Delivery deadline */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 text-xs font-semibold">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span className={isOverdue ? "text-rose-600 font-extrabold" : ""}>
                            {formatDate(order.deliveryDeadline)}
                          </span>
                        </div>
                        {getDeadlineStatusText()}
                        {order.completedAt && (
                          <div className="text-[10px] text-emerald-600 font-bold mt-1">
                            Concluído em: {formatDate(order.completedAt)}{order.completedTime ? ` às ${order.completedTime}` : ''}
                          </div>
                        )}
                      </td>

                      {/* Logged Hours */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs font-mono">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {calculateHours(order)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-semibold">
                          {order.executions.length} apontamentos
                        </div>
                      </td>

                      {/* Progress Bar */}
                      <td className="py-4 px-4">
                        <div className="w-32">
                          <div className="flex items-center justify-between text-[11px] mb-1 font-semibold">
                            <span className="text-slate-500">Tarefas</span>
                            <span className="font-mono font-bold text-slate-850">{progress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-150">
                            <div 
                              className="bg-blue-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex justify-center">
                          {getStatusBadge(order.status)}
                        </div>
                        {order.rework && (
                          <div className="mt-1 flex items-center justify-center gap-1">
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-rose-50 text-rose-700 border border-rose-200 text-[9px] rounded font-extrabold uppercase">
                              <AlertTriangle className="h-2 w-2" /> Retrabalho
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onSelectOrder(order.id)}
                            title="Visualizar Detalhes"
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition duration-150 cursor-pointer shadow-sm"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onEditOrder(order)}
                            title="Editar O.S."
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-blue-600 transition duration-150 cursor-pointer shadow-sm"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onPrintOrder(order)}
                            title="Gerar Relatório"
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-emerald-600 transition duration-150 cursor-pointer shadow-sm"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onDeleteOrder(order.id)}
                            title="Excluir O.S."
                            className="p-1.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg text-slate-400 hover:text-rose-650 transition duration-150 cursor-pointer shadow-sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile responsive Cards layout */}
          <div className="md:hidden space-y-4" id="mobile-order-cards">
            {filteredOrders.map(order => {
              const progress = calculateProgress(order);
              const isOverdue = order.status !== 'CLOSED' && order.deliveryDeadline && new Date(order.deliveryDeadline + 'T23:59:59') < new Date();

              const getDeadlineStatusText = () => {
                if (!order.deliveryDeadline) return null;
                const deadline = new Date(order.deliveryDeadline + 'T23:59:59');
                if (order.status === 'CLOSED') {
                  const actual = order.completedAt ? new Date(order.completedAt + 'T00:00:00') : new Date();
                  const deadlineDateOnly = new Date(order.deliveryDeadline + 'T00:00:00');
                  const diffTime = actual.getTime() - deadlineDateOnly.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  if (diffDays > 0) {
                    return (
                      <span className="text-[10px] text-rose-500 font-bold block mt-0.5">
                        (Atrasado {diffDays} {diffDays === 1 ? 'dia' : 'dias'})
                      </span>
                    );
                  } else {
                    return (
                      <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                        (No prazo)
                      </span>
                    );
                  }
                } else {
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const deadlineDateOnly = new Date(order.deliveryDeadline + 'T00:00:00');
                  const diffTime = today.getTime() - deadlineDateOnly.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  if (diffDays > 0) {
                    return (
                      <span className="text-[10px] text-rose-500 font-extrabold block mt-0.5 uppercase">
                        Atrasado ({diffDays}d)
                      </span>
                    );
                  } else {
                    const remainingDays = Math.ceil((deadlineDateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <span className="text-[10px] text-blue-500 font-semibold block mt-0.5">
                        {remainingDays === 0 ? 'Vence hoje' : `${remainingDays}d restantes`}
                      </span>
                    );
                  }
                }
              };

              return (
                <div 
                  key={order.id}
                  onClick={() => onSelectOrder(order.id)}
                  className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm active:bg-slate-50 transition-colors"
                >
                  {/* Top line Code & Status */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-base font-extrabold text-slate-900">
                        O.S. {order.code}
                      </div>
                      <div className="text-slate-800 font-bold text-xs mt-0.5">
                        {order.client}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      {getStatusBadge(order.status)}
                      {order.rework && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] rounded font-bold uppercase">
                          <AlertTriangle className="h-2.5 w-2.5" /> Retrabalho
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mid Section details */}
                  <div className="grid grid-cols-2 gap-3 text-xs border-t border-b border-slate-100 py-3 text-slate-650">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">Data/Hora Abertura</span>
                      <span className="font-bold text-slate-850 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {formatDate(order.date)}{order.startTime ? ` ${order.startTime}` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">Atividade / Rev</span>
                      <span className="font-bold text-slate-800 mt-0.5 block">{getActivityCode(order.drawingNumber) ? `[${getActivityCode(order.drawingNumber)}] ` : ''}{order.drawingNumber || 'N/A'} {order.revision ? `(Rev. ${order.revision})` : ''}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">Quantidade</span>
                      <span className="font-bold text-slate-800 mt-0.5 block">{order.quantity} pçs</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">Prazo Estimado</span>
                      <span className={`font-bold mt-0.5 block ${isOverdue ? 'text-rose-600' : 'text-slate-800'}`}>
                        {formatDate(order.deliveryDeadline)}
                      </span>
                      {getDeadlineStatusText()}
                      {order.completedAt && (
                        <div className="text-[10px] text-emerald-600 font-bold mt-1">
                          Entrega: {formatDate(order.completedAt)}{order.completedTime ? ` às ${order.completedTime}` : ''}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-bold">Progresso das Etapas</span>
                      <span className="font-mono font-extrabold text-slate-800">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-150">
                      <div 
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectOrder(order.id);
                      }}
                      className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline"
                    >
                      Ver detalhes <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onEditOrder(order)}
                        className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-blue-600 cursor-pointer shadow-sm"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onPrintOrder(order)}
                        className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-emerald-600 cursor-pointer shadow-sm"
                        title="Relatório"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteOrder(order.id)}
                        className="p-2 bg-slate-50 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 rounded-lg text-slate-400 hover:text-rose-650 cursor-pointer shadow-sm"
                        title="Excluir O.S."
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
