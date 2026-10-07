import { dbInstance } from './db.js';
import {
  getDayOfWeekKey,
  getTodayDateString,
  timeToMinutes,
  minutesToTime,
  addMinutesToTime,
  intervalsOverlap
} from ./dateUtils.js

export interface AvailableSlotInfo {
  time: string;
  endTime: string;
  available: boolean;
  reason?: string;
}

export function getAvailableSlotsForDate(
  date: string, // YYYY-MM-DD
  professionalId: string,
  durationMinutes: number
): string[] {
  const operatingHours = dbInstance.getOperatingHours();
  const dayKey = getDayOfWeekKey(date);
  const dayConfig = operatingHours[dayKey];

  // Barbearia fechada neste dia da semana
  if (!dayConfig || !dayConfig.active) {
    return [];
  }

  const openMinutes = timeToMinutes(dayConfig.open);
  const closeMinutes = timeToMinutes(dayConfig.close);
  const slotStep = dbInstance.getSettings().slotIntervalMinutes || 30;

  // Verificar bloqueios de folga/feriado para esta data
  const blockouts = dbInstance.getBlockouts().filter(b => 
    b.date === date && (b.professionalId === 'all' || b.professionalId === professionalId)
  );

  const hasAllDayBlockout = blockouts.some(b => b.allDay);
  if (hasAllDayBlockout) {
    return [];
  }

  // Obter agendamentos existentes ativos para o profissional neste dia
  const existingAppointments = dbInstance.getAppointments().filter(app => 
    app.date === date && 
    app.professionalId === professionalId && 
    app.status !== 'cancelled'
  );

  const breakConfig = operatingHours.breakInterval;
  const breakStart = breakConfig.active ? breakConfig.start : null;
  const breakEnd = breakConfig.active ? breakConfig.end : null;

  const now = new Date();
  const isToday = date === getTodayDateString();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const availableSlots: string[] = [];

  for (let m = openMinutes; m + durationMinutes <= closeMinutes; m += slotStep) {
    const slotStart = minutesToTime(m);
    const slotEnd = minutesToTime(m + durationMinutes);

    // Se for hoje, o horário já passou? (Dá margem de 5 min)
    if (isToday && m <= currentMinutes + 5) {
      continue;
    }

    // Colisão com intervalo de almoço/descanso
    if (breakStart && breakEnd) {
      if (intervalsOverlap(slotStart, slotEnd, breakStart, breakEnd)) {
        continue;
      }
    }

    // Colisão com bloqueios parciais
    const collidesWithBlockout = blockouts.some(b => {
      if (b.allDay) return true;
      if (b.startTime && b.endTime) {
        return intervalsOverlap(slotStart, slotEnd, b.startTime, b.endTime);
      }
      return false;
    });

    if (collidesWithBlockout) {
      continue;
    }

    // Colisão com outros agendamentos existentes do profissional
    const collidesWithAppointment = existingAppointments.some(app => {
      return intervalsOverlap(slotStart, slotEnd, app.time, app.endTime);
    });

    if (collidesWithAppointment) {
      continue;
    }

    availableSlots.push(slotStart);
  }

  return availableSlots;
}

export function validateAndCreateAppointment(data: {
  serviceId: string;
  professionalId: string;
  date: string;
  time: string;
  clientName: string;
  clientPhone: string;
  clientNotes?: string;
}) {
  const service = dbInstance.getServiceById(data.serviceId);
  if (!service || !service.active) {
    throw new Error('Serviço inválido ou indisponível');
  }

  const professional = dbInstance.getProfessionalById(data.professionalId);
  if (!professional || professional.status !== 'active') {
    throw new Error('Profissional inválido ou inativo');
  }

  if (!data.date || !data.time || !data.clientName.trim() || !data.clientPhone.trim()) {
    throw new Error('Preencha todos os campos obrigatórios (nome, telefone, data e horário)');
  }

  const availableSlots = getAvailableSlotsForDate(
    data.date,
    data.professionalId,
    service.durationMinutes
  );

  if (!availableSlots.includes(data.time)) {
    throw new Error(
      `O horário ${data.time} não está disponível para o profissional ${professional.name} na data selecionada. Por favor, escolha outro horário.`
    );
  }

  const endTime = addMinutesToTime(data.time, service.durationMinutes);

  const appointment = {
    id: 'apt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    serviceId: service.id,
    serviceName: service.name,
    servicePrice: service.price,
    durationMinutes: service.durationMinutes,
    professionalId: professional.id,
    professionalName: professional.name,
    date: data.date,
    time: data.time,
    endTime,
    clientName: data.clientName.trim(),
    clientPhone: data.clientPhone.trim(),
    clientNotes: data.clientNotes?.trim(),
    status: 'confirmed' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return dbInstance.addAppointment(appointment);
}
