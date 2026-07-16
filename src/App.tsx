import React, { useState, useEffect } from 'react';
import { ServiceOrder, Operator } from './types';
import { INITIAL_SERVICE_ORDERS, INITIAL_OPERATORS } from './mockData';
import Dashboard from './components/Dashboard';
import OrderList from './components/OrderList';
import OrderDetails from './components/OrderDetails';
import OrderForm from './components/OrderForm';
import PrintReport from './components/PrintReport';
import CollaboratorsManager from './components/CollaboratorsManager';
import ReportsPanel from './components/ReportsPanel';
import { 
  Wrench, 
  LayoutDashboard, 
  ClipboardList, 
  PlusCircle, 
  Calendar,
  Layers,
  AlertTriangle,
  Menu,
  X,
  FileText,
  Users,
  BarChart3
} from 'lucide-react';

export default function App() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'create' | 'details' | 'print' | 'collaborators' | 'reports'>('dashboard');
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<ServiceOrder | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [orderIdToDelete, setOrderIdToDelete] = useState<string | null>(null);

  // Initialize data from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('detecta_service_orders');
    if (saved) {
      try {
        let parsedOrders = JSON.parse(saved) as ServiceOrder[];
        
        // Migrate old names in service orders to match the new operators
        let hasMigration = false;
        parsedOrders = parsedOrders.map(order => {
          let orderChanged = false;
          let updatedExecutions = order.executions ? [...order.executions] : [];
          
          if (order.inspector === 'ROBERTO LIMA') {
            order.inspector = 'RONALDO JOSÉ';
            orderChanged = true;
          }
          
          updatedExecutions = updatedExecutions.map(exec => {
            if (exec.operator === 'DIONE') {
              exec.operator = 'DIONE PEREIRA';
              orderChanged = true;
            } else if (exec.operator === 'MARCIO AMA') {
              exec.operator = 'MÁRCIO AMARAL';
              orderChanged = true;
            } else if (exec.operator === 'ALEXANDRE SILVA') {
              exec.operator = 'GILSON ANDERSON';
              orderChanged = true;
            } else if (exec.operator === 'ROBERTO LIMA') {
              exec.operator = 'RONALDO JOSÉ';
              orderChanged = true;
            }
            return exec;
          });
          
          if (orderChanged) {
            hasMigration = true;
            return { ...order, executions: updatedExecutions };
          }
          return order;
        });

        const isOldDefaultOrders = parsedOrders.some(o => o.id === 'os-0002962' && o.inspector === 'ROBERTO LIMA');
        if (isOldDefaultOrders) {
          setOrders(INITIAL_SERVICE_ORDERS);
          localStorage.setItem('detecta_service_orders', JSON.stringify(INITIAL_SERVICE_ORDERS));
        } else if (hasMigration) {
          setOrders(parsedOrders);
          localStorage.setItem('detecta_service_orders', JSON.stringify(parsedOrders));
        } else {
          setOrders(parsedOrders);
        }
      } catch (e) {
        setOrders(INITIAL_SERVICE_ORDERS);
      }
    } else {
      setOrders(INITIAL_SERVICE_ORDERS);
      localStorage.setItem('detecta_service_orders', JSON.stringify(INITIAL_SERVICE_ORDERS));
    }

    const savedOps = localStorage.getItem('detecta_operators');
    if (savedOps) {
      try {
        const parsed = JSON.parse(savedOps) as Operator[];
        // If it's the old default list (contains old names like 'MARCIO AMA' or is exact length of 5)
        const isOldDefault = parsed.some(op => op.name === 'MARCIO AMA' || op.name === 'DIONE' || op.name === 'ALEXANDRE SILVA' || op.name === 'ROBERTO LIMA');
        if (isOldDefault || parsed.length === 5) {
          setOperators(INITIAL_OPERATORS);
          localStorage.setItem('detecta_operators', JSON.stringify(INITIAL_OPERATORS));
        } else {
          setOperators(parsed);
        }
      } catch (e) {
        setOperators(INITIAL_OPERATORS);
      }
    } else {
      setOperators(INITIAL_OPERATORS);
      localStorage.setItem('detecta_operators', JSON.stringify(INITIAL_OPERATORS));
    }
  }, []);

  const handleUpdateOperators = (updatedOps: Operator[]) => {
    setOperators(updatedOps);
    localStorage.setItem('detecta_operators', JSON.stringify(updatedOps));
  };

  // Save to localStorage when orders change
  const saveOrders = (updatedOrders: ServiceOrder[]) => {
    setOrders(updatedOrders);
    localStorage.setItem('detecta_service_orders', JSON.stringify(updatedOrders));
  };

  const handleSelectOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
      setActiveTab('details');
    }
  };

  const handleEditOrder = (order: ServiceOrder) => {
    setOrderToEdit(order);
    setActiveTab('create');
  };

  const handlePrintOrder = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setActiveTab('print');
  };

  const handleSaveOrder = (savedOrder: ServiceOrder) => {
    const exists = orders.some(o => o.id === savedOrder.id);
    let updated: ServiceOrder[];
    if (exists) {
      updated = orders.map(o => o.id === savedOrder.id ? savedOrder : o);
    } else {
      updated = [savedOrder, ...orders];
    }
    saveOrders(updated);
    setOrderToEdit(null);
    setSelectedOrder(savedOrder);
    setActiveTab('details');
  };

  const handleUpdateOrder = (updatedOrder: ServiceOrder) => {
    const updated = orders.map(o => o.id === updatedOrder.id ? updatedOrder : o);
    saveOrders(updated);
    setSelectedOrder(updatedOrder);
  };

  const handleCancelForm = () => {
    setOrderToEdit(null);
    if (selectedOrder) {
      setActiveTab('details');
    } else {
      setActiveTab('list');
    }
  };

  // Badges count
  const openOrdersCount = orders.filter(o => o.status === 'OPEN').length;
  const inProgressOrdersCount = orders.filter(o => o.status === 'IN_PROGRESS').length;
  const reworkOrdersCount = orders.filter(o => o.status === 'REWORK').length;
  const totalActiveBadge = openOrdersCount + inProgressOrdersCount + reworkOrdersCount;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans selection:bg-blue-600 selection:text-white antialiased">
      
      {/* SIDEBAR NAVIGATION (Desktop) */}
      <aside className="hidden md:flex w-64 bg-slate-900 flex-col border-r border-slate-850 sticky top-0 h-screen select-none print:hidden">
        {/* Brand Header */}
        <div className="p-6 mb-2">
          <div 
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => {
              setActiveTab('dashboard');
              setSelectedOrder(null);
            }}
          >
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-md overflow-hidden shrink-0 p-1">
              <img 
                src="https://www.dropbox.com/scl/fi/dhouz5gxyaebkmjws4mmy/Logo.jpg?rlkey=n4bj15wc5znf939k1l5j3p7z3&st=w8pnp6sz&raw=1" 
                alt="Logo Detecta" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white italic">
              Detecta<span className="text-blue-400">Service</span>
            </h1>
          </div>
          <span className="block text-[9px] font-bold text-slate-500 tracking-wider font-mono mt-1 ml-10">CONTROLE INDUSTRIAL</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-1.5 py-4">
          <button
            onClick={() => {
              setActiveTab('dashboard');
              setSelectedOrder(null);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'text-white bg-blue-600 shadow-md shadow-blue-600/10'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Painel Geral
          </button>

          <button
            onClick={() => {
              setActiveTab('list');
              setSelectedOrder(null);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all cursor-pointer relative ${
              activeTab === 'list' || activeTab === 'details'
                ? 'text-white bg-blue-600 shadow-md shadow-blue-600/10'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            Ordens Ativas
            {totalActiveBadge > 0 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white font-mono border border-slate-900">
                {totalActiveBadge}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setOrderToEdit(null);
              setActiveTab('create');
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'text-white bg-blue-600 shadow-md shadow-blue-600/10'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <PlusCircle className={`w-5 h-5 ${activeTab === 'create' ? 'text-white' : 'text-blue-400'}`} />
            Nova O.S.
          </button>

          <button
            onClick={() => {
              setSelectedOrder(null);
              setActiveTab('collaborators');
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'collaborators'
                ? 'text-white bg-blue-600 shadow-md shadow-blue-600/10'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-5 h-5 text-blue-400" />
            Colaboradores
          </button>

          <button
            onClick={() => {
              setSelectedOrder(null);
              setActiveTab('reports');
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'reports'
                ? 'text-white bg-blue-600 shadow-md shadow-blue-600/10'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Relatórios & Indicadores
          </button>
        </nav>

        {/* Sidebar Footer (Technician details) */}
        <div className="p-4 mt-auto border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
              <span className="text-xs text-white font-bold">TC</span>
            </div>
            <div className="text-xs">
              <p className="text-white font-semibold">Técnico Carlos</p>
              <p className="text-slate-400 font-medium">Em campo • Ativo</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER & DROP MENU */}
      <header className="md:hidden sticky top-0 z-45 bg-slate-900 text-white border-b border-slate-800 px-4 py-3.5 flex items-center justify-between shadow-sm print:hidden">
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => {
            setActiveTab('dashboard');
            setSelectedOrder(null);
          }}
        >
          <div className="w-11 h-11 bg-white rounded-lg flex items-center justify-center shadow-md overflow-hidden shrink-0 p-0.5">
            <img 
              src="https://www.dropbox.com/scl/fi/dhouz5gxyaebkmjws4mmy/Logo.jpg?rlkey=n4bj15wc5znf939k1l5j3p7z3&st=w8pnp6sz&raw=1" 
              alt="Logo Detecta" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white italic">
            Detecta<span className="text-blue-400">Service</span>
          </h1>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white focus:outline-none hover:bg-slate-800 transition"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {mobileMenuOpen && (
        <div className="md:hidden fixed top-14 left-0 right-0 z-30 bg-slate-900 border-b border-slate-800 py-3 space-y-1.5 px-4 text-sm font-semibold animate-fadeIn print:hidden shadow-lg">
          <button
            onClick={() => {
              setActiveTab('dashboard');
              setSelectedOrder(null);
              setMobileMenuOpen(false);
            }}
            className={`flex items-center gap-2.5 w-full p-2.5 rounded-xl text-left ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <LayoutDashboard className="h-4.5 w-4.5" />
            Painel Geral
          </button>
          <button
            onClick={() => {
              setActiveTab('list');
              setSelectedOrder(null);
              setMobileMenuOpen(false);
            }}
            className={`flex items-center gap-2.5 w-full p-2.5 rounded-xl text-left ${activeTab === 'list' || activeTab === 'details' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <ClipboardList className="h-4.5 w-4.5" />
            Ordens Ativas ({totalActiveBadge})
          </button>
          <button
            onClick={() => {
              setOrderToEdit(null);
              setActiveTab('create');
              setMobileMenuOpen(false);
            }}
            className={`flex items-center gap-2.5 w-full p-2.5 rounded-xl text-left ${activeTab === 'create' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <PlusCircle className="h-4.5 w-4.5 text-blue-400" />
            Nova O.S.
          </button>
          <button
            onClick={() => {
              setSelectedOrder(null);
              setActiveTab('collaborators');
              setMobileMenuOpen(false);
            }}
            className={`flex items-center gap-2.5 w-full p-2.5 rounded-xl text-left ${activeTab === 'collaborators' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <Users className="h-4.5 w-4.5 text-blue-400" />
            Colaboradores
          </button>
          <button
            onClick={() => {
              setSelectedOrder(null);
              setActiveTab('reports');
              setMobileMenuOpen(false);
            }}
            className={`flex items-center gap-2.5 w-full p-2.5 rounded-xl text-left ${activeTab === 'reports' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <BarChart3 className="h-4.5 w-4.5 text-blue-400" />
            Relatórios & Indicadores
          </button>
        </div>
      )}

      {/* RIGHT MAIN VIEW */}
      <div className="flex-1 flex flex-col min-h-screen bg-slate-50 overflow-x-hidden">
        {/* Desktop Header */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 items-center justify-between px-8 shadow-sm print:hidden shrink-0">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">
            {activeTab === 'dashboard' && 'Painel Geral'}
            {activeTab === 'list' && 'Ordens de Serviço em Aberto'}
            {activeTab === 'create' && (orderToEdit ? `Editar O.S. #${orderToEdit.code}` : 'Nova Abertura de O.S. (Campo)')}
            {activeTab === 'details' && `Detalhamento da O.S. #${selectedOrder?.code}`}
            {activeTab === 'print' && `Relatório Técnico de O.S. #${selectedOrder?.code}`}
            {activeTab === 'collaborators' && 'Gerenciamento de Colaboradores'}
            {activeTab === 'reports' && 'Relatórios e Indicadores Técnicos'}
          </h2>
          <div className="flex items-center gap-4">
            {reworkOrdersCount > 0 && (
              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-1.5 rounded-xl text-xs font-bold animate-pulse">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                {reworkOrdersCount} em Retrabalho
              </div>
            )}
            <div className="text-right text-xs text-slate-500 font-semibold bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/50 font-mono">
              <span>{new Date().toLocaleDateString('pt-BR')}</span>
            </div>
            {activeTab !== 'create' && (
              <button
                onClick={() => {
                  setOrderToEdit(null);
                  setActiveTab('create');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition duration-200 shadow-md shadow-blue-500/10 cursor-pointer"
              >
                + Nova O.S.
              </button>
            )}
          </div>
        </header>

        {/* Content View Routing Area */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto pb-12 shrink-0">
          {activeTab === 'dashboard' && (
            <Dashboard 
              orders={orders} 
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onSelectOrder={handleSelectOrder}
            />
          )}

          {activeTab === 'list' && (
            <OrderList 
              orders={orders} 
              onSelectOrder={handleSelectOrder}
              onEditOrder={handleEditOrder}
              onPrintOrder={handlePrintOrder}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onDeleteOrder={(orderId) => setOrderIdToDelete(orderId)}
            />
          )}

          {activeTab === 'create' && (
            <OrderForm 
              orderToEdit={orderToEdit}
              onSave={handleSaveOrder}
              onCancel={handleCancelForm}
              existingCodes={orders.map(o => o.code)}
              operators={operators}
            />
          )}

          {activeTab === 'details' && selectedOrder && (
            <OrderDetails 
              order={selectedOrder}
              onBack={() => setActiveTab('list')}
              onUpdateOrder={handleUpdateOrder}
              onPrintOrder={handlePrintOrder}
              operators={operators}
              onDeleteOrder={(orderId) => setOrderIdToDelete(orderId)}
            />
          )}

          {activeTab === 'print' && selectedOrder && (
            <PrintReport 
              order={selectedOrder}
              onBack={() => setActiveTab('details')}
            />
          )}

          {activeTab === 'collaborators' && (
            <CollaboratorsManager 
              operators={operators} 
              onUpdateOperators={handleUpdateOperators} 
            />
          )}

          {activeTab === 'reports' && (
            <ReportsPanel 
              orders={orders}
              operators={operators}
            />
          )}
        </main>

        {/* Sleek footer */}
        <footer className="bg-white border-t border-slate-200 text-slate-500 py-5 text-xs font-semibold print:hidden mt-auto">
          <div className="max-w-7xl mx-auto px-6 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-800 font-extrabold tracking-tight font-sans">DETECTA SERVICE</span>
              <span className="text-slate-300">|</span>
              <span>Sistema Operacional de Campo v2.4</span>
            </div>
            <div>
              <span>© {new Date().getFullYear()} Detecta Service. Todos os direitos reservados.</span>
            </div>
          </div>
        </footer>
      </div>

      {orderIdToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" id="delete-confirmation-modal">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-150 transform transition-all duration-300">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                <AlertTriangle className="h-5 w-5 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Excluir Ordem de Serviço?
              </h3>
            </div>
            
            <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
              Você está prestes a excluir a Ordem de Serviço <span className="font-mono font-bold text-slate-800">#{orders.find(o => o.id === orderIdToDelete)?.code}</span>. 
              Esta ação removerá permanentemente todos os registros de apontamentos associados a esta O.S. e não poderá ser desfeita.
            </p>
            
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setOrderIdToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const updated = orders.filter(o => o.id !== orderIdToDelete);
                  saveOrders(updated);
                  setOrderIdToDelete(null);
                  if (selectedOrder?.id === orderIdToDelete) {
                    setSelectedOrder(null);
                    setActiveTab('list');
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-rose-500/10"
              >
                Excluir Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
