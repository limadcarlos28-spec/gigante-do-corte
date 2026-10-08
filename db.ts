import fs from 'fs';
import path from 'path';
import {
  BarbershopDatabase,
  Service,
  Professional,
  OperatingHoursConfig,
  Blockout,
  Appointment,
  BarbershopSettings
} from './barbershop.ts';

const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), 'data'));
const DB_FILE = path.join(DATA_DIR, 'barbershop-data.json');
const TMP_FILE = path.join(DATA_DIR, 'barbershop-data.tmp.json');

const INITIAL_SERVICES: Service[] = [
  {
    id: 'srv-barba',
    name: 'Barba',
    price: 25.00,
    durationMinutes: 30,
    description: 'Design de barba com toalha quente, navalhete e pós-barba hidratante.',
    active: true,
  },
  {
    id: 'srv-corte-barba',
    name: 'Corte + Barba',
    price: 55.00,
    durationMinutes: 60,
    description: 'Combo completo: corte degradê ou tradicional alinhado com barba modelada.',
    active: true,
  },
  {
    id: 'srv-corte-infantil',
    name: 'Corte Infantil',
    price: 30.00,
    durationMinutes: 30,
    description: 'Corte paciente e personalizado para crianças até 12 anos.',
    active: true,
  },
  {
    id: 'srv-corte-masculino',
    name: 'Corte Masculino',
    price: 40.00,
    durationMinutes: 30,
    description: 'Corte moderno ou clássico, tesoura ou máquina, com acabamento impecável.',
    active: true,
  },
  {
    id: 'srv-sobrancelha',
    name: 'Sobrancelha',
    price: 15.00,
    durationMinutes: 15,
    description: 'Design e alinhamento de sobrancelha na navalha.',
    active: true,
  },
];

const INITIAL_PROFESSIONALS: Professional[] = [
  {
    id: 'pro-givanilson',
    name: 'GIVANILSON',
    status: 'active',
    phone: '(11) 98765-4321',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    specialties: ['Corte Masculino', 'Barba Terapia', 'Degradê'],
  },
];

const INITIAL_OPERATING_HOURS: OperatingHoursConfig = {
  monday: { open: '09:00', close: '21:00', active: true },
  tuesday: { open: '09:00', close: '21:00', active: true },
  wednesday: { open: '09:00', close: '21:00', active: true },
  thursday: { open: '09:00', close: '21:00', active: true },
  friday: { open: '09:00', close: '21:00', active: true },
  saturday: { open: '09:00', close: '21:00', active: true },
  sunday: { open: '09:00', close: '21:00', active: false },
  breakInterval: { start: '12:00', end: '13:00', active: true },
};

const INITIAL_SETTINGS: BarbershopSettings = {
  id: 'settings-default',
  name: 'GIGANTE DO CORTE',
  slogan: 'Agende seu horário de forma rápida e fácil.',
  phone: '(81) 99474-1304',
  whatsappMessage: 'Olá, gostaria de informações sobre a Gigante do Corte!',
  address: 'Av. Antonio Ramos, 26 – Alto da Saudade, São Caetano-PE',
  adminPasswordHash: 'gigante123', // Senha padrão administrativa de fácil acesso e alterável
  slotIntervalMinutes: 30,
};

function getInitialDatabase(): BarbershopDatabase {
  return {
    settings: INITIAL_SETTINGS,
    services: INITIAL_SERVICES,
    professionals: INITIAL_PROFESSIONALS,
    operatingHours: INITIAL_OPERATING_HOURS,
    blockouts: [],
    appointments: [],
  };
}

class BarbershopDB {
  private data: BarbershopDatabase;

  constructor() {
    this.data = this.loadFromDisk();
  }

