import React, { useState, useEffect, useRef } from 'react';
import { ServiceOrder, SubService, OrderStatus, Operator } from '../types';
import { 
  ArrowLeft, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  FileText, 
  AlertTriangle,
  Layers,
  Sparkles,
  ClipboardList,
  ChevronDown,
  Check,
  Search
} from 'lucide-react';

interface OrderFormProps {
  orderToEdit?: ServiceOrder | null;
  onSave: (order: ServiceOrder) => void;
  onCancel: () => void;
  existingCodes: string[];
  operators?: Operator[];
}

const TEMPLATES = [
  {
    name: 'Fabricação Padrão (Caldeiraria + Inspeção)',
    steps: [
      'Preparação e corte de material bruto',
      'Montagem preliminar e ponteamento',
      'Soldagem estrutural qualificada',
      'Usinagem/Ajuste de furos de montagem',
      'Inspeção dimensional de tolerâncias'
    ]
  },
  {
    name: 'Pintura Industrial (Jateamento + PU/Epóxi)',
    steps: [
      'Limpeza de contaminantes e graxas',
      'Jateamento abrasivo ao metal quase branco (Sa 2.5)',
      'Aplicação de primer anticorrosivo rico em zinco',
      'Aplicação de tinta PU/Epóxi de alta espessura',
      'Medição de espessura de película seca e aderência'
    ]
  },
  {
    name: 'Manutenção / Usinagem Corretiva',
    steps: [
      'Desmontagem e limpeza química inicial',
      'Diagnóstico de falhas e conferência de folgas',
      'Usinagem/Recuperação de eixos e sedes',
      'Substituição de vedações e rolamentos',
      'Montagem final e testes funcionais em bancada'
    ]
  }
];

