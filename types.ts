export enum Priority {
  NORMAL = 'Normal',
  MEDIO = 'Médio',
  URGENTE = 'Urgente'
}

export enum OrderStatus {
  PENDING = 'Pendente',
  IN_PROGRESS = 'Em Produção',
  COMPLETED = 'Concluído',
  STOPPED = 'Parado'
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'operador' | 'vendedor';
  password?: string;
  avatar?: string; // Can be a gradient class or a base64 image string
  isCustomImage?: boolean;
}

export interface Order {
  id: string;
  ocNumber: string; // Order of Cut / Purchase Order
  client: string;
  description: string;
  priority: Priority;
  status: OrderStatus;
  dueDate: string; // ISO Date string
  createdAt: string;
  salesperson: string; // Nome do vendedor responsável
  assignedTo?: string; // User ID
  completedBy?: string; // User ID
  completedAt?: string;
}

export interface ClicheItem {
  id: string;
  description: string;
  client: string;
  sentDate: string;
  receivedDate?: string;
  status: 'sent' | 'received';
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  userName: string;
  timestamp: string;
  type: 'create' | 'update' | 'delete' | 'info';
}

export type Theme = 'light' | 'dark';

export type ViewState = 'orders' | 'schedule' | 'cliche' | 'users' | 'performance';
