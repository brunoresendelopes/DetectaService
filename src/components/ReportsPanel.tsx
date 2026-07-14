import React, { useState, useMemo } from 'react';
import { ServiceOrder, Operator } from '../types';
import { 
  Calendar, 
  Users, 
  Wrench, 
  FileText, 
  Filter, 
  Search, 
  Printer, 
  Clock, 
  Layers, 
  ChevronDown, 
  TrendingUp, 
  AlertTriangle,
  X,
  FileBarChart2,
  SlidersHorizontal,
  ChevronRight,
  ClipboardList
} from 'lucide-react';

interface ReportsPanelProps {
  orders: ServiceOrder[];
  operators: Operator[];
}

export default function ReportsPanel({ orders, operators }: ReportsPanelProps) {
  // Filter States
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedOperator, setSelectedOperator] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [activitySearch, setActivitySearch] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  
  // Tab states
  const [activeReportTab, setActiveReportTab] = useState<'executions' | 'employees' | 'activities'>('executions');
  
  // Printable report state
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Helper: Get unique clients for filter
  const clients = useMemo(() => {
    const set = new Set<string>();
    orders.forEach(o => {
      if (o.client) set.add(o.client);
    });
    return Array.from(set).sort();
  }, [orders]);

  // Helper: Get unique sections
  const sections = useMemo(() => {
    const set = new Set<string>();
    orders.forEach(o => {
      o.executions.forEach(e => {
        if (e.section) set.add(e.section);
      });
    });
    return Array.from(set).sort();
  }, [orders]);

  // Helper: Reset Filters
  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedOperator('ALL');
    setSelectedSection('ALL');
    setActivitySearch('');
    setSelectedClient('ALL');
    setSelectedStatus('ALL');
  };

  // Preset periods
  const handleSetPresetPeriod = (preset: 'today' | 'week' | 'month' | 'all') => {
    const today = new Date();
    const formatDateStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'today') {
      const dateStr = formatDateStr(today);
      setStartDate(dateStr);
      setEndDate(dateStr);
    } else if (preset === 'week') {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      setStartDate(formatDateStr(past));
      setEndDate(formatDateStr(today));
    } else if (preset === 'month') {
      const past = new Date();
      past.setDate(today.getDate() - 30);
      setStartDate(formatDateStr(past));
      setEndDate(formatDateStr(today));
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  // --- FILTER CORE LOGIC ---
  const filteredData = useMemo(() => {
    let matchedExecutions: Array<{
      exec: any;
      orderCode: string;
      client: string;
      orderId: string;
      orderStatus: string;
      orderRework: boolean;
    }> = [];

    // Step 1: Collect executions and match with parent order info
    orders.forEach(order => {
      // Filter parent order constraints first
      const matchesClient = selectedClient === 'ALL' || order.client === selectedClient;
      const matchesStatus = selectedStatus === 'ALL' || order.status === selectedStatus;
      
      if (!matchesClient || !matchesStatus) return;

      order.executions.forEach(exec => {
        // Date checks
        if (startDate && exec.date < startDate) return;
        if (endDate && exec.date > endDate) return;

        // Operator checks
        if (selectedOperator !== 'ALL' && exec.operator.toUpperCase() !== selectedOperator.toUpperCase()) return;

        // Section checks
        if (selectedSection !== 'ALL' && exec.section.toUpperCase() !== selectedSection.toUpperCase()) return;

        // Activity search matches subServices descriptions, details, or section name
        if (activitySearch.trim()) {
          const query = activitySearch.toLowerCase();
          const matchesSubservices = order.subServices?.some(sub => sub.description.toLowerCase().includes(query));
          const matchesDetails = order.details.toLowerCase().includes(query);
          const matchesSection = exec.section.toLowerCase().includes(query);
          const matchesOperator = exec.operator.toLowerCase().includes(query);
          
          if (!matchesSubservices && !matchesDetails && !matchesSection && !matchesOperator) return;
        }

        matchedExecutions.push({
          exec,
          orderCode: order.code,
          client: order.client,
          orderId: order.id,
          orderStatus: order.status,
          orderRework: order.rework
        });
      });
    });

    // Step 2: Sort executions by date desc (most recent first)
    matchedExecutions.sort((a, b) => b.exec.date.localeCompare(a.exec.date));

    // Step 3: Summarize metrics
    const totalHours = matchedExecutions.reduce((sum, item) => sum + item.exec.totalHours, 0);
    const uniqueOrders = new Set(matchedExecutions.map(item => item.orderId));
    const uniqueOperators = new Set(matchedExecutions.map(item => item.exec.operator));
    
    // Group by operator
    const operatorSummary: { [key: string]: { hours: number; count: number; sections: Set<string> } } = {};
    matchedExecutions.forEach(item => {
      const op = item.exec.operator.toUpperCase();
      if (!operatorSummary[op]) {
        operatorSummary[op] = { hours: 0, count: 0, sections: new Set() };
      }
      operatorSummary[op].hours += item.exec.totalHours;
      operatorSummary[op].count += 1;
      operatorSummary[op].sections.add(item.exec.section);
    });

    // Group by activity section / description
    const sectionSummary: { [key: string]: { hours: number; operators: Set<string>; count: number } } = {};
    matchedExecutions.forEach(item => {
      const sec = item.exec.section.toUpperCase();
      if (!sectionSummary[sec]) {
        sectionSummary[sec] = { hours: 0, operators: new Set(), count: 0 };
      }
      sectionSummary[sec].hours += item.exec.totalHours;
      sectionSummary[sec].operators.add(item.exec.operator);
      sectionSummary[sec].count += 1;
    });

    return {
      executions: matchedExecutions,
      totalHours,
      affectedOrdersCount: uniqueOrders.size,
      affectedOperatorsCount: uniqueOperators.size,
      operatorSummary,
      sectionSummary
    };
  }, [orders, startDate, endDate, selectedOperator, selectedSection, activitySearch, selectedClient, selectedStatus]);

  // Format decimal hours as HH:MM
  const formatHours = (hoursDecimal: number) => {
    const h = Math.floor(hoursDecimal);
    const m = Math.round((hoursDecimal - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}h`;
  };

  const handlePrintAction = () => {
    setShowPrintModal(true);
    setTimeout(() => {
      window.print();
    }, 400);
  };

  return (
    <div className="space-y-6" id="reports-panel">
      
      {/* Filters Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4.5 w-4.5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Filtros de Relatório Técnico</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearFilters}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition py-1.5 px-3 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              Limpar Filtros
            </button>
            <button
              onClick={handlePrintAction}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-xl text-xs transition cursor-pointer shadow-sm"
            >
              <Printer className="h-3.5 w-3.5" />
              Emitir Relatório
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Period presets and Date range */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-xs font-bold text-slate-500">Período de Apontamento</label>
            <div className="flex flex-wrap gap-1 mb-2">
              <button 
                type="button" 
                onClick={() => handleSetPresetPeriod('today')}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded font-bold transition cursor-pointer"
              >
                Hoje
              </button>
              <button 
                type="button" 
                onClick={() => handleSetPresetPeriod('week')}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded font-bold transition cursor-pointer"
              >
                Últimos 7 dias
              </button>
              <button 
                type="button" 
                onClick={() => handleSetPresetPeriod('month')}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded font-bold transition cursor-pointer"
              >
                Últimos 30 dias
              </button>
              <button 
                type="button" 
                onClick={() => handleSetPresetPeriod('all')}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded font-bold transition cursor-pointer"
              >
                Sempre
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Calendar className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Calendar className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* Collaborator (Operator) Filter */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500">Colaborador / Operador</label>
            <div className="relative">
              <select
                value={selectedOperator}
                onChange={(e) => setSelectedOperator(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl py-2 px-3.5 pr-10 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800 cursor-pointer"
              >
                <option value="ALL">TODOS OS COLABORADORES</option>
                {operators.map(op => (
                  <option key={op.id} value={op.name}>{op.name.toUpperCase()} ({op.role})</option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <ChevronDown className="h-4 w-4" />
              </span>
            </div>
          </div>

          {/* Section / Seção filter */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500">Seção / Oficina</label>
            <div className="relative">
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl py-2 px-3.5 pr-10 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800 cursor-pointer"
              >
                <option value="ALL">TODAS AS SEÇÕES</option>
                {sections.map(sec => (
                  <option key={sec} value={sec}>{sec.toUpperCase()}</option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <ChevronDown className="h-4 w-4" />
              </span>
            </div>
          </div>

          {/* Activity Text Filter */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500">Pesquisar Atividade / Detalhe</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ex: solda, usinagem..."
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Search className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>

          {/* Client filter */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500">Cliente</label>
            <div className="relative">
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl py-2 px-3.5 pr-10 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800 cursor-pointer"
              >
                <option value="ALL">TODOS OS CLIENTES</option>
                {clients.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <ChevronDown className="h-4 w-4" />
              </span>
            </div>
          </div>

          {/* Status filter */}
          <div className="space-y-2 col-span-2">
            <label className="block text-xs font-bold text-slate-500">Status da Ordem de Serviço</label>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl py-2 px-3.5 pr-10 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800 cursor-pointer"
              >
                <option value="ALL">TODOS OS STATUS</option>
                <option value="OPEN">ABERTA</option>
                <option value="IN_PROGRESS">EM ANDAMENTO</option>
                <option value="CLOSED">CONCLUÍDA</option>
                <option value="REWORK">RETRABALHO</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <ChevronDown className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total hours */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Total Horas</span>
            <span className="text-xl md:text-2xl font-black text-slate-900 font-mono tracking-tight">
              {formatHours(filteredData.totalHours)}
            </span>
          </div>
        </div>

        {/* Unique orders */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">O.S. Atendidas</span>
            <span className="text-xl md:text-2xl font-black text-slate-900 font-mono tracking-tight">
              {filteredData.affectedOrdersCount}
            </span>
          </div>
        </div>

        {/* Unique Operators */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Colaboradores</span>
            <span className="text-xl md:text-2xl font-black text-slate-900 font-mono tracking-tight">
              {filteredData.affectedOperatorsCount}
            </span>
          </div>
        </div>

        {/* Rework Indicator */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Apontamentos</span>
            <span className="text-xl md:text-2xl font-black text-slate-900 font-mono tracking-tight">
              {filteredData.executions.length}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button
            onClick={() => setActiveReportTab('executions')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeReportTab === 'executions'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Apontamentos Filtrados ({filteredData.executions.length})
          </button>
          
          <button
            onClick={() => setActiveReportTab('employees')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeReportTab === 'employees'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Total por Funcionário ({Object.keys(filteredData.operatorSummary).length})
          </button>

          <button
            onClick={() => setActiveReportTab('activities')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeReportTab === 'activities'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Total por Atividade ({Object.keys(filteredData.sectionSummary).length})
          </button>
        </div>

        {/* Tab 1: Execution logs List */}
        {activeReportTab === 'executions' && (
          <div className="overflow-x-auto">
            {filteredData.executions.length === 0 ? (
              <div className="p-12 text-center">
                <FileBarChart2 className="h-10 w-10 text-slate-300 mx-auto mb-2.5" />
                <p className="text-xs font-bold text-slate-500">Nenhum apontamento corresponde aos filtros definidos.</p>
                <p className="text-[11px] text-slate-400 mt-1">Ajuste as datas, limpe a pesquisa ou mude o colaborador.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 tracking-wider font-mono">
                    <th className="py-3 px-5">DATA</th>
                    <th className="py-3 px-4">O.S. CODE</th>
                    <th className="py-3 px-4">CLIENTE</th>
                    <th className="py-3 px-4">COLABORADOR</th>
                    <th className="py-3 px-4">SEÇÃO</th>
                    <th className="py-3 px-4">HORÁRIO</th>
                    <th className="py-3 px-4 text-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                  {filteredData.executions.map((item, index) => {
                    const formattedDate = new Date(item.exec.date + 'T12:00:00')
                      .toLocaleDateString('pt-BR');
                    return (
                      <tr key={item.exec.id + index} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-5 text-slate-500 font-mono text-[11px]">{formattedDate}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600">#{item.orderCode}</td>
                        <td className="py-3.5 px-4 text-slate-800 text-[11px]">{item.client}</td>
                        <td className="py-3.5 px-4 text-slate-900 font-bold uppercase">{item.exec.operator}</td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-mono">
                            {item.exec.section}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                          {item.exec.startTime}h - {item.exec.endTime}h
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-950 font-mono">
                          {formatHours(item.exec.totalHours)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Summaries by employee */}
        {activeReportTab === 'employees' && (
          <div className="p-6">
            {Object.keys(filteredData.operatorSummary).length === 0 ? (
              <div className="text-center p-6 text-slate-400 italic text-xs">
                Nenhum operador com registros no período.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(filteredData.operatorSummary).map(([name, data]) => {
                  const dataTyped = data as { hours: number; count: number; sections: Set<string> };
                  return (
                    <div key={name} className="bg-slate-50 rounded-xl p-4 border border-slate-150/50 hover:border-slate-300 transition">
                      <div className="flex justify-between items-start mb-2.5">
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-950 uppercase">{name}</h4>
                          <span className="text-[10px] text-slate-400 font-bold font-mono">
                            {dataTyped.count} apontamento(s)
                          </span>
                        </div>
                        <span className="text-sm font-black font-mono text-blue-600 bg-blue-50/50 px-2.5 py-1 rounded-lg border border-blue-100/50">
                          {formatHours(dataTyped.hours)}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {Array.from(dataTyped.sections).map(sec => (
                          <span key={sec} className="text-[9px] font-black bg-white text-slate-600 border border-slate-200/50 px-2 py-0.5 rounded uppercase">
                            {sec}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Summaries by activity/section */}
        {activeReportTab === 'activities' && (
          <div className="p-6">
            {Object.keys(filteredData.sectionSummary).length === 0 ? (
              <div className="text-center p-6 text-slate-400 italic text-xs">
                Sem dados de atividade no período.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(filteredData.sectionSummary).map(([section, data]) => {
                  const dataTyped = data as { hours: number; operators: Set<string>; count: number };
                  return (
                    <div key={section} className="bg-slate-50 rounded-xl p-4 border border-slate-150/50 hover:border-slate-300 transition">
                      <div className="flex justify-between items-start mb-2.5">
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-950 uppercase">{section}</h4>
                          <span className="text-[10px] text-slate-400 font-bold font-mono">
                            {dataTyped.count} registro(s) de trabalho
                          </span>
                        </div>
                        <span className="text-sm font-black font-mono text-emerald-600 bg-emerald-50/50 px-2.5 py-1 rounded-lg border border-emerald-100/50">
                          {formatHours(dataTyped.hours)}
                        </span>
                      </div>
                      
                      <div className="mt-3.5 pt-2.5 border-t border-slate-200/40">
                        <span className="block text-[9px] font-black text-slate-400 mb-1.5 uppercase font-mono">Profissionais envolvidos</span>
                        <div className="flex flex-wrap gap-1.5">
                          {Array.from(dataTyped.operators).map(op => (
                            <span key={op} className="text-[9px] font-bold bg-white text-slate-700 px-2 py-1 rounded-md border border-slate-200 uppercase">
                              {op}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* PRINT MODAL (for high resolution preview and browser window.print hook) */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-8 shadow-2xl relative border border-slate-200 my-8">
            <button
              onClick={() => setShowPrintModal(false)}
              className="absolute right-6 top-6 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-3.5 mb-6 text-slate-500">
              <Printer className="h-5 w-5 text-blue-600" />
              <div>
                <span className="text-xs font-extrabold text-blue-600 uppercase tracking-widest font-mono">Impressora Pronta</span>
                <p className="text-xs font-semibold text-slate-400">Pressione Esc ou clique em Fechar quando terminar a emissão.</p>
              </div>
            </div>

            {/* Print Area Preview */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 max-h-[500px] overflow-y-auto shadow-inner">
              <p className="text-xs text-center text-slate-400 italic mb-4">Pré-visualização do Relatório Oficial</p>
              
              {/* Actual Printable Report Container */}
              <div className="bg-white p-8 rounded border border-slate-300 font-sans text-slate-900 shadow-md max-w-3xl mx-auto">
                {/* PDF/Print Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 mb-6">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-950 uppercase italic">
                      DETECTA <span className="text-blue-600">SERVICE</span>
                    </h2>
                    <span className="text-[9px] font-bold text-slate-400 tracking-widest font-mono">RELATÓRIO TÉCNICO DE APONTAMENTO DE HORAS</span>
                  </div>
                  <div className="text-right text-[10px] font-mono text-slate-500 space-y-1">
                    <p className="font-bold">Emissão: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</p>
                    <p className="text-[9px] text-slate-400 uppercase">DetectaService Controle Industrial v1.0</p>
                  </div>
                </div>

                {/* Filter Descriptions */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6 text-xs leading-relaxed">
                  <h4 className="font-extrabold text-slate-950 mb-1.5 uppercase font-mono text-[10px] tracking-wider text-slate-500">Parâmetros do Filtro Utilizado</h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 font-semibold text-slate-700">
                    <p>📅 <span className="text-slate-400 font-bold">Período:</span> {startDate ? new Date(startDate+'T12:00:00').toLocaleDateString('pt-BR') : 'Início'} até {endDate ? new Date(endDate+'T12:00:00').toLocaleDateString('pt-BR') : 'Fim'}</p>
                    <p>👤 <span className="text-slate-400 font-bold">Colaborador:</span> {selectedOperator === 'ALL' ? 'Todos os Colaboradores' : selectedOperator.toUpperCase()}</p>
                    <p>🏢 <span className="text-slate-400 font-bold">Seção:</span> {selectedSection === 'ALL' ? 'Todas as Seções' : selectedSection.toUpperCase()}</p>
                    <p>🤝 <span className="text-slate-400 font-bold">Cliente:</span> {selectedClient === 'ALL' ? 'Todos os Clientes' : selectedClient}</p>
                    {activitySearch && <p className="col-span-2">🔍 <span className="text-slate-400 font-bold">Pesquisa de Atividade:</span> "{activitySearch}"</p>}
                  </div>
                </div>

                {/* Quick Indicators inside Printable */}
                <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="block text-[8px] font-black text-slate-400 uppercase font-mono">Horas Totais</span>
                    <span className="text-base font-black text-slate-950 font-mono">{formatHours(filteredData.totalHours)}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="block text-[8px] font-black text-slate-400 uppercase font-mono">Qtde. O.S.</span>
                    <span className="text-base font-black text-slate-950 font-mono">{filteredData.affectedOrdersCount}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="block text-[8px] font-black text-slate-400 uppercase font-mono">Qtde Apontamentos</span>
                    <span className="text-base font-black text-slate-950 font-mono">{filteredData.executions.length}</span>
                  </div>
                </div>

                {/* Main Table for print */}
                <div className="mb-8">
                  <table className="w-full text-left border-collapse text-[11px] leading-tight">
                    <thead>
                      <tr className="bg-slate-100 border-b-2 border-slate-400 text-[9px] font-bold text-slate-600 font-mono uppercase">
                        <th className="py-2 px-3">DATA</th>
                        <th className="py-2 px-2">O.S.</th>
                        <th className="py-2 px-2">CLIENTE</th>
                        <th className="py-2 px-2">SEÇÃO</th>
                        <th className="py-2 px-2">COLABORADOR</th>
                        <th className="py-2 px-2 text-right">TOTAL HORAS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium text-slate-850">
                      {filteredData.executions.map((item, index) => {
                        const formattedDate = new Date(item.exec.date + 'T12:00:00').toLocaleDateString('pt-BR');
                        return (
                          <tr key={item.exec.id + index}>
                            <td className="py-2 px-3 font-mono">{formattedDate}</td>
                            <td className="py-2 px-2 font-mono font-bold">#{item.orderCode}</td>
                            <td className="py-2 px-2 max-w-[120px] truncate">{item.client}</td>
                            <td className="py-2 px-2 font-mono text-[10px]">{item.exec.section}</td>
                            <td className="py-2 px-2 uppercase font-bold text-[10px]">{item.exec.operator}</td>
                            <td className="py-2 px-2 text-right font-mono font-bold">{formatHours(item.exec.totalHours)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Signed & Approved Section */}
                <div className="mt-16 grid grid-cols-2 gap-12 text-center text-xs pt-8 border-t border-slate-200">
                  <div className="space-y-1">
                    <div className="border-b border-slate-400 mx-auto w-48 h-8"></div>
                    <p className="font-bold text-slate-800">Assinatura do Responsável</p>
                    <p className="text-[10px] text-slate-400">Supervisor de Produção</p>
                  </div>
                  <div className="space-y-1">
                    <div className="border-b border-slate-400 mx-auto w-48 h-8"></div>
                    <p className="font-bold text-slate-800">Assinatura do Fiscal/Auditor</p>
                    <p className="text-[10px] text-slate-400">Controle de Qualidade</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Voltar ao Sistema
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-blue-500/10 flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                Imprimir Novamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STYLES EXCLUSIVELY FOR PRINT MODE */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #reports-panel {
            display: none !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          /* Only display the modal printable content */
          .fixed {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            z-index: 9999999 !important;
          }
          .fixed > div {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          .fixed .bg-slate-50 {
            background: white !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            max-height: none !important;
            overflow: visible !important;
          }
          .fixed .bg-slate-50 > p {
            display: none !important;
          }
          .fixed .bg-white {
            border: none !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .fixed button {
            display: none !important;
          }
          .fixed * {
            visibility: visible !important;
          }
        }
      `}</style>

    </div>
  );
}