export default function OrderForm({ 
  orderToEdit, 
  onSave, 
  onCancel,
  existingCodes,
  operators = []
}: OrderFormProps) {
  const isEditing = !!orderToEdit;

  // Form states
  const [code, setCode] = useState('');
  const [client, setClient] = useState('');
  const [date, setDate] = useState('');
  const [deliveryDeadline, setDeliveryDeadline] = useState('');
  const [drawingNumber, setDrawingNumber] = useState('');
  const [revision, setRevision] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [inspector, setInspector] = useState('');
  const [nfSerie, setNfSerie] = useState('');
  const [nfEntrada, setNfEntrada] = useState('');
  const [nfRetorno, setNfRetorno] = useState('');
  const [nfServico, setNfServico] = useState('');
  const [nfVenda, setNfVenda] = useState('');
  const [details, setDetails] = useState('');
  const [rework, setRework] = useState(false);
  const [status, setStatus] = useState<OrderStatus>('OPEN');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [completedAt, setCompletedAt] = useState('');
  const [completedTime, setCompletedTime] = useState('');

  // Subservices list state
  const [subServices, setSubServices] = useState<SubService[]>([]);
  const [newStepDescription, setNewStepDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);

  interface RegisteredActivity {
    code: string;
    name: string;
  }

  const [registeredActivities, setRegisteredActivities] = useState<RegisteredActivity[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isInspectorDropdownOpen, setIsInspectorDropdownOpen] = useState(false);
  const inspectorDropdownRef = useRef<HTMLDivElement>(null);

  // Load activities on mount
  useEffect(() => {
    const saved = localStorage.getItem('detecta_registered_activities');
    if (saved) {
      try {
        setRegisteredActivities(JSON.parse(saved));
      } catch (e) {
        const defaultList = [
          { code: 'AT-001', name: 'AMOSTRA' },
          { code: 'AT-002', name: 'VL-8820-M' },
          { code: 'AT-003', name: 'PET-TUB-44' },
          { code: 'AT-004', name: 'GD-SUP-012' }
        ];
        setRegisteredActivities(defaultList);
        localStorage.setItem('detecta_registered_activities', JSON.stringify(defaultList));
      }
    } else {
      const defaultList = [
        { code: 'AT-001', name: 'AMOSTRA' },
        { code: 'AT-002', name: 'VL-8820-M' },
        { code: 'AT-003', name: 'PET-TUB-44' },
        { code: 'AT-004', name: 'GD-SUP-012' }
      ];
      setRegisteredActivities(defaultList);
      localStorage.setItem('detecta_registered_activities', JSON.stringify(defaultList));
    }
  }, []);

  // Handle click outside dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (inspectorDropdownRef.current && !inspectorDropdownRef.current.contains(event.target as Node)) {
        setIsInspectorDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveRegisteredActivities = (list: RegisteredActivity[]) => {
    setRegisteredActivities(list);
    localStorage.setItem('detecta_registered_activities', JSON.stringify(list));
  };

  const handleRegisterActivity = (nameToRegister: string) => {
    const trimmedName = nameToRegister.trim().toUpperCase();
    if (!trimmedName) return null;
    
    // Check if it already exists
    const existing = registeredActivities.find(act => act.name.toUpperCase() === trimmedName);
    if (existing) return existing;

    // Generate new code
    const codes = registeredActivities
      .map(act => act.code)
      .map(c => parseInt(c.replace('AT-', ''), 10))
      .filter(n => !isNaN(n));
    const nextNum = codes.length > 0 ? Math.max(...codes) + 1 : 1;
    const newCode = `AT-${nextNum.toString().padStart(3, '0')}`;

    const newActivity = { code: newCode, name: trimmedName };
    const updatedList = [...registeredActivities, newActivity];
    saveRegisteredActivities(updatedList);
    return newActivity;
  };

  const handleDeleteActivity = (codeToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering selection
    if (deletingCode === codeToDelete) {
      const updatedList = registeredActivities.filter(act => act.code !== codeToDelete);
      saveRegisteredActivities(updatedList);
      setDeletingCode(null);
    } else {
      setDeletingCode(codeToDelete);
    }
  };

  // Generate a random or next sequential code on mount for new orders
  useEffect(() => {
    if (isEditing && orderToEdit) {
      setCode(orderToEdit.code);
      setClient(orderToEdit.client);
      setDate(orderToEdit.date);
      setDeliveryDeadline(orderToEdit.deliveryDeadline || '');
      setDrawingNumber(orderToEdit.drawingNumber || '');
      setRevision(orderToEdit.revision || '');
      setQuantity(orderToEdit.quantity);
      setInspector(orderToEdit.inspector || '');
      setNfSerie(orderToEdit.nfSerie || '');
      setNfEntrada(orderToEdit.nfEntrada || '');
      setNfRetorno(orderToEdit.nfRetorno || '');
      setNfServico(orderToEdit.nfServico || '');
      setNfVenda(orderToEdit.nfVenda || '');
      setDetails(orderToEdit.details);
      setRework(orderToEdit.rework);
      setStatus(orderToEdit.status);
      setSubServices(orderToEdit.subServices);
      setStartTime(orderToEdit.startTime || '');
      setEndTime(orderToEdit.endTime || '');
      setCompletedAt(orderToEdit.completedAt || '');
      setCompletedTime(orderToEdit.completedTime || '');
    } else {
      // Find highest code and increment, or default
      const codesAsInt = existingCodes
        .map(c => parseInt(c, 10))
        .filter(n => !isNaN(n));
      const nextNum = codesAsInt.length > 0 ? Math.max(...codesAsInt) + 1 : 2966;
      setCode(nextNum.toString().padStart(7, '0'));
      
      setDate(new Date().toISOString().split('T')[0]);
      // Default delivery 10 days from now
      const defaultDeadline = new Date();
      defaultDeadline.setDate(defaultDeadline.getDate() + 14);
      setDeliveryDeadline(defaultDeadline.toISOString().split('T')[0]);
      
      setClient('');
      setDrawingNumber('');
      setRevision('');
      setQuantity(1);
      setInspector('');
      setNfSerie('');
      setNfEntrada('');
      setNfRetorno('');
      setNfServico('');
      setNfVenda('');
      setDetails('');
      setRework(false);
      setStatus('OPEN');
      setSubServices([]);
      setStartTime(new Date().toTimeString().slice(0, 5));
      setEndTime('');
      setCompletedAt('');
      setCompletedTime('');
    }
  }, [isEditing, orderToEdit, existingCodes]);

  const handleAddStep = () => {
    if (!newStepDescription.trim()) return;
    const newStep: SubService = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      description: newStepDescription.trim().toUpperCase(),
      executed: false
    };
    setSubServices([...subServices, newStep]);
    setNewStepDescription('');
  };

  const handleRemoveStep = (id: string) => {
    setSubServices(subServices.filter(s => s.id !== id));
  };

  const handleLoadTemplate = (templateIndex: number) => {
    const template = TEMPLATES[templateIndex];
    const newSteps: SubService[] = template.steps.map((step, idx) => ({
      id: `sub-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      description: step.toUpperCase(),
      executed: false
    }));
    setSubServices([...subServices, ...newSteps]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setFormError(null);

    if (!code.trim() || !client.trim() || !drawingNumber.trim()) {
      setFormError('Código de O.S., Cliente e Atividade são campos obrigatórios.');
      return;
    }

    // Validation: Check if code already exists and we are NOT editing
    if (!isEditing && existingCodes.includes(code.trim())) {
      setFormError(`O código de O.S. "${code}" já existe no sistema. Por favor insira outro código.`);
      return;
    }

    const finalDrawingNumber = drawingNumber.trim().toUpperCase();
    if (finalDrawingNumber) {
      const existing = registeredActivities.find(act => act.name.toUpperCase() === finalDrawingNumber);
      if (!existing) {
        handleRegisterActivity(finalDrawingNumber);
      }
    }

    const savedOrder: ServiceOrder = {
      id: isEditing && orderToEdit ? orderToEdit.id : `os-${Date.now()}`,
      code: code.trim(),
      client: client.trim().toUpperCase(),
      date,
      deliveryDeadline: deliveryDeadline || undefined,
      drawingNumber: finalDrawingNumber || undefined,
      revision: revision.trim().toUpperCase() || undefined,
      quantity: Number(quantity) || 1,
      inspector: inspector.trim() || undefined,
      nfSerie: nfSerie.trim() || undefined,
      nfEntrada: nfEntrada.trim() || undefined,
      nfRetorno: nfRetorno.trim() || undefined,
      nfServico: nfServico.trim() || undefined,
      nfVenda: nfVenda.trim() || undefined,
      details: details.trim(),
      rework,
      status,
      subServices,
      executions: isEditing && orderToEdit ? orderToEdit.executions : [],
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      completedAt: status === 'CLOSED' ? (completedAt || new Date().toISOString().split('T')[0]) : undefined,
      completedTime: status === 'CLOSED' ? (completedTime || new Date().toTimeString().slice(0, 5)) : undefined
    };

    onSave(savedOrder);
  };

  return (
    <div className="space-y-6" id="order-form-container">
      {/* Header / Nav */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <button
            onClick={onCancel}
            className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer mb-2"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
          <h1 className="text-xl md:text-2xl font-sans font-bold text-slate-900">
            {isEditing ? `Editar Ordem de Serviço #${orderToEdit?.code}` : 'Criar Nova Ordem de Serviço'}
          </h1>
          <p className="text-xs md:text-sm text-slate-500">
            {isEditing ? 'Atualize as informações cadastrais da O.S.' : 'Insira os dados iniciais para abertura em campo.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        {formError && (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl text-xs font-semibold text-rose-700 flex items-start gap-2.5 animate-fadeIn">
            <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Atenção!</p>
              <p className="mt-0.5">{formError}</p>
            </div>
          </div>
        )}

        <div className="space-y-5">
          <h2 className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2 border-b border-slate-100 pb-3">
            <ClipboardList className="h-4.5 w-4.5 text-slate-400" />
            Cadastro de Dados Gerais
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs md:text-sm">
            {/* O.S. Code */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Código de O.S. <span className="text-rose-500">*</span></label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isEditing}
                className="w-full bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed border border-slate-200 rounded-xl py-2 px-3 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-950 text-sm"
                required
              />
            </div>

            {/* Client */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Cliente <span className="text-rose-500">*</span></label>
              <input
                type="text"
                placeholder="Ex: DETECTA"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 font-bold focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-950 text-sm"
                required
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Data de Abertura <span className="text-rose-500">*</span></label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-950 text-sm font-bold"
                required
              />
            </div>

            {/* Opening Time of Service */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Hora da Abertura do Serviço <span className="text-rose-500">*</span></label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-950 text-sm font-bold"
                required
              />
            </div>

            {/* Delivery Deadline */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Prazo de Entrega Estimado</label>
              <input
                type="date"
                value={deliveryDeadline}
                onChange={(e) => setDeliveryDeadline(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-950 text-sm font-bold"
              />
            </div>

            {/* Drawing Number (Atividade Combobox) */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                <span>Atividade <span className="text-rose-500">*</span></span>
                <span className="text-[10px] text-slate-400 font-medium">Lista suspensa inteligente</span>
              </label>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Selecione ou digite uma nova atividade"
                  value={drawingNumber}
                  onChange={(e) => {
                    setDrawingNumber(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-950 text-sm font-semibold"
                  required
                />
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {/* Dropdown panel */}
              {isDropdownOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {/* Option to create a new activity if text is typed and not fully matched */}
                  {drawingNumber.trim() && !registeredActivities.some(act => act.name.toUpperCase() === drawingNumber.trim().toUpperCase()) && (
                    <div 
                      onClick={() => {
                        const newAct = handleRegisterActivity(drawingNumber);
                        if (newAct) {
                          setDrawingNumber(newAct.name);
                        }
                        setIsDropdownOpen(false);
                      }}
                      className="p-3 text-xs font-bold text-blue-600 hover:bg-blue-50 cursor-pointer flex items-center justify-between transition"
                    >
                      <span>+ Cadastrar "{drawingNumber.toUpperCase()}" como Nova Atividade</span>
                      <span className="bg-blue-100 text-blue-800 text-[9px] px-1.5 py-0.5 rounded font-mono uppercase">Gerar Código</span>
                    </div>
                  )}

                  {/* Registered Activities List */}
                  {registeredActivities.filter(act => 
                    act.name.toLowerCase().includes(drawingNumber.toLowerCase()) ||
                    act.code.toLowerCase().includes(drawingNumber.toLowerCase())
                  ).length > 0 ? (
                    registeredActivities
                      .filter(act => 
                        act.name.toLowerCase().includes(drawingNumber.toLowerCase()) ||
                        act.code.toLowerCase().includes(drawingNumber.toLowerCase())
                      )
                      .map(act => (
                        <div
                          key={act.code}
                          onClick={() => {
                            setDrawingNumber(act.name);
                            setIsDropdownOpen(false);
                          }}
                          className="flex items-center justify-between p-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition"
                        >
                          <div className="flex items-center gap-2">
                            <span className="bg-slate-100 border border-slate-200 text-slate-600 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded">
                              {act.code}
                            </span>
                            <span className="text-slate-900 uppercase font-bold">{act.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {drawingNumber.trim().toUpperCase() === act.name.toUpperCase() && (
                              <Check className="h-3.5 w-3.5 text-emerald-500 mr-2" />
                            )}
                            {deletingCode === act.code ? (
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] text-rose-500 font-bold mr-1">Excluir?</span>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteActivity(act.code, e)}
                                  className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-[9px] px-2 py-0.5 rounded transition"
                                >
                                  Sim
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingCode(null);
                                  }}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[9px] px-2 py-0.5 rounded transition"
                                >
                                  Não
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                title="Remover do cadastro"
                                onClick={(e) => handleDeleteActivity(act.code, e)}
                                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="p-4 text-xs text-slate-400 text-center italic">
                      Nenhuma atividade cadastrada. Digite o nome acima para criar.
                    </div>
                  )}
                </div>
              )}
            </div>



            {/* Revision & Quantity */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Revisão</label>
                <input
                  type="text"
                  placeholder="Ex: A"
                  value={revision}
                  onChange={(e) => setRevision(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-center font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-950 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Quantidade <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-center font-bold focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-950 text-sm"
                  required
                />
              </div>
            </div>

            {/* Inspector */}
            <div className="relative" ref={inspectorDropdownRef}>
              <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                <span>Responsável</span>
                <span className="text-[10px] text-slate-400 font-medium font-semibold">Lista de colaboradores</span>
              </label>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Selecione ou digite o responsável"
                  value={inspector}
                  onChange={(e) => {
                    setInspector(e.target.value);
                    setIsInspectorDropdownOpen(true);
                  }}
                  onFocus={() => setIsInspectorDropdownOpen(true)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-950 text-sm font-semibold uppercase"
                />
                <button
                  type="button"
                  onClick={() => setIsInspectorDropdownOpen(!isInspectorDropdownOpen)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {/* Dropdown panel */}
              {isInspectorDropdownOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {/* Option to use custom typed text if it's not empty */}
                  {inspector.trim() && !operators.some(op => op.name.toUpperCase() === inspector.trim().toUpperCase()) && (
                    <div 
                      onClick={() => setIsInspectorDropdownOpen(false)}
                      className="p-2.5 text-xs font-bold text-blue-600 hover:bg-blue-50 cursor-pointer transition flex items-center justify-between"
                    >
                      <span>Usar nome digitado: "{inspector.toUpperCase()}"</span>
                      <span className="bg-blue-100 text-blue-800 text-[9px] px-1.5 py-0.5 rounded font-mono uppercase">Avulso</span>
                    </div>
                  )}

                  {/* Registered Collaborators List */}
                  {(() => {
                    const filteredOps = operators.filter(op => 
                      op.active && (
                        op.name.toLowerCase().includes(inspector.toLowerCase()) ||
                        op.role.toLowerCase().includes(inspector.toLowerCase())
                      )
                    );

                    if (filteredOps.length > 0) {
                      return filteredOps.map(op => (
                        <div
                          key={op.id}
                          onClick={() => {
                            setInspector(op.name.toUpperCase());
                            setIsInspectorDropdownOpen(false);
                          }}
                          className="flex items-center justify-between p-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition"
                        >
                          <div className="flex flex-col text-left">
                            <span className="text-slate-900 font-bold uppercase">{op.name}</span>
                            <span className="text-slate-400 text-[10px] font-medium">{op.role}</span>
                          </div>
                          {inspector.trim().toUpperCase() === op.name.toUpperCase() && (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          )}
                        </div>
                      ));
                    } else {
                      return (
                        <div className="p-4 text-xs text-slate-400 text-center italic">
                          {operators.length > 0 
                            ? 'Nenhum colaborador correspondente ativo.' 
                            : 'Nenhum colaborador cadastrado.'}
                        </div>
                      );
                    }
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Dados de Nota Fiscal (Opcional) */}
          <div className="space-y-3 bg-slate-50 p-4 border border-slate-200/60 rounded-2xl">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <FileText className="h-4 w-4 text-blue-500" />
              Documentos Fiscais (Opcional)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">NF Entrada</label>
                <input
                  type="text"
                  placeholder="Ex: 1234"
                  value={nfEntrada}
                  onChange={(e) => setNfEntrada(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-blue-450 text-slate-950 font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">NF Retorno</label>
                <input
                  type="text"
                  placeholder="Ex: 5678"
                  value={nfRetorno}
                  onChange={(e) => setNfRetorno(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-blue-450 text-slate-950 font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">NF Serviço</label>
                <input
                  type="text"
                  placeholder="Ex: 9012"
                  value={nfServico}
                  onChange={(e) => setNfServico(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-blue-450 text-slate-950 font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">NF Venda</label>
                <input
                  type="text"
                  placeholder="Ex: 3456"
                  value={nfVenda}
                  onChange={(e) => setNfVenda(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-blue-450 text-slate-950 font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Details / Scope */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-500 mb-1">Detalhes e Escopo do Serviço</label>
            <textarea
              rows={4}
              placeholder="Descreva aqui o serviço solicitado, tolerâncias necessárias ou observações importantes..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-950 text-sm font-semibold"
            ></textarea>
          </div>

          {/* Flags / Status row */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="rework-checkbox"
                checked={rework}
                onChange={(e) => setRework(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4.5 w-4.5 cursor-pointer"
              />
              <label htmlFor="rework-checkbox" className="text-xs md:text-sm text-slate-800 font-bold flex items-center gap-1.5 cursor-pointer">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Marcar como Retrabalho / Correção
              </label>
            </div>

            {isEditing && (
              <div className="flex flex-col gap-3 w-full border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-slate-400 uppercase">Status:</span>
                  <select
                    value={status}
                    onChange={(e) => {
                      const newStatus = e.target.value as OrderStatus;
                      setStatus(newStatus);
                      if (newStatus === 'CLOSED') {
                        if (!completedAt) {
                          setCompletedAt(new Date().toISOString().split('T')[0]);
                        }
                        if (!completedTime) {
                          setCompletedTime(new Date().toTimeString().slice(0, 5));
                        }
                      }
                    }}
                    className="bg-slate-100 p-1.5 rounded-lg border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="OPEN">Aberto</option>
                    <option value="IN_PROGRESS">Em Andamento</option>
                    <option value="CLOSED">Concluído</option>
                    <option value="REWORK">Retrabalho</option>
                  </select>
                </div>

                {status === 'CLOSED' && (
                  <div className="grid grid-cols-2 gap-3 bg-emerald-50 border border-emerald-100 p-3 rounded-xl animate-fade-in">
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-800 mb-1 uppercase">Data da Entrega Real</label>
                      <input
                        type="date"
                        value={completedAt}
                        onChange={(e) => setCompletedAt(e.target.value)}
                        className="w-full bg-white border border-emerald-200 rounded-lg py-1 px-2 focus:outline-none focus:ring-2 focus:ring-emerald-450 text-slate-950 text-xs font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-800 mb-1 uppercase">Hora de Fim/Entrega Real</label>
                      <input
                        type="time"
                        value={completedTime}
                        onChange={(e) => setCompletedTime(e.target.value)}
                        className="w-full bg-white border border-emerald-200 rounded-lg py-1 px-2 focus:outline-none focus:ring-2 focus:ring-emerald-450 text-slate-950 text-xs font-semibold"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Action buttons at the bottom of the card */}
        <div className="flex gap-3 pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 rounded-xl text-xs font-bold transition text-center cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/10"
          >
            <Save className="h-4 w-4" />
            {isEditing ? 'Salvar O.S.' : 'Abrir O.S.'}
          </button>
        </div>
      </form>
    </div>
  );
}