  private loadFromDisk(): BarbershopDatabase {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as BarbershopDatabase;
        
        // Garantir que todos os campos existam mesmo se schema evoluir
        return {
          settings: { ...INITIAL_SETTINGS, ...(parsed.settings || {}) },
          services: parsed.services?.length ? parsed.services : INITIAL_SERVICES,
          professionals: parsed.professionals?.length ? parsed.professionals : INITIAL_PROFESSIONALS,
          operatingHours: parsed.operatingHours || INITIAL_OPERATING_HOURS,
          blockouts: parsed.blockouts || [],
          appointments: parsed.appointments || [],
        };
      }
    } catch (err) {
      console.error('[DB] Erro ao ler banco de dados do disco, usando padrão:', err);
    }

    const initial = getInitialDatabase();
    this.saveToDisk(initial);
    return initial;
  }

  private saveToDisk(data: BarbershopDatabase): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(TMP_FILE, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(TMP_FILE, DB_FILE);
    } catch (err) {
      console.error('[DB] Erro ao salvar banco de dados:', err);
    }
  }

  public getData(): BarbershopDatabase {
    return this.data;
  }

  public reload(): BarbershopDatabase {
    this.data = this.loadFromDisk();
    return this.data;
  }

  public getSettings(): BarbershopSettings {
    return this.data.settings;
  }

  public updateSettings(updates: Partial<BarbershopSettings>): BarbershopSettings {
    this.data.settings = { ...this.data.settings, ...updates };
    this.saveToDisk(this.data);
    return this.data.settings;
  }

  public getServices(onlyActive = false): Service[] {
    if (onlyActive) {
      return this.data.services.filter(s => s.active);
    }
    return this.data.services;
  }

  public getServiceById(id: string): Service | undefined {
    return this.data.services.find(s => s.id === id);
  }

  public saveService(service: Service): Service {
    const idx = this.data.services.findIndex(s => s.id === service.id);
    if (idx >= 0) {
      this.data.services[idx] = service;
    } else {
      this.data.services.push(service);
    }
    this.saveToDisk(this.data);
    return service;
  }

  public deleteService(id: string): boolean {
    const initialLen = this.data.services.length;
    this.data.services = this.data.services.filter(s => s.id !== id);
    if (this.data.services.length !== initialLen) {
      this.saveToDisk(this.data);
      return true;
    }
    return false;
  }

  public getProfessionals(onlyActive = false): Professional[] {
    if (onlyActive) {
      return this.data.professionals.filter(p => p.status === 'active');
    }
    return this.data.professionals;
  }

  public getProfessionalById(id: string): Professional | undefined {
    return this.data.professionals.find(p => p.id === id);
  }

  public saveProfessional(pro: Professional): Professional {
    const idx = this.data.professionals.findIndex(p => p.id === pro.id);
    if (idx >= 0) {
      this.data.professionals[idx] = pro;
    } else {
      this.data.professionals.push(pro);
    }
    this.saveToDisk(this.data);
    return pro;
  }

  public deleteProfessional(id: string): boolean {
    const initialLen = this.data.professionals.length;
    this.data.professionals = this.data.professionals.filter(p => p.id !== id);
    if (this.data.professionals.length !== initialLen) {
      this.saveToDisk(this.data);
      return true;
    }
    return false;
  }

  public getOperatingHours(): OperatingHoursConfig {
    return this.data.operatingHours;
  }

  public updateOperatingHours(hours: OperatingHoursConfig): OperatingHoursConfig {
    this.data.operatingHours = hours;
    this.saveToDisk(this.data);
    return this.data.operatingHours;
  }

  public getBlockouts(): Blockout[] {
    return this.data.blockouts;
  }

  public addBlockout(blockout: Blockout): Blockout {
    this.data.blockouts.push(blockout);
    this.saveToDisk(this.data);
    return blockout;
  }

  public deleteBlockout(id: string): boolean {
    const initialLen = this.data.blockouts.length;
    this.data.blockouts = this.data.blockouts.filter(b => b.id !== id);
    if (this.data.blockouts.length !== initialLen) {
      this.saveToDisk(this.data);
      return true;
    }
    return false;
  }

  public getAppointments(): Appointment[] {
    return this.data.appointments;
  }

  public getAppointmentById(id: string): Appointment | undefined {
    return this.data.appointments.find(a => a.id === id);
  }

  public addAppointment(appointment: Appointment): Appointment {
    this.data.appointments.push(appointment);
    this.saveToDisk(this.data);
    return appointment;
  }

  public updateAppointmentStatus(id: string, status: 'confirmed' | 'completed' | 'cancelled'): Appointment | null {
    const app = this.data.appointments.find(a => a.id === id);
    if (!app) return null;
    app.status = status;
    app.updatedAt = new Date().toISOString();
    this.saveToDisk(this.data);
    return app;
  }

  public deleteAppointment(id: string): boolean {
    const initialLen = this.data.appointments.length;
    this.data.appointments = this.data.appointments.filter(a => a.id !== id);
    if (this.data.appointments.length !== initialLen) {
      this.saveToDisk(this.data);
      return true;
    }
    return false;
  }

  public resetToDefaults(): BarbershopDatabase {
    this.data = getInitialDatabase();
    this.saveToDisk(this.data);
    return this.data;
  }
}

export const dbInstance = new BarbershopDB();
