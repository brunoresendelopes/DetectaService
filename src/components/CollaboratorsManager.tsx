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
  ShieldAlert
} from 'lucide-react';

interface CollaboratorsManagerProps {
  operators: Operator[];
  onUpdateOperators: (updated: Operator[]) => void;
}

export default function CollaboratorsManager({ 
  operators, 
  onUpdateOperators 
}: CollaboratorsManagerProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim().toUpperCase();
    const trimmedRole = role.trim();

    if (!trimmedName || !trimmedRole) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Check if operator with same name already exists
    const exists = operators.some(op => op.name.toUpperCase() === trimmedName);
    if (exists) {
      setError('Este colaborador já está cadastrado no sistema.');
      return;
    }

    const newOperator: Operator = {
      id: `op-${Date.now()}`,
      name: trimmedName,
      role: trimmedRole,
      active: true
    };

    onUpdateOperators([...operators, newOperator]);
    
    // Reset Form
    setName('');
    setRole('');
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
        {/* Left Column: Register Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-fit space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <UserPlus className="h-4.5 w-4.5 text-blue-500" />
            Cadastrar Novo Colaborador
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

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/10"
            >
              <UserPlus className="h-4 w-4" />
              Cadastrar Colaborador
            </button>
          </form>
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
                          <button
                            onClick={() => setDeletingId(op.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Excluir colaborador"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
