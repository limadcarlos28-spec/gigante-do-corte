import {
  BarbershopDatabase,
  Service,
  Professional,
  OperatingHoursConfig,
  Blockout,
  Appointment,
  AppointmentStatus,
  BarbershopSettings
} from '../types/barbershop.ts';

const API_BASE = '/api';

export interface BootstrapResponse {
  settings: BarbershopSettings;
  services: Service[];
  professionals: Professional[];
  operatingHours: OperatingHoursConfig;
}

export interface DashboardStats {
  todayCount: number;
  tomorrowCount: number;
  upcomingCount: number;
  estimatedTodayRevenue: number;
  totalClientsCount: number;
  nextAppointments: Appointment[];
  todayDate: string;
  tomorrowDate: string;
}

export interface ClientSummary {
  name: string;
  phone: string;
  totalAppointments: number;
  totalSpent: number;
  lastAppointmentDate: string;
  appointments: Appointment[];
}

export const api = {
  // Public
  async getPublicInfo(): Promise<BootstrapResponse> {
    const res = await fetch(`${API_BASE}/public/info`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao buscar dados da barbearia');
    }
    return res.json();
  },

  async getBootstrapData(): Promise<BootstrapResponse> {
    return this.getPublicInfo();
  },

  async getAvailableSlots(date: string, professionalId: string, serviceId: string): Promise<string[]> {
    const params = new URLSearchParams({ date, professionalId, serviceId });
    const res = await fetch(`${API_BASE}/public/slots?${params.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao consultar horários disponíveis');
    }
    const data = await res.json();
    return data.slots || [];
  },

  async createAppointment(payload: {
    serviceId: string;
    professionalId: string;
    date: string;
    time: string;
    clientName: string;
    clientPhone: string;
    clientNotes?: string;
  }): Promise<{ success: boolean; message: string; appointment: Appointment }> {
    const res = await fetch(`${API_BASE}/public/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Não foi possível confirmar o agendamento');
    }
    return res.json();
  },

  async getAppointmentById(id: string): Promise<Appointment> {
    const res = await fetch(`${API_BASE}/public/appointments/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Agendamento não encontrado');
    }
    return res.json();
  },

  // Admin
  async adminLogin(password: string): Promise<{ success: boolean; token: string }> {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Senha incorreta');
    }
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('gigante_admin_token', data.token);
    }
    return data;
  },

  logoutAdmin() {
    localStorage.removeItem('gigante_admin_token');
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/admin/dashboard`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao carregar estatísticas');
    }
    return res.json();
  },

  async getAppointments(params?: {
    filter?: 'today' | 'tomorrow' | 'upcoming' | 'date' | 'all';
    date?: string;
    professionalId?: string;
    status?: string;
  }): Promise<{
    count: number;
    todayDate: string;
    tomorrowDate: string;
    appointments: Appointment[];
  }> {
    const query = new URLSearchParams();
    if (params?.filter) query.set('filter', params.filter);
    if (params?.date) query.set('date', params.date);
    if (params?.professionalId) query.set('professionalId', params.professionalId);
    if (params?.status) query.set('status', params.status);

    const res = await fetch(`${API_BASE}/admin/appointments?${query.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao listar agendamentos');
    }
    return res.json();
  },

  async createManualAppointment(payload: {
    serviceId: string;
    professionalId: string;
    date: string;
    time: string;
    clientName: string;
    clientPhone: string;
    clientNotes?: string;
    forceConflict?: boolean;
  }): Promise<Appointment> {
    const res = await fetch(`${API_BASE}/admin/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao criar agendamento manual');
    }
    const data = await res.json();
    return data.appointment || data;
  },

  async updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    const res = await fetch(`${API_BASE}/admin/appointments/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao atualizar status');
    }
    const data = await res.json();
    return data.appointment || data;
  },

  async deleteAppointment(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/admin/appointments/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao excluir agendamento');
    }
    return true;
  },

  // Services
  async getServices(): Promise<Service[]> {
    const res = await fetch(`${API_BASE}/admin/services`);
    if (!res.ok) throw new Error('Erro ao buscar serviços');
    return res.json();
  },

  async createService(service: Omit<Service, 'id'>): Promise<Service> {
    const res = await fetch(`${API_BASE}/admin/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service),
    });
    if (!res.ok) throw new Error('Erro ao criar serviço');
    return res.json();
  },

  async updateService(id: string, service: Partial<Service>): Promise<Service> {
    const res = await fetch(`${API_BASE}/admin/services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service),
    });
    if (!res.ok) throw new Error('Erro ao atualizar serviço');
    return res.json();
  },

  async deleteService(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/admin/services/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Erro ao remover serviço');
    return true;
  },

  // Professionals
  async getProfessionals(): Promise<Professional[]> {
    const res = await fetch(`${API_BASE}/admin/professionals`);
    if (!res.ok) throw new Error('Erro ao buscar profissionais');
    return res.json();
  },

  async createProfessional(pro: Omit<Professional, 'id'>): Promise<Professional> {
    const res = await fetch(`${API_BASE}/admin/professionals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pro),
    });
    if (!res.ok) throw new Error('Erro ao criar profissional');
    return res.json();
  },

  async updateProfessional(id: string, pro: Partial<Professional>): Promise<Professional> {
    const res = await fetch(`${API_BASE}/admin/professionals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pro),
    });
    if (!res.ok) throw new Error('Erro ao atualizar profissional');
    return res.json();
  },

  async deleteProfessional(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/admin/professionals/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Erro ao remover profissional');
    return true;
  },

  // Operating Hours
  async getOperatingHours(): Promise<OperatingHoursConfig> {
    const res = await fetch(`${API_BASE}/admin/operating-hours`);
    if (!res.ok) throw new Error('Erro ao buscar horários de funcionamento');
    return res.json();
  },

  async updateOperatingHours(hours: OperatingHoursConfig): Promise<OperatingHoursConfig> {
    const res = await fetch(`${API_BASE}/admin/operating-hours`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hours),
    });
    if (!res.ok) throw new Error('Erro ao salvar horários de funcionamento');
    return res.json();
  },

  // Blockouts
  async getBlockouts(): Promise<Blockout[]> {
    const res = await fetch(`${API_BASE}/admin/blockouts`);
    if (!res.ok) throw new Error('Erro ao buscar bloqueios');
    return res.json();
  },

  async createBlockout(blockout: Omit<Blockout, 'id' | 'createdAt'>): Promise<Blockout> {
    const res = await fetch(`${API_BASE}/admin/blockouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(blockout),
    });
    if (!res.ok) throw new Error('Erro ao criar bloqueio');
    return res.json();
  },

  async deleteBlockout(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/admin/blockouts/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Erro ao excluir bloqueio');
    return true;
  },

  // Clients
  async getClients(): Promise<ClientSummary[]> {
    const res = await fetch(`${API_BASE}/admin/clients`);
    if (!res.ok) throw new Error('Erro ao buscar clientes');
    return res.json();
  },

  // Settings
  async getSettings(): Promise<BarbershopSettings> {
    const res = await fetch(`${API_BASE}/admin/settings`);
    if (!res.ok) throw new Error('Erro ao carregar configurações');
    return res.json();
  },

  async updateSettings(settings: Partial<BarbershopSettings> & { newPassword?: string }): Promise<BarbershopSettings> {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Erro ao atualizar configurações');
    return res.json();
  },

  async updateAdminPassword(newPassword: string): Promise<BarbershopSettings> {
    return this.updateSettings({ newPassword });
  },

  // Professional Exclusive API
  async getProfessionalAppointments(
    professionalId: string,
    params?: {
      filter?: 'today' | 'tomorrow' | 'upcoming' | 'date' | 'all';
      date?: string;
      status?: string;
    }
  ): Promise<{
    professional: Professional;
    todayDate: string;
    tomorrowDate: string;
    count: number;
    appointments: Appointment[];
  }> {
    const query = new URLSearchParams();
    if (params?.filter) query.set('filter', params.filter);
    if (params?.date) query.set('date', params.date);
    if (params?.status) query.set('status', params.status);

    const res = await fetch(`${API_BASE}/professional/${professionalId}/appointments?${query.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao consultar agenda do profissional');
    }
    return res.json();
  },

  async updateProfessionalAppointmentStatus(
    professionalId: string,
    appointmentId: string,
    status: AppointmentStatus
  ): Promise<Appointment> {
    const res = await fetch(`${API_BASE}/professional/${professionalId}/appointments/${appointmentId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao atualizar status do agendamento');
    }
    return res.json();
  },
};
