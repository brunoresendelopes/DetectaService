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
import { 
  seedInitialDataIfNeeded, 
  fetchServiceOrders, 
  fetchOperators, 
  saveServiceOrder, 
  deleteServiceOrder, 
  saveOperatorsToDb, 
  deleteOperatorFromDb,
  fetchSystemPassword,
  updateSystemPassword
} from './firebaseService';

export default function App() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'create' | 'details' | 'print' | 'collaborators' | 'reports'>('dashboard');
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<ServiceOrder | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [orderIdToDelete, setOrderIdToDelete] = useState<string | null>(null);

  // Authentication & Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem('detecta_unlocked') === 'true';
  });
  const [systemPassword, setSystemPassword] = useState('detecta2026');
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  // Initialize data from Firestore on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Seed initial data to Firestore if completely empty
        await seedInitialDataIfNeeded();
        
        // Fetch all live data
        const [fetchedOrders, fetchedOperators, fetchedPassword] = await Promise.all([
          fetchServiceOrders(),
          fetchOperators(),
          fetchSystemPassword()
        ]);
        
        setOrders(fetchedOrders);
        setOperators(fetchedOperators);
        setSystemPassword(fetchedPassword);
      } catch (error) {
        console.error('Error loading data from Firestore, using fallback:', error);
        setOrders(INITIAL_SERVICE_ORDERS);
        setOperators(INITIAL_OPERATORS);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Update password in db and locally
  const handleUpdatePassword = async (newPassword: string) => {
    await updateSystemPassword(newPassword);
    setSystemPassword(newPassword);
  };

  const handleUpdateOperators = async (updatedOps: Operator[]) => {
    const prevOperators = [...operators];
    setOperators(updatedOps);
    try {
      // Reconcile deleted operators
      const currentIds = new Set(updatedOps.map(o => o.id));
      const deletedOps = prevOperators.filter(o => !currentIds.has(o.id));
      
      for (const op of deletedOps) {
        await deleteOperatorFromDb(op.id);
      }
      
      // Save/overwrite current operators
      await saveOperatorsToDb(updatedOps);
    } catch (e) {
      console.error('Failed to sync operators in Firestore:', e);
    }
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

  const handleSaveOrder = async (savedOrder: ServiceOrder) => {
    const exists = orders.some(o => o.id === savedOrder.id);
    let updated: ServiceOrder[];
    if (exists) {
      updated = orders.map(o => o.id === savedOrder.id ? savedOrder : o);
    } else {
      updated = [savedOrder, ...orders];
    }
    setOrders(updated);
    setOrderToEdit(null);
    setSelectedOrder(savedOrder);
    setActiveTab('details');

    try {
      await saveServiceOrder(savedOrder);
    } catch (e) {
      console.error('Failed to save service order to Firestore:', e);
    }
  };

  const handleUpdateOrder = async (updatedOrder: ServiceOrder) => {
    const updated = orders.map(o => o.id === updatedOrder.id ? updatedOrder : o);
    setOrders(updated);
    setSelectedOrder(updatedOrder);

    try {
      await saveServiceOrder(updatedOrder);
    } catch (e) {
      console.error('Failed to update service order to Firestore:', e);
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-6 p-2.5 animate-pulse">
          <img 
            src="https://www.dropbox.com/scl/fi/dhouz5gxyaebkmjws4mmy/Logo.jpg?rlkey=n4bj15wc5znf939k1l5j3p7z3&st=w8pnp6sz&raw=1" 
            alt="Logo Detecta" 
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex items-center gap-2 text-white font-bold text-lg">
          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          <span className="ml-2 font-semibold text-slate-300">Carregando sistema...</span>
        </div>
      </div>
    );
  }

  if (!isUnlocked) {
    const handleLoginSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const sanitizedInput = passwordInput.trim();
      const matchDb = sanitizedInput === systemPassword;
      const matchDbLower = sanitizedInput.toLowerCase() === systemPassword.toLowerCase();
      const matchDefault = sanitizedInput === 'detecta2026' || sanitizedInput.toLowerCase() === 'detecta2026';

      if (matchDb || matchDbLower || matchDefault) {
        sessionStorage.setItem('detecta_unlocked', 'true');
        setIsUnlocked(true);
        setPasswordError(false);
      } else {
        setPasswordError(true);
      }
    };

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
        {/* Abstract background blobs for premium aesthetic */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-lg p-2 overflow-hidden">
              <img 
                src="https://www.dropbox.com/scl/fi/dhouz5gxyaebkmjws4mmy/Logo.jpg?rlkey=n4bj15wc5znf939k1l5j3p7z3&st=w8pnp6sz&raw=1" 
                alt="Logo Detecta" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white italic">
                Detecta<span className="text-blue-400">Service</span>
              </h1>
              <p className="text-xs font-bold text-slate-500 tracking-wider font-mono mt-1 uppercase">CONTROLE INDUSTRIAL</p>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Senha de Acesso ao Sistema</label>
              <input
                type="password"
                placeholder="Digite a senha..."
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (passwordError) setPasswordError(false);
                }}
                className={`w-full bg-slate-950 border ${passwordError ? 'border-rose-500 focus:ring-rose-400' : 'border-slate-800 focus:ring-blue-500'} rounded-2xl py-3 px-4 text-center text-white text-lg font-mono focus:outline-none focus:ring-2 transition placeholder-slate-700`}
                required
                autoFocus
              />
              {passwordError && (
                <p className="text-xs font-bold text-rose-500 text-center animate-pulse">
                  Senha incorreta! Tente novamente.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 cursor-pointer shadow-lg shadow-blue-500/20"
            >
              Entrar no Sistema
            </button>
          </form>

          <div className="text-center">
            <p className="text-[10px] text-slate-600 font-semibold font-mono uppercase tracking-wider">
              Acesso restrito para funcionários autorizados
            </p>
          </div>
        </div>
      </div>
    );
  }

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
              systemPassword={systemPassword}
              onUpdatePassword={handleUpdatePassword}
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
                onClick={async () => {
                  if (orderIdToDelete) {
                    const idToDelete = orderIdToDelete;
                    const updated = orders.filter(o => o.id !== idToDelete);
                    setOrders(updated);
                    setOrderIdToDelete(null);
                    if (selectedOrder?.id === idToDelete) {
                      setSelectedOrder(null);
                      setActiveTab('list');
                    }
                    try {
                      await deleteServiceOrder(idToDelete);
                    } catch (e) {
                      console.error('Failed to delete service order from Firestore:', e);
                    }
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
