import React, { useState } from 'react';
import { Operator } from '../types';
import { INITIAL_SECTIONS } from '../mockData';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Briefcase, 
  Check, 
  AlertCircle, 
  Settings,
  ShieldAlert,
  Calendar,
  Gift,
  Pencil
} from 'lucide-react';

function formatDateBR(dateStr?: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function calculateYearsOfService(admissionDateStr?: string): string {
  if (!admissionDateStr) return '-';
  const parts = admissionDateStr.split('-');
  if (parts.length !== 3) return '-';
  
  const admissionDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const today = new Date();
  
  let years = today.getFullYear() - admissionDate.getFullYear();
  const monthDiff = today.getMonth() - admissionDate.getMonth();
  const dayDiff = today.getDate() - admissionDate.getDate();
  
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    years--;
  }
  
  if (years < 0) return '0 anos';
  if (years === 0) {
    let months = today.getMonth() - admissionDate.getMonth() + (12 * (today.getFullYear() - admissionDate.getFullYear()));
    if (dayDiff < 0) {
      months--;
    }
    if (months <= 0) return 'Admitido recente';
    return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  }
  
  return `${years} ${years === 1 ? 'ano' : 'anos'}`;
}

function calculateAge(birthdayStr?: string): string {
  if (!birthdayStr) return '-';
  const parts = birthdayStr.split('-');
  if (parts.length !== 3) return '-';
  
  const birthdayDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const today = new Date();
  
  let age = today.getFullYear() - birthdayDate.getFullYear();
  const monthDiff = today.getMonth() - birthdayDate.getMonth();
  const dayDiff = today.getDate() - birthdayDate.getDate();
  
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }
  
  if (age < 0) return '0 anos';
  return `${age} ${age === 1 ? 'ano' : 'anos'}`;
}

interface CollaboratorsManagerProps {
  operators: Operator[];
  onUpdateOperators: (updated: Operator[]) => void;
  systemPassword?: string;
  onUpdatePassword?: (newPassword: string) => Promise<void>;
}

