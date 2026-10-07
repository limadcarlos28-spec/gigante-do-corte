export interface Service {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  description?: string;
  active: boolean;
}

export interface Professional {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  phone?: string;
  avatarUrl?: string;
  specialties?: string[];
}

export interface DayHours {
  open: string;  // "09:00"
  close: string; // "21:00"
  active: boolean;
}

export interface BreakInterval {
  start: string; // "12:00"
  end: string;   // "13:00"
  active: boolean;
}

export interface OperatingHoursConfig {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
  breakInterval: BreakInterval;
}

export interface Blockout {
  id: string;
  professionalId: string; // "all" or specific professional id
  date: string; // "YYYY-MM-DD"
  allDay: boolean;
  startTime?: string; // "HH:mm"
  endTime?: string;   // "HH:mm"
  reason: string;
  createdAt: string;
}

export type AppointmentStatus = 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  durationMinutes: number;
  professionalId: string;
  professionalName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  endTime: string; // HH:mm
  clientName: string;
  clientPhone: string;
  clientNotes?: string;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BarbershopSettings {
  id: string;
  name: string;
  slogan: string;
  phone: string;
  whatsappMessage: string;
  address: string;
  adminPasswordHash: string;
  slotIntervalMinutes: number;
}

export interface BarbershopDatabase {
  settings: BarbershopSettings;
  services: Service[];
  professionals: Professional[];
  operatingHours: OperatingHoursConfig;
  blockouts: Blockout[];
  appointments: Appointment[];
}
