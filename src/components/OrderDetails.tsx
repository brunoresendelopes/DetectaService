import React, { useState } from 'react';
import { ServiceOrder, ExecutionEntry, SubService, Operator, Section } from '../types';
import { INITIAL_SECTIONS, INITIAL_OPERATORS } from '../mockData';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  Layers, 
  FileText,
  Check,
  Play,
  Briefcase
} from 'lucide-react';

interface OrderDetailsProps {
  order: ServiceOrder;
  onBack: () => void;
  onUpdateOrder: (updated: ServiceOrder) => void;
  onPrintOrder: (order: ServiceOrder) => void;
  operators: Operator[];
  onDeleteOrder: (orderId: string) => void;
}

export default function OrderDetails({ 
  order, 
  onBack, 
  onUpdateOrder, 
  onPrintOrder,
  operators,
  onDeleteOrder
}: OrderDetailsProps) {
  const [showLogForm, setShowLogForm] = useState(false);
  
  // Hours logging form states
  const [selectedOperator, setSelectedOperator] = useState('');
  const [selectedSection, setSelectedSection] = useState(INITIAL_SECTIONS[0].name);
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('07:00');

  // Sync selectedOperator with operators prop when loaded
  React.useEffect(() => {
    if (operators && operators.length > 0) {
      const activeOps = operators.filter(op => op.active);
      if (activeOps.length > 0) {
        setSelectedOperator(activeOps[0].name);
      } else {
        setSelectedOperator(operators[0].name);
      }
    }
  }, [operators]);
  const [endTime, setEndTime] = useState('17:00');
  const [concluded, setConcluded] = useState(false);

  // Inline completion editing states
  const [isEditingCompletion, setIsEditingCompletion] = useState(false);
  const [editCompletedAt, setEditCompletedAt] = useState(order.completedAt || '');
  const [editCompletedTime, setEditCompletedTime] = useState(order.completedTime || '');

  // Keep completion inputs synchronized with order updates
  React.useEffect(() => {
    setEditCompletedAt(order.completedAt || '');
    setEditCompletedTime(order.completedTime || '');
  }, [order.completedAt, order.completedTime]);

  // Status badge style resolver
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'IN_PROGRESS':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CLOSED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REWORK':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPEN': return 'Aberto';
      case 'IN_PROGRESS': return 'Em Andamento';
      case 'CLOSED': return 'Concluído';
      case 'REWORK': return 'Retrabalho';
      default: return status;
    }
  };

  // Toggle sub-service status
  const handleToggleSubService = (subServiceId: string) => {
    const updatedSubServices = order.subServices.map(s => {
      if (s.id === subServiceId) {
        return { ...s, executed: !s.executed };
      }
      return s;
    });

    // Check if we should automatically update order status if all subservices are checked
    const allCompleted = updatedSubServices.length > 0 && updatedSubServices.every(s => s.executed);
    let newStatus = order.status;
    let completedAt = order.completedAt;
    let completedTime = order.completedTime;
    
    if (allCompleted && order.status !== 'CLOSED') {
      newStatus = 'CLOSED';
      completedAt = new Date().toISOString().split('T')[0];
      completedTime = new Date().toTimeString().slice(0, 5);
    } else if (!allCompleted && order.status === 'CLOSED') {
      newStatus = 'IN_PROGRESS';
      completedAt = undefined;
      completedTime = undefined;
    }

    onUpdateOrder({
      ...order,
      subServices: updatedSubServices,
      status: newStatus,
      completedAt,
      completedTime
    });
  };

  // Log new execution entry
  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();

    // Calculate total hours
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    let totalMin = (endH * 60 + endM) - (startH * 60 + startM);
    // Handle overnight log if any
    if (totalMin < 0) {
      totalMin += 24 * 60;
    }
    
    const decimalHours = totalMin / 60;

    const newLog: ExecutionEntry = {
      id: `exec-${Date.now()}`,
      date: logDate,
      startTime,
      endTime,
      totalHours: Number(decimalHours.toFixed(2)),
      operator: selectedOperator,
      concluded,
      section: selectedSection
    };

    // Auto update Order status to 'IN_PROGRESS' if it was 'OPEN'
    let newStatus = order.status;
    if (order.status === 'OPEN') {
      newStatus = 'IN_PROGRESS';
    }

    onUpdateOrder({
      ...order,
      status: newStatus,
      executions: [...order.executions, newLog]
    });

    // Reset Form
    setShowLogForm(false);
  };

  // Remove an execution entry
  const handleRemoveLog = (logId: string) => {
    const updatedExecutions = order.executions.filter(exec => exec.id !== logId);
    onUpdateOrder({
      ...order,
      executions: updatedExecutions
    });
  };

  // Set general status manually
  const handleSetStatus = (newStatus: any) => {
    let completedAt = order.completedAt;
    let completedTime = order.completedTime;
    if (newStatus === 'CLOSED') {
      completedAt = new Date().toISOString().split('T')[0];
      completedTime = new Date().toTimeString().slice(0, 5);
    } else {
      completedAt = undefined;
      completedTime = undefined;
    }

    onUpdateOrder({
      ...order,
      status: newStatus,
      completedAt,
      completedTime
    });
  };

  const toggleRework = () => {
    onUpdateOrder({
      ...order,
      rework: !order.rework,
      status: !order.rework ? 'REWORK' : order.status
    });
  };

  // Total logged hours on this O.S.
  const calculateTotalHours = () => {
    const total = order.executions.reduce((sum, exec) => sum + exec.totalHours, 0);
    const h = Math.floor(total);
    const m = Math.round((total - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}h`;
  };

  const calculateTimeDiff = (start?: string, end?: string): string => {
    if (!start || !end) return '';
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    
    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return '';
    
    let diffMin = (endH * 60 + endM) - (startH * 60 + startM);
    if (diffMin < 0) {
      diffMin += 24 * 60;
    }
    
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    return `${h}h${m > 0 ? ` ${m}m` : ''}`;
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

  const getDeadlineAnalysis = () => {
    if (!order.deliveryDeadline) return null;

    const deadline = new Date(order.deliveryDeadline + 'T00:00:00');
    
    if (order.status === 'CLOSED') {
      const actual = order.completedAt ? new Date(order.completedAt + 'T00:00:00') : new Date();
      const diffTime = actual.getTime() - deadline.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        return {
          status: 'DELAYED',
          label: `Concluído com Atraso (${diffDays} ${diffDays === 1 ? 'dia' : 'dias'})`,
          class: 'bg-rose-50 text-rose-700 border-rose-200'
        };
      } else {
        return {
          status: 'ON_TIME',
          label: 'Concluído no Prazo',
          class: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
      }
    } else {
      // Not closed yet, check if overdue relative to today
      const today = new Date();
      today.setHours(0,0,0,0);
      const diffTime = today.getTime() - deadline.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        return {
          status: 'OVERDUE',
          label: `Atrasado (${diffDays} ${diffDays === 1 ? 'dia' : 'dias'})`,
          class: 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold uppercase animate-pulse'
        };
      } else {
        const remainingDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return {
          status: 'PENDING',
          label: remainingDays === 0 ? 'Expira Hoje' : `No Prazo (${remainingDays} ${remainingDays === 1 ? 'dia restante' : 'dias restantes'})`,
          class: 'bg-blue-50 text-blue-700 border-blue-200'
        };
      }
    }
  };

  const handleSaveCompletionEdit = () => {
    onUpdateOrder({
      ...order,
      completedAt: editCompletedAt || undefined,
      completedTime: editCompletedTime || undefined
    });
    setIsEditingCompletion(false);
  };

  return (
    <div className="space-y-6" id="order-details-section">
      {/* Upper Navigation & Print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-600 hover:text-slate-900 transition w-fit cursor-pointer"
          id="btn-details-back"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para a Lista
        </button>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => onPrintOrder(order)}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer border border-slate-200 shadow-sm"
            id="btn-print-report"
          >
            <FileText className="h-3.5 w-3.5 text-slate-400" />
            Gerar Relatório Técnico
          </button>

          <button
            onClick={toggleRework}
            className={`flex items-center gap-2 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer border shadow-sm ${
              order.rework 
                ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-600' 
                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-100'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            {order.rework ? 'Sinalizado como Retrabalho' : 'Sinalizar Retrabalho'}
          </button>

          <button
            onClick={() => onDeleteOrder(order.id)}
            className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer shadow-sm"
            id="btn-delete-order"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
            Excluir O.S.
          </button>
        </div>
      </div>

      {/* Main O.S. Info Block */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl font-black text-slate-900">
                O.S. {order.code}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(order.status)}`}>
                {getStatusLabel(order.status)}
              </span>
              {order.rework && (
                <span className="bg-rose-500 text-white font-extrabold px-2 py-0.5 rounded text-[10px] uppercase flex items-center gap-0.5 animate-pulse">
                  <AlertTriangle className="h-2.5 w-2.5" /> Retrabalho
                </span>
              )}
            </div>
            <p className="text-xs md:text-sm text-slate-500 font-bold">
              Cliente: <span className="text-slate-800 font-extrabold">{order.client}</span>
            </p>
          </div>

          {/* Quick status controls */}
          <div className="flex flex-wrap gap-1.5 items-center bg-slate-50 p-1.5 rounded-xl border border-slate-200/50">
            <span className="text-[10px] uppercase text-slate-400 font-extrabold px-2">Alterar Status:</span>
            <button
              onClick={() => handleSetStatus('OPEN')}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${order.status === 'OPEN' ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-200/50 text-slate-600'}`}
            >
              Aberto
            </button>
            <button
              onClick={() => handleSetStatus('IN_PROGRESS')}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${order.status === 'IN_PROGRESS' ? 'bg-amber-500 text-white shadow-sm' : 'hover:bg-slate-200/50 text-slate-600'}`}
            >
              Andamento
            </button>
            <button
              onClick={() => handleSetStatus('CLOSED')}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${order.status === 'CLOSED' ? 'bg-emerald-600 text-white shadow-sm' : 'hover:bg-slate-200/50 text-slate-600'}`}
            >
              Concluído
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs md:text-sm">
          <div>
            <span className="block text-[11px] text-slate-400 uppercase tracking-wider font-extrabold mb-1.5">Data de Abertura</span>
            <div className="font-bold text-slate-800 flex items-center gap-1.5 text-sm md:text-base">
              <Calendar className="h-4.5 w-4.5 text-slate-400" />
              {order.date.split('-').reverse().join('/')}
            </div>
          </div>
          <div>
            <span className="block text-[11px] text-slate-400 uppercase tracking-wider font-extrabold mb-1.5">Hora de Abertura</span>
            <div className="font-bold text-slate-800 flex items-center gap-1.5 text-sm md:text-base">
              <Clock className="h-4.5 w-4.5 text-slate-400" />
              {order.startTime || 'Não definida'}
            </div>
          </div>
          <div>
            <span className="block text-[11px] text-slate-400 uppercase tracking-wider font-extrabold mb-1.5">Prazo de Entrega Estimado</span>
            <div className="font-bold text-slate-800 flex items-center gap-1.5 text-sm md:text-base">
              <Calendar className="h-4.5 w-4.5 text-slate-400" />
              {order.deliveryDeadline ? order.deliveryDeadline.split('-').reverse().join('/') : '-'}
            </div>
            {(() => {
              const analysis = getDeadlineAnalysis();
              if (analysis) {
                return (
                  <span className={`inline-block mt-1.5 px-2 py-0.5 text-[9px] font-bold rounded-md border ${analysis.class}`}>
                    {analysis.label}
                  </span>
                );
              }
              return null;
            })()}
          </div>
          <div>
            <span className="block text-[11px] text-slate-400 uppercase tracking-wider font-extrabold mb-1.5">Data e Horário da Entrega</span>
            <div className="font-bold text-slate-850">
              {!isEditingCompletion ? (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-sm md:text-base">
                    <Calendar className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                    <span className="font-extrabold text-emerald-750">
                      {order.completedAt ? order.completedAt.split('-').reverse().join('/') : 'Em aberto'}
                      {order.completedAt && order.completedTime ? ` às ${order.completedTime}` : ''}
                    </span>
                  </div>
                  {order.status === 'CLOSED' && (
                    <button
                      onClick={() => setIsEditingCompletion(true)}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline text-left cursor-pointer w-fit"
                    >
                      Alterar data/hora real
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-1 max-w-[180px]">
                  <div>
                    <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Data Real</label>
                    <input
                      type="date"
                      value={editCompletedAt}
                      onChange={(e) => setEditCompletedAt(e.target.value)}
                      className="bg-white border border-slate-200 rounded px-1.5 py-1 text-xs w-full font-semibold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Hora Real</label>
                    <input
                      type="time"
                      value={editCompletedTime}
                      onChange={(e) => setEditCompletedTime(e.target.value)}
                      className="bg-white border border-slate-200 rounded px-1.5 py-1 text-xs w-full font-semibold focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    <button
                      onClick={handleSaveCompletionEdit}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold px-2 py-1 rounded cursor-pointer transition"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => setIsEditingCompletion(false)}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[9px] font-bold px-2 py-1 rounded cursor-pointer transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <span className="block text-[11px] text-slate-400 uppercase tracking-wider font-extrabold mb-1.5">Atividade / Revisão</span>
            <div className="font-bold text-slate-850">
              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-150 text-xs">
                {getActivityCode(order.drawingNumber) ? `[${getActivityCode(order.drawingNumber)}] ` : ''}{order.drawingNumber || 'N/A'}
              </span>
              {order.revision && <span className="text-slate-500 ml-1.5 font-semibold">Rev: {order.revision}</span>}
            </div>
          </div>
          <div>
            <span className="block text-[11px] text-slate-400 uppercase tracking-wider font-extrabold mb-1.5">Quantidade Solicitada</span>
            <div className="font-extrabold text-slate-850 text-base font-mono">
              {order.quantity} pçs
            </div>
          </div>
          <div>
            <span className="block text-[11px] text-slate-400 uppercase tracking-wider font-extrabold mb-1.5">Responsável</span>
            <div className="font-bold text-slate-850">
              {order.inspector || 'Não definido'}
            </div>
          </div>
          <div>
            <span className="block text-[11px] text-slate-400 uppercase tracking-wider font-extrabold mb-1.5">Total de Horas Logadas</span>
            <div className="font-bold text-slate-850 font-mono text-base flex items-center gap-1.5 text-blue-600">
              <Clock className="h-4.5 w-4.5 text-blue-500" />
              {calculateTotalHours()}
            </div>
          </div>
        </div>

        {/* Detailed description */}
        <div className="border-t border-slate-100 pt-5 space-y-2">
          <span className="block text-[11px] text-slate-400 uppercase tracking-wider font-extrabold">Descrição de Detalhes Técnicos</span>
          <p className="text-slate-700 text-xs md:text-sm leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-150 font-semibold">
            {order.details || 'Sem especificações adicionais.'}
          </p>
        </div>
      </div>

      {/* Two Columns Grid: Checklist on left, Time Logs on right */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Subservice checklist */}
        {order.subServices && order.subServices.length > 0 && (
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-slate-500" />
                Lista de Atividades / Sub-serviços
              </h3>
              <p className="text-xs text-slate-400 mt-1">Marque cada etapa realizada para atualizar o progresso</p>
            </div>

            <div className="space-y-2.5 pt-2">
              {order.subServices.map(sub => (
                <div 
                  key={sub.id} 
                  onClick={() => handleToggleSubService(sub.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition duration-150 cursor-pointer select-none ${
                    sub.executed 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                      : 'bg-slate-50/50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all border ${
                    sub.executed 
                      ? 'bg-emerald-500 border-emerald-500 text-white' 
                      : 'border-slate-300 bg-white'
                  }`}>
                    {sub.executed && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </div>
                  <span className={`text-xs md:text-sm font-semibold flex-1 ${sub.executed ? 'line-through opacity-70' : 'text-slate-750'}`}>
                    {sub.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Right Column: Execution/Time log history */}
        <div className={`${order.subServices && order.subServices.length > 0 ? 'lg:col-span-3' : 'lg:col-span-5'} bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-slate-500" />
                Histórico de Execuções e Horas
              </h3>
              <p className="text-xs text-slate-400 mt-1">Apontamentos efetuados pelos operadores</p>
            </div>
            
            <button
              onClick={() => setShowLogForm(!showLogForm)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition duration-150 cursor-pointer shadow-md shadow-blue-500/10"
            >
              <Plus className="h-3.5 w-3.5" /> Apontar Horas
            </button>
          </div>

          {/* Inline Appoint Hours Form */}
          {showLogForm && (
            <form onSubmit={handleAddLog} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Operator select */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Operador / Técnico</label>
                  <select
                    value={selectedOperator}
                    onChange={(e) => setSelectedOperator(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  >
                    {(operators && operators.length > 0 ? operators : INITIAL_OPERATORS).map(op => (
                      <option key={op.id} value={op.name}>
                        {op.name} ({op.role}){op.active ? '' : ' - Inativo'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section Select */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Seção / Oficina</label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  >
                    {INITIAL_SECTIONS.map(sec => (
                      <option key={sec.id} value={sec.name}>{sec.name}</option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Data</label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                </div>

                {/* Start & End Hour */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Início</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Fim</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Concluded toggler */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="concluded"
                  checked={concluded}
                  onChange={(e) => setConcluded(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                />
                <label htmlFor="concluded" className="text-xs text-slate-700 font-bold cursor-pointer">
                  Etapa concluída pelo operador?
                </label>
              </div>

              {/* Form buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLogForm(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer"
                >
                  Salvar Apontamento
                </button>
              </div>
            </form>
          )}

          {/* Execution list Table */}
          {order.executions.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400">
              <Play className="h-6 w-6 mx-auto mb-2 opacity-50 text-slate-400" />
              <p className="text-xs font-semibold">Nenhum histórico de execução para esta O.S. ainda.</p>
              <button
                onClick={() => setShowLogForm(true)}
                className="mt-2 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Clique aqui para registrar as primeiras horas
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-3">Período</th>
                    <th className="py-3 px-3 text-right text-slate-500">Horas</th>
                    <th className="py-3 px-3">Seção / Operador</th>
                    <th className="py-3 px-3 text-center">Fim</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {order.executions
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map(exec => {
                      // Formatting hours nicely
                      const h = Math.floor(exec.totalHours);
                      const m = Math.round((exec.totalHours - h) * 60);
                      const displayHrs = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}h`;

                      return (
                        <tr key={exec.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-bold font-mono">
                            {exec.date.split('-').reverse().join('/')}
                          </td>
                          <td className="py-3 px-3 font-semibold font-mono text-slate-500">
                            {exec.startTime} - {exec.endTime}
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold font-mono text-slate-900 text-xs">
                            {displayHrs}
                          </td>
                          <td className="py-3 px-3 space-y-0.5">
                            <div className="font-extrabold text-[9px] uppercase text-slate-400 tracking-wider">
                              {exec.section}
                            </div>
                            <div className="font-bold text-slate-800">
                              {exec.operator}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {exec.concluded ? (
                              <span className="inline-flex px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] rounded font-bold">Sim</span>
                            ) : (
                              <span className="inline-flex px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded font-semibold">Não</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleRemoveLog(exec.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              title="Excluir apontamento"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
