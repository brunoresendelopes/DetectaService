import { ServiceOrder, Operator, Section } from './types';

export const INITIAL_SECTIONS: Section[] = [
  { id: '1', name: 'CALDEIRARIA', color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800' },
  { id: '2', name: 'JATO E PINTURA', color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800' },
  { id: '3', name: 'USINAGEM', color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800' },
  { id: '4', name: 'MONTAGEM', color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800' },
  { id: '5', name: 'INSPEÇÃO', color: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800' }
];

export const INITIAL_OPERATORS: Operator[] = [
  { id: '1', name: 'ALTAIR APARECIDO', role: 'Auxiliar de Produção', active: true },
  { id: '2', name: 'DALVAN ROBSON', role: 'Auxiliar de Produção', active: true },
  { id: '3', name: 'DIONE PEREIRA', role: 'Soldador', active: true },
  { id: '4', name: 'EVANDRO CARLOS', role: 'Soldador', active: true },
  { id: '5', name: 'FAGNER FELIPE', role: 'Auxiliar de Produção', active: true },
  { id: '6', name: 'GILBERTO GOMES', role: 'Oxicortador Máquina', active: true },
  { id: '7', name: 'GILSON ANDERSON', role: 'Torneiro Mecânico', active: true },
  { id: '8', name: 'LEANDRO JOSÉ', role: 'Torneiro Mecânico', active: true },
  { id: '9', name: 'MÁRCIO AMARAL', role: 'Pintor Industrial', active: true },
  { id: '10', name: 'NATANAEL RODRIGUES', role: 'Auxiliar de Produção', active: true },
  { id: '11', name: 'RAMON DO NASCIMENTO', role: 'Auxiliar de Produção', active: true },
  { id: '12', name: 'RONALDO JOSÉ', role: 'Líder de Ajustagem/Mont.', active: true }
];

export const INITIAL_SERVICE_ORDERS: ServiceOrder[] = [
  {
    id: 'os-0002962',
    code: '0002962',
    client: 'DETECTA',
    date: '2026-06-25',
    deliveryDeadline: '2026-07-25',
    drawingNumber: 'AMOSTRA',
    revision: 'A',
    quantity: 1,
    inspector: 'RONALDO JOSÉ',
    nfSerie: '10452 / 1',
    details: 'FERIAS (Manutenção Corretiva e Jateamento de Molde Principal)',
    rework: false,
    status: 'IN_PROGRESS',
    subServices: [
      { id: 'sub-1', description: 'PREPARAÇÃO DE MATERIAL / CALDEIRARIA', executed: true },
      { id: 'sub-2', description: 'JATEAMENTO COM GRANALHA', executed: true },
      { id: 'sub-3', description: 'PINTURA PU DE ACABAMENTO', executed: false },
      { id: 'sub-4', description: 'INSPEÇÃO DE ESPESSURA DE CAMADA', executed: false }
    ],
    executions: [
      {
        id: 'exec-1',
        date: '2026-06-29',
        startTime: '07:00',
        endTime: '17:00',
        totalHours: 9.0,
        operator: 'DIONE PEREIRA',
        concluded: false,
        section: 'CALDEIRARIA'
      },
      {
        id: 'exec-2',
        date: '2026-06-30',
        startTime: '07:00',
        endTime: '17:00',
        totalHours: 9.0,
        operator: 'DIONE PEREIRA',
        concluded: false,
        section: 'CALDEIRARIA'
      },
      {
        id: 'exec-3',
        date: '2026-07-13',
        startTime: '07:00',
        endTime: '17:00',
        totalHours: 9.0,
        operator: 'MÁRCIO AMARAL',
        concluded: false,
        section: 'JATO E PINTURA'
      },
      {
        id: 'exec-4',
        date: '2026-07-14',
        startTime: '07:00',
        endTime: '17:00',
        totalHours: 9.0,
        operator: 'MÁRCIO AMARAL',
        concluded: false,
        section: 'JATO E PINTURA'
      },
      {
        id: 'exec-5',
        date: '2026-07-15',
        startTime: '07:00',
        endTime: '17:00',
        totalHours: 9.0,
        operator: 'MÁRCIO AMARAL',
        concluded: false,
        section: 'JATO E PINTURA'
      },
      {
        id: 'exec-6',
        date: '2026-07-16',
        startTime: '07:00',
        endTime: '17:00',
        totalHours: 9.0,
        operator: 'MÁRCIO AMARAL',
        concluded: false,
        section: 'JATO E PINTURA'
      },
      {
        id: 'exec-7',
        date: '2026-07-17',
        startTime: '07:00',
        endTime: '16:00',
        totalHours: 8.0,
        operator: 'MÁRCIO AMARAL',
        concluded: false,
        section: 'JATO E PINTURA'
      }
    ]
  },
  {
    id: 'os-0002963',
    code: '0002963',
    client: 'VALE S.A.',
    date: '2026-07-02',
    deliveryDeadline: '2026-07-18',
    drawingNumber: 'VL-8820-M',
    revision: 'B',
    quantity: 4,
    inspector: 'RONALDO JOSÉ',
    nfSerie: '11029 / 1',
    details: 'Fabricação de Eixos de Transmissão Reforçados para Transportadores.',
    rework: false,
    status: 'CLOSED',
    completedAt: '2026-07-12',
    subServices: [
      { id: 'sub-5', description: 'USINAGEM PRELIMINAR EM TORNO', executed: true },
      { id: 'sub-6', description: 'TRATAMENTO TÉRMICO', executed: true },
      { id: 'sub-7', description: 'RETIFICA DE PRECISÃO', executed: true }
    ],
    executions: [
      {
        id: 'exec-8',
        date: '2026-07-05',
        startTime: '08:00',
        endTime: '18:00',
        totalHours: 9.0,
        operator: 'GILSON ANDERSON',
        concluded: true,
        section: 'USINAGEM'
      },
      {
        id: 'exec-9',
        date: '2026-07-06',
        startTime: '08:00',
        endTime: '15:00',
        totalHours: 6.0,
        operator: 'GILSON ANDERSON',
        concluded: true,
        section: 'USINAGEM'
      }
    ]
  },
  {
    id: 'os-0002964',
    code: '0002964',
    client: 'PETROBRAS',
    date: '2026-07-10',
    deliveryDeadline: '2026-07-28',
    drawingNumber: 'PET-TUB-44',
    revision: '0',
    quantity: 12,
    inspector: 'RONALDO JOSÉ',
    nfSerie: '12048 / 2',
    details: 'Soldagem e teste de estanqueidade em flanges de alta pressão.',
    rework: true,
    status: 'REWORK',
    subServices: [
      { id: 'sub-8', description: 'SOLDA TIG ESPECIALIZADA', executed: true },
      { id: 'sub-9', description: 'TESTE DE ULTRA-SOM', executed: true },
      { id: 'sub-10', description: 'REPARO DE POROSIDADES ENCONTRADAS', executed: false }
    ],
    executions: [
      {
        id: 'exec-10',
        date: '2026-07-11',
        startTime: '07:30',
        endTime: '17:30',
        totalHours: 9.0,
        operator: 'DIONE PEREIRA',
        concluded: false,
        section: 'CALDEIRARIA'
      },
      {
        id: 'exec-11',
        date: '2026-07-12',
        startTime: '08:00',
        endTime: '12:00',
        totalHours: 4.0,
        operator: 'RONALDO JOSÉ',
        concluded: false,
        section: 'INSPEÇÃO'
      }
    ]
  },
  {
    id: 'os-0002965',
    code: '0002965',
    client: ' Gerdau S.A.',
    date: '2026-07-14',
    deliveryDeadline: '2026-08-05',
    drawingNumber: 'GD-SUP-012',
    revision: '3',
    quantity: 20,
    inspector: 'RONALDO JOSÉ',
    details: 'Corte e dobra de perfis estruturais de apoio.',
    rework: false,
    status: 'OPEN',
    subServices: [
      { id: 'sub-11', description: 'CORTE EM GUILHOTINA CN', executed: false },
      { id: 'sub-12', description: 'DOBRA DE ALTA PRECISÃO', executed: false }
    ],
    executions: []
  }
];
