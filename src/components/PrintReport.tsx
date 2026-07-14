import React from 'react';
import { ServiceOrder } from '../types';
import { Printer, ArrowLeft, Download, ShieldCheck, FileSpreadsheet } from 'lucide-react';

interface PrintReportProps {
  order: ServiceOrder;
  onBack: () => void;
}

export default function PrintReport({ order, onBack }: PrintReportProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return dateStr.split('-').reverse().join('/');
  };

  const calculateHours = () => {
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="print-report-container">
      {/* Control Bar (hidden during printing via CSS) */}
      <div className="print:hidden flex items-center justify-between border-b border-slate-200 pb-5">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para os Detalhes
        </button>

        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer shadow-md shadow-blue-500/10"
          >
            <Printer className="h-4 w-4" />
            Imprimir Relatório (PDF)
          </button>
        </div>
      </div>

      {/* Printable Sheet (styled with custom shadow and white page style) */}
      <div 
        className="bg-white text-slate-900 rounded-2xl border border-slate-200 p-8 shadow-md max-w-4xl mx-auto space-y-6 print:border-0 print:shadow-none print:p-0"
        id="printable-document"
      >
        {/* Printable CSS Override */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body {
              background-color: white !important;
              color: black !important;
            }
            .print\\:hidden {
              display: none !important;
            }
            #printable-document {
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
              max-width: 100% !important;
            }
          }
        `}} />

        {/* Technical Header */}
        <div className="flex items-center justify-between border-b-4 border-slate-900 pb-5">
          <div className="space-y-1">
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Relatório Operacional</span>
            <h1 className="text-2xl font-sans font-black tracking-tight text-slate-900">DETECTA SERVICE</h1>
            <p className="text-xs text-slate-500 font-semibold font-mono">CONTROLE, MANUTENÇÃO E GESTÃO INDUSTRIAL</p>
          </div>
          <div className="text-right space-y-1">
            <div className="bg-slate-900 text-white px-3 py-1.5 rounded font-mono text-sm font-extrabold">
              O.S. Nº {order.code}
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">
              STATUS: {order.status === 'CLOSED' ? 'CONCLUÍDO' : 'EM ANDAMENTO'}
            </div>
            {order.rework && (
              <span className="inline-block bg-rose-50 text-rose-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-rose-100">
                RETRABALHO SINALIZADO
              </span>
            )}
          </div>
        </div>

        {/* Section 1: Identification Grid */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase border-b border-slate-200 pb-1.5">
            1. IDENTIFICAÇÃO E DADOS GERAIS
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-50 p-2.5 rounded border border-slate-150">
              <span className="block text-[9px] text-slate-400 font-bold uppercase">Cliente</span>
              <span className="font-extrabold text-slate-900">{order.client}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-150">
              <span className="block text-[9px] text-slate-400 font-bold uppercase">Atividade</span>
              <span className="font-mono font-bold text-slate-900">
                {getActivityCode(order.drawingNumber) ? `[${getActivityCode(order.drawingNumber)}] ` : ''}{order.drawingNumber || 'N/A'}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-150">
              <span className="block text-[9px] text-slate-400 font-bold uppercase">Revisão</span>
              <span className="font-mono font-bold text-slate-900">{order.revision || '0'}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-150">
              <span className="block text-[9px] text-slate-400 font-bold uppercase">Quantidade</span>
              <span className="font-bold text-slate-900">{order.quantity} pçs</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-150">
              <span className="block text-[9px] text-slate-400 font-bold uppercase">Data de Abertura</span>
              <span className="font-bold text-slate-900">{formatDate(order.date)}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-150">
              <span className="block text-[9px] text-slate-400 font-bold uppercase">Hora de Abertura</span>
              <span className="font-bold text-slate-900">{order.startTime || '-'}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-150">
              <span className="block text-[9px] text-slate-400 font-bold uppercase">Prazo de Entrega Estimado</span>
              <span className="font-bold text-slate-900">{formatDate(order.deliveryDeadline)}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-150">
              <span className="block text-[9px] text-slate-400 font-bold uppercase">Data e Horário da Entrega</span>
              <span className="font-bold text-slate-900">
                {order.completedAt ? formatDate(order.completedAt) : 'Em aberto'}
                {order.completedAt && order.completedTime ? ` às ${order.completedTime}` : ''}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-150">
              <span className="block text-[9px] text-slate-400 font-bold uppercase">Responsável</span>
              <span className="font-bold text-slate-900">{order.inspector || '-'}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-150">
              <span className="block text-[9px] text-slate-400 font-bold uppercase">Total Horas Trabalhadas</span>
              <span className="font-mono font-bold text-blue-800">{calculateHours()}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Technical Details Scope */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase border-b border-slate-200 pb-1.5">
            2. DETALHAMENTO DO ESCOPO DE TRABALHO
          </h2>
          <div className="bg-slate-50 p-4 rounded border border-slate-150 text-xs text-slate-700 leading-relaxed font-semibold">
            {order.details || 'Nenhuma especificação técnica adicional fornecida.'}
          </div>
        </div>

        {/* Section 3: Subservices Process list */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase border-b border-slate-200 pb-1.5">
            3. CRONOGRAMA DE ETAPAS E CONTROLE DE PROCESSO
          </h2>
          {order.subServices.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Nenhum sub-serviço controlado por checklist.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {order.subServices.map((sub, idx) => (
                <div key={sub.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-100">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center font-bold ${
                    sub.executed ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-300 text-transparent'
                  }`}>
                    ✓
                  </div>
                  <span className={`font-semibold ${sub.executed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {idx + 1}. {sub.description}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Executions History */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase border-b border-slate-200 pb-1.5">
            4. APONTAMENTO DE HORAS E EXECUTORES
          </h2>
          {order.executions.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-400 italic">
              Nenhuma execução operacional registrada nesta ordem de serviço.
            </div>
          ) : (
            <div className="overflow-hidden border border-slate-200 rounded">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-[9px] uppercase font-bold text-slate-500 border-b border-slate-200">
                    <th className="py-2.5 px-4">Data</th>
                    <th className="py-2.5 px-3">Horário</th>
                    <th className="py-2.5 px-3 text-right">Horas</th>
                    <th className="py-2.5 px-4">Seção de Trabalho</th>
                    <th className="py-2.5 px-4">Técnico / Operador</th>
                    <th className="py-2.5 px-3 text-center">Concluído</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {order.executions.map(exec => {
                    const h = Math.floor(exec.totalHours);
                    const m = Math.round((exec.totalHours - h) * 60);
                    const displayHrs = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}h`;

                    return (
                      <tr key={exec.id}>
                        <td className="py-2.5 px-4 font-mono font-bold">{exec.date.split('-').reverse().join('/')}</td>
                        <td className="py-2.5 px-3 font-mono">{exec.startTime} às {exec.endTime}</td>
                        <td className="py-2.5 px-3 text-right font-extrabold font-mono text-slate-900">{displayHrs}</td>
                        <td className="py-2.5 px-4 font-extrabold uppercase text-slate-500 text-[10px] tracking-wide">{exec.section}</td>
                        <td className="py-2.5 px-4 font-bold">{exec.operator}</td>
                        <td className="py-2.5 px-3 text-center">
                          {exec.concluded ? 'Sim' : 'Não'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 5: Totals block */}
        <div className="flex justify-end pt-3">
          <div className="bg-slate-900 text-white p-4 rounded-xl flex gap-8 items-center text-xs">
            <div>
              <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">Lançamentos</span>
              <span className="text-sm font-black font-mono">{order.executions.length} registros</span>
            </div>
            <div>
              <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">Total de Horas Trabalhadas</span>
              <span className="text-base font-black font-mono text-blue-400">{calculateHours()}</span>
            </div>
          </div>
        </div>

        {/* Section 6: Quality Signatures */}
        <div className="pt-10 grid grid-cols-3 gap-6 text-center text-[10px] text-slate-500">
          <div className="space-y-2">
            <div className="border-b border-slate-300 pb-1 mx-4"></div>
            <p className="font-bold uppercase text-slate-800">OPERADOR RESPONSÁVEL</p>
            <p className="text-[9px] text-slate-400">Assinatura / Visto em Campo</p>
          </div>
          <div className="space-y-2">
            <div className="border-b border-slate-300 pb-1 mx-4"></div>
            <p className="font-bold uppercase text-slate-800">RESPONSÁVEL</p>
            <p className="text-[9px] text-slate-400">Medição de Conformidade</p>
          </div>
          <div className="space-y-2">
            <div className="border-b border-slate-300 pb-1 mx-4"></div>
            <p className="font-bold uppercase text-slate-800">RECEBIDO POR CLIENTE</p>
            <p className="text-[9px] text-slate-400">Data: ____/____/________</p>
          </div>
        </div>

        {/* Footer info line */}
        <div className="border-t border-slate-200 pt-5 flex items-center justify-between text-[9px] text-slate-400 font-semibold uppercase">
          <span>Relatório gerado digitalmente via Detecta Service</span>
          <span>Data: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</span>
        </div>
      </div>
    </div>
  );
}