export default function CollaboratorsManager({ 
  operators, 
  onUpdateOperators,
  systemPassword = 'detecta2026',
  onUpdatePassword
}: CollaboratorsManagerProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [admissionDate, setAdmissionDate] = useState('');
  const [birthday, setBirthday] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Password edit states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(false);

    if (currentPassword !== systemPassword) {
      setPassError('A senha atual está incorreta.');
      return;
    }

    if (newPass.length < 4) {
      setPassError('A nova senha deve ter pelo menos 4 caracteres.');
      return;
    }

    if (newPass !== confirmPass) {
      setPassError('A confirmação não coincide com a nova senha.');
      return;
    }

    try {
      setPassLoading(true);
      if (onUpdatePassword) {
        await onUpdatePassword(newPass);
      }
      setPassSuccess(true);
      setCurrentPassword('');
      setNewPass('');
      setConfirmPass('');
    } catch (err) {
      setPassError('Erro ao salvar a nova senha.');
    } finally {
      setPassLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim().toUpperCase();
    const trimmedRole = role.trim();

    if (!trimmedName || !trimmedRole) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Check if operator with same name already exists (excluding the one being edited)
    const exists = operators.some(op => op.id !== editingId && op.name.toUpperCase() === trimmedName);
    if (exists) {
      setError('Este colaborador já está cadastrado no sistema.');
      return;
    }

    if (editingId) {
      const updated = operators.map(op => {
        if (op.id === editingId) {
          return {
            ...op,
            name: trimmedName,
            role: trimmedRole,
            admissionDate: admissionDate || undefined,
            birthday: birthday || undefined
          };
        }
        return op;
      });
      onUpdateOperators(updated);
      setEditingId(null);
    } else {
      const newOperator: Operator = {
        id: `op-${Date.now()}`,
        name: trimmedName,
        role: trimmedRole,
        active: true,
        admissionDate: admissionDate || undefined,
        birthday: birthday || undefined
      };
      onUpdateOperators([...operators, newOperator]);
    }
    
    // Reset Form
    setName('');
    setRole('');
    setAdmissionDate('');
    setBirthday('');
  };

  const handleDelete = (id: string) => {
    const updated = operators.filter(op => op.id !== id);
    onUpdateOperators(updated);
    setDeletingId(null);
  };

  const toggleActive = (id: string) => {
    const updated = operators.map(op => {
      if (op.id === id) {
        return { ...op, active: !op.active };
      }
      return op;
    });
    onUpdateOperators(updated);
  };

  return (
    <div className="space-y-6" id="collaborators-manager-container">
      {/* Upper description header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-xl md:text-2xl font-sans font-bold text-slate-900 flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" />
          Gerenciamento de Colaboradores
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Cadastre os técnicos, operadores e inspetores para o apontamento de horas das Ordens de Serviço.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Register Form and Security */}
        <div className="space-y-6 h-fit">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              {editingId ? (
                <>
                  <Pencil className="h-4.5 w-4.5 text-amber-500" />
                  Editar Colaborador
                </>
              ) : (
                <>
                  <UserPlus className="h-4.5 w-4.5 text-blue-500" />
                  Cadastrar Novo Colaborador
                </>
              )}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs md:text-sm">
              {error && (
                <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl text-xs font-semibold text-rose-700 flex items-start gap-2 animate-fade-in">
                  <AlertCircle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Nome Completo <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  placeholder="Ex: DIONE RESENDE"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-950 font-bold uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Função / Cargo <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  placeholder="Ex: Caldeireiro, Pintor, Torneiro..."
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-950 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Data de Admissão</label>
                  <input
                    type="date"
                    value={admissionDate}
                    onChange={(e) => setAdmissionDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-950 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Aniversário</label>
                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-950 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setName('');
                      setRole('');
                      setAdmissionDate('');
                      setBirthday('');
                      setError(null);
                    }}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  className={`${editingId ? 'w-2/3 bg-amber-600 hover:bg-amber-700 shadow-amber-500/10' : 'w-full bg-blue-600 hover:bg-blue-700 shadow-blue-500/10'} text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md`}
                >
                  {editingId ? (
                    <>
                      <Check className="h-4 w-4" />
                      Salvar
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Cadastrar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Security and Access Card */}
          {onUpdatePassword && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Settings className="h-4.5 w-4.5 text-blue-500" />
                Segurança e Acesso
              </h2>
              <p className="text-xs text-slate-500">
                Defina a senha mestra necessária para liberar o acesso ao aplicativo.
              </p>

              <form onSubmit={handlePasswordChange} className="space-y-4 text-xs md:text-sm">
                {passError && (
                  <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl text-xs font-semibold text-rose-700 flex items-start gap-2">
                    <AlertCircle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{passError}</span>
                  </div>
                )}

                {passSuccess && (
                  <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-xs font-semibold text-emerald-700 flex items-start gap-2">
                    <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Senha atualizada com sucesso!</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Senha Atual</label>
                  <input
                    type="password"
                    placeholder="Sua senha atual..."
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-950 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Nova Senha</label>
                  <input
                    type="password"
                    placeholder="Mínimo 4 caracteres..."
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-950 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    placeholder="Repita a nova senha..."
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-950 font-mono"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={passLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/10"
                >
                  <Settings className="h-4 w-4" />
                  {passLoading ? 'Salvando...' : 'Atualizar Senha'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Registered List */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-slate-500" />
              Colaboradores Registrados
            </h2>
            <span className="bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs px-2.5 py-1 rounded-full font-mono">
              Total: {operators.length}
            </span>
          </div>

          {operators.length === 0 ? (
            <div className="text-center py-12 text-slate-400 italic">
              Nenhum colaborador cadastrado no sistema. Use o formulário ao lado para cadastrar.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                    <th className="py-3 px-4">Nome</th>
                    <th className="py-3 px-4">Cargo / Função</th>
                    <th className="py-3 px-4">Admissão</th>
                    <th className="py-3 px-4">Tempo de Empresa</th>
                    <th className="py-3 px-4">Aniversário</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {operators.map(op => (
                    <tr key={op.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4 font-bold text-slate-900 uppercase">
                        {op.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                          {op.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {formatDateBR(op.admissionDate)}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono font-bold text-blue-650">
                        {calculateYearsOfService(op.admissionDate)}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {op.birthday ? (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                            <span className="flex items-center gap-1 text-rose-600 font-bold font-mono">
                              <Gift className="h-3.5 w-3.5 text-rose-500" />
                              {formatDateBR(op.birthday).substring(0, 5)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-extrabold bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                              {calculateAge(op.birthday)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleActive(op.id)}
                          className={`inline-flex px-2 py-0.5 rounded font-bold text-[10px] border transition cursor-pointer ${
                            op.active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                          title="Clique para alternar o status de atividade"
                        >
                          {op.active ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {deletingId === op.id ? (
                          <div className="inline-flex gap-1">
                            <button
                              onClick={() => handleDelete(op.id)}
                              className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition"
                            >
                              Sim
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingId(op.id);
                                setName(op.name);
                                setRole(op.role);
                                setAdmissionDate(op.admissionDate || '');
                                setBirthday(op.birthday || '');
                                setError(null);
                                document.getElementById('collaborators-manager-container')?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition cursor-pointer"
                              title="Editar colaborador"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeletingId(op.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                              title="Excluir colaborador"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
