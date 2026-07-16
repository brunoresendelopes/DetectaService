export type OrderStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'REWORK';

export interface SubService {
  id: string;
  description: string;
  executed: boolean;
}

export interface ExecutionEntry {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  totalHours: number; // Decimal hours
  operator: string;
  concluded: boolean;
  section: string;
  discountLunch?: boolean;
  lunchStart?: string; // HH:MM
  lunchEnd?: string; // HH:MM
}

export interface ServiceOrder {
  id: string;
  code: string; // Unique order identifier like "0002962"
  client: string;
  date: string; // Creation date YYYY-MM-DD
  deliveryDeadline?: string; // YYYY-MM-DD
  drawingNumber?: string;
  revision?: string;
  quantity: number;
  completedAt?: string; // YYYY-MM-DD
  completedTime?: string; // HH:MM
  inspector?: string;
  nfSerie?: string;
  details: string;
  rework: boolean;
  status: OrderStatus;
  subServices: SubService[];
  executions: ExecutionEntry[];
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
}

export interface Operator {
  id: string;
  name: string;
  role: string;
  active: boolean;
}

export interface Section {
  id: string;
  name: string;
  color: string; // Hex or tailwind class for visual differentiation
}
