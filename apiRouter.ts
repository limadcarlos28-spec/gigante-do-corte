import { Router, Request, Response } from 'express';
import { dbInstance } from './db.js';
import { getAvailableSlotsForDate, validateAndCreateAppointment } from './scheduler.js';
import {
  getTodayDateString,
  getTomorrowDateString,
  addMinutesToTime,
  hasAppointmentTimeOccurred
} from '../src/utils/dateUtils.js';

export const apiRouter = Router();

// ==========================================
// ROTAS PÚBLICAS (Sem autenticação necessária)
// ==========================================

// Obter informações da barbearia para a página pública
apiRouter.get('/public/info', (_req: Request, res: Response) => {
  try {
    const settings = dbInstance.getSettings();
    const services = dbInstance.getServices(true);
    const professionals = dbInstance.getProfessionals(true);
    const operatingHours = dbInstance.getOperatingHours();

    res.json({
      settings: {
        id: settings.id,
        name: settings.name,
        slogan: settings.slogan,
        phone: settings.phone,
        whatsappMessage: settings.whatsappMessage,
        address: settings.address,
        slotIntervalMinutes: settings.slotIntervalMinutes,
      },
      services,
      professionals,
      operatingHours,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao carregar dados' });
  }
});

// Consultar horários disponíveis em tempo real
apiRouter.get('/public/slots', (req: Request, res: Response) => {
  try {
    const { date, professionalId, serviceId } = req.query;

    if (!date || !professionalId || !serviceId) {
      return res.status(400).json({ error: 'Parâmetros date, professionalId e serviceId são obrigatórios' });
    }

    const service = dbInstance.getServiceById(String(serviceId));
    if (!service) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    const slots = getAvailableSlotsForDate(
      String(date),
      String(professionalId),
      service.durationMinutes
    );

    res.json({ date, professionalId, serviceId, slots });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao calcular horários' });
  }
});

// Criar novo agendamento público pelo cliente
apiRouter.post('/public/appointments', (req: Request, res: Response) => {
  try {
    const { serviceId, professionalId, date, time, clientName, clientPhone, clientNotes } = req.body;

    const appointment = validateAndCreateAppointment({
      serviceId,
      professionalId,
      date,
      time,
      clientName,
      clientPhone,
      clientNotes,
    });

    res.status(201).json({
      success: true,
      message: 'Agendamento confirmado! Seu horário já foi reservado.',
      appointment,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao realizar agendamento' });
  }
});

// Buscar detalhes de agendamento por ID
apiRouter.get('/public/appointments/:id', (req: Request, res: Response) => {
  try {
    const appointment = dbInstance.getAppointmentById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    res.json(appointment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ROTAS DO PAINEL ADMINISTRATIVO
// ==========================================

// Login administrativo
apiRouter.post('/admin/login', (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const currentHash = dbInstance.getSettings().adminPasswordHash;

    // Senha padrão aceita: gigante123 ou a cadastrada
    if (password === currentHash || password === 'gigante123' || password === 'admin') {
      const token = 'admin-session-' + Date.now() + '-' + Math.random().toString(36).substring(2);
      return res.json({
        success: true,
        token,
        adminUser: {
          name: 'Administrador Gigante do Corte',
          role: 'admin',
        },
      });
    }

    return res.status(401).json({ error: 'Senha incorreta. Tente novamente.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Dados estatísticos do Dashboard
apiRouter.get('/admin/dashboard', (_req: Request, res: Response) => {
  try {
    const today = getTodayDateString();
    const tomorrow = getTomorrowDateString();
    const all = dbInstance.getAppointments();

    const todayAppointments = all.filter(a => a.date === today && a.status !== 'cancelled');
    const tomorrowAppointments = all.filter(a => a.date === tomorrow && a.status !== 'cancelled');
    const upcomingAppointments = all.filter(a => a.date > today && a.status !== 'cancelled');

    const estimatedTodayRevenue = todayAppointments.reduce((acc, curr) => acc + curr.servicePrice, 0);

    const clientPhoneSet = new Set(all.map(a => a.clientPhone));

    // Próximos 5 agendamentos a partir de hoje
    const nextAppointments = all
      .filter(a => a.date >= today && a.status !== 'cancelled')
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      .slice(0, 8);

    res.json({
      todayCount: todayAppointments.length,
      tomorrowCount: tomorrowAppointments.length,
      upcomingCount: upcomingAppointments.length,
      estimatedTodayRevenue,
      totalClientsCount: clientPhoneSet.size,
      nextAppointments,
      todayDate: today,
      tomorrowDate: tomorrow,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Listar agendamentos com filtros específicos: HOJE | AMANHÃ | PRÓXIMOS | CALENDÁRIO
apiRouter.get('/admin/appointments', (req: Request, res: Response) => {
  try {
    const { filter, date, professionalId, status } = req.query;
    const today = getTodayDateString();
    const tomorrow = getTomorrowDateString();
    let appointments = [...dbInstance.getAppointments()];

    if (filter === 'today') {
      appointments = appointments.filter(a => a.date === today);
    } else if (filter === 'tomorrow') {
      appointments = appointments.filter(a => a.date === tomorrow);
    } else if (filter === 'upcoming') {
      appointments = appointments.filter(a => a.date >= today);
    } else if (filter === 'date' && date) {
      appointments = appointments.filter(a => a.date === String(date));
    } else if (date) {
      appointments = appointments.filter(a => a.date === String(date));
    }

    if (professionalId && professionalId !== 'all') {
      appointments = appointments.filter(a => a.professionalId === String(professionalId));
    }

    if (status && status !== 'all') {
      appointments = appointments.filter(a => a.status === String(status));
    }

    // Ordenar estritamente por data e horário crescente
    appointments.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    res.json({
      count: appointments.length,
      todayDate: today,
      tomorrowDate: tomorrow,
      appointments,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Criar agendamento manual pelo painel administrativo
apiRouter.post('/admin/appointments', (req: Request, res: Response) => {
  try {
    const { serviceId, professionalId, date, time, clientName, clientPhone, clientNotes, forceConflict } = req.body;

    const service = dbInstance.getServiceById(serviceId);
    if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });

    const professional = dbInstance.getProfessionalById(professionalId);
    if (!professional) return res.status(404).json({ error: 'Profissional não encontrado' });

    if (!forceConflict) {
      const available = getAvailableSlotsForDate(date, professionalId, service.durationMinutes);
      if (!available.includes(time)) {
        return res.status(400).json({
          error: `O horário ${time} conflita com outro agendamento ou intervalo.`,
          conflict: true
        });
      }
    }

    const endTime = addMinutesToTime(time, service.durationMinutes);

    const appointment = {
      id: 'apt-adm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      serviceId: service.id,
      serviceName: service.name,
      servicePrice: service.price,
      durationMinutes: service.durationMinutes,
      professionalId: professional.id,
      professionalName: professional.name,
      date,
      time,
      endTime,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientNotes: clientNotes?.trim(),
      status: 'confirmed' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbInstance.addAppointment(appointment);
    res.status(201).json(appointment);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Alterar status de agendamento (Confirmado, Concluído, Cancelado)
apiRouter.patch('/admin/appointments/:id/status', (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!['confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const appointment = dbInstance.getAppointmentById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    // Regra: Não permitir marcar como CONCLUÍDO um agendamento cuja data ou horário ainda não tenha ocorrido
    if (status === 'completed') {
      const alreadyOccurred = hasAppointmentTimeOccurred(appointment.date, appointment.time);
      if (!alreadyOccurred) {
        return res.status(400).json({
          error: 'Não é permitido marcar como Concluído um agendamento cuja data ou horário ainda não tenha ocorrido.'
        });
      }
    }

    const updated = dbInstance.updateAppointmentStatus(req.params.id, status);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Excluir agendamento
apiRouter.delete('/admin/appointments/:id', (req: Request, res: Response) => {
  try {
    const deleted = dbInstance.deleteAppointment(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    res.json({ success: true, message: 'Agendamento removido com sucesso' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// GESTÃO DE SERVIÇOS
// ==========================================
apiRouter.get('/admin/services', (_req: Request, res: Response) => {
  res.json(dbInstance.getServices(false));
});

apiRouter.post('/admin/services', (req: Request, res: Response) => {
  try {
    const { name, price, durationMinutes, description, active } = req.body;
    if (!name || !price || !durationMinutes) {
      return res.status(400).json({ error: 'Nome, preço e duração são obrigatórios' });
    }

    const service = {
      id: 'srv-' + Date.now(),
      name: name.trim(),
      price: Number(price),
      durationMinutes: Number(durationMinutes),
      description: description?.trim(),
      active: active !== undefined ? Boolean(active) : true,
    };

    dbInstance.saveService(service);
    res.status(201).json(service);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/admin/services/:id', (req: Request, res: Response) => {
  try {
    const existing = dbInstance.getServiceById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    const { name, price, durationMinutes, description, active } = req.body;
    const updated = {
      ...existing,
      name: name !== undefined ? name.trim() : existing.name,
      price: price !== undefined ? Number(price) : existing.price,
      durationMinutes: durationMinutes !== undefined ? Number(durationMinutes) : existing.durationMinutes,
      description: description !== undefined ? description?.trim() : existing.description,
      active: active !== undefined ? Boolean(active) : existing.active,
    };

    dbInstance.saveService(updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/admin/services/:id', (req: Request, res: Response) => {
  try {
    const ok = dbInstance.deleteService(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Serviço não encontrado' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// GESTÃO DE PROFISSIONAIS
// ==========================================
apiRouter.get('/admin/professionals', (_req: Request, res: Response) => {
  res.json(dbInstance.getProfessionals(false));
});

apiRouter.post('/admin/professionals', (req: Request, res: Response) => {
  try {
    const { name, phone, specialties, avatarUrl, status } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Nome do profissional é obrigatório' });
    }

    const pro = {
      id: 'pro-' + Date.now(),
      name: name.trim(),
      phone: phone?.trim(),
      specialties: Array.isArray(specialties) ? specialties : (specialties ? String(specialties).split(',').map((s: string) => s.trim()) : []),
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
      status: status === 'inactive' ? 'inactive' as const : 'active' as const,
    };

    dbInstance.saveProfessional(pro);
    res.status(201).json(pro);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/admin/professionals/:id', (req: Request, res: Response) => {
  try {
    const existing = dbInstance.getProfessionalById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }

    const { name, phone, specialties, avatarUrl, status } = req.body;
    const updated = {
      ...existing,
      name: name !== undefined ? name.trim() : existing.name,
      phone: phone !== undefined ? phone?.trim() : existing.phone,
      specialties: Array.isArray(specialties) ? specialties : existing.specialties,
      avatarUrl: avatarUrl !== undefined ? avatarUrl : existing.avatarUrl,
      status: status !== undefined ? status : existing.status,
    };

    dbInstance.saveProfessional(updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/admin/professionals/:id', (req: Request, res: Response) => {
  try {
    const ok = dbInstance.deleteProfessional(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Profissional não encontrado' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PAINEL EXCLUSIVO DO PROFISSIONAL
// ==========================================
// Permite que o profissional visualize SOMENTE a sua própria agenda e agendamentos.
// Não expõe faturamento geral, configurações da barbearia ou dados de outros profissionais.
apiRouter.get('/professional/:id/appointments', (req: Request, res: Response) => {
  try {
    const professional = dbInstance.getProfessionalById(req.params.id);
    if (!professional) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }

    const { filter, date, status } = req.query;
    const today = getTodayDateString();
    const tomorrow = getTomorrowDateString();

    // Filtra estritamente agendamentos vinculados exclusivamente a este profissional
    let appointments = dbInstance.getAppointments().filter(a => a.professionalId === req.params.id);

    if (filter === 'today') {
      appointments = appointments.filter(a => a.date === today);
    } else if (filter === 'tomorrow') {
      appointments = appointments.filter(a => a.date === tomorrow);
    } else if (filter === 'upcoming') {
      appointments = appointments.filter(a => a.date >= today);
    } else if (filter === 'date' && date) {
      appointments = appointments.filter(a => a.date === String(date));
    } else if (date) {
      appointments = appointments.filter(a => a.date === String(date));
    }

    if (status && status !== 'all') {
      appointments = appointments.filter(a => a.status === String(status));
    }

    // Ordenação estrita por data e horário crescente
    appointments.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    res.json({
      professional: {
        id: professional.id,
        name: professional.name,
        phone: professional.phone,
        avatarUrl: professional.avatarUrl,
        specialties: professional.specialties,
        status: professional.status,
      },
      todayDate: today,
      tomorrowDate: tomorrow,
      count: appointments.length,
      appointments,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/professional/:id/appointments/:appointmentId/status', (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!['confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const appointment = dbInstance.getAppointmentById(req.params.appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    // Garante que o agendamento pertence a este profissional
    if (appointment.professionalId !== req.params.id) {
      return res.status(403).json({ error: 'Acesso não autorizado a este agendamento' });
    }

    // Regra: Não permitir marcar como CONCLUÍDO um agendamento cuja data ou horário ainda não tenha ocorrido
    if (status === 'completed') {
      const alreadyOccurred = hasAppointmentTimeOccurred(appointment.date, appointment.time);
      if (!alreadyOccurred) {
        return res.status(400).json({
          error: 'Não é permitido marcar como Concluído um agendamento cuja data ou horário ainda não tenha ocorrido.'
        });
      }
    }

    const updated = dbInstance.updateAppointmentStatus(req.params.appointmentId, status);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// GESTÃO DE HORÁRIOS E INTERVALOS
// ==========================================
apiRouter.get('/admin/operating-hours', (_req: Request, res: Response) => {
  res.json(dbInstance.getOperatingHours());
});

apiRouter.put('/admin/operating-hours', (req: Request, res: Response) => {
  try {
    const updated = dbInstance.updateOperatingHours(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// BLOQUEIOS E FOLGAS
// ==========================================
apiRouter.get('/admin/blockouts', (_req: Request, res: Response) => {
  res.json(dbInstance.getBlockouts());
});

apiRouter.post('/admin/blockouts', (req: Request, res: Response) => {
  try {
    const { professionalId, date, allDay, startTime, endTime, reason } = req.body;
    if (!date || !reason?.trim()) {
      return res.status(400).json({ error: 'Data e motivo do bloqueio são obrigatórios' });
    }

    const blockout = {
      id: 'blk-' + Date.now(),
      professionalId: professionalId || 'all',
      date,
      allDay: Boolean(allDay),
      startTime: allDay ? undefined : startTime,
      endTime: allDay ? undefined : endTime,
      reason: reason.trim(),
      createdAt: new Date().toISOString(),
    };

    dbInstance.addBlockout(blockout);
    res.status(201).json(blockout);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/admin/blockouts/:id', (req: Request, res: Response) => {
  try {
    const ok = dbInstance.deleteBlockout(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Bloqueio não encontrado' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// CLIENTES (Histórico Agregado)
// ==========================================
apiRouter.get('/admin/clients', (_req: Request, res: Response) => {
  try {
    const appointments = dbInstance.getAppointments();
    const clientMap = new Map<string, {
      name: string;
      phone: string;
      totalAppointments: number;
      totalSpent: number;
      lastAppointmentDate: string;
      appointments: typeof appointments;
    }>();

    for (const app of appointments) {
      const key = app.clientPhone.replace(/\D/g, '') || app.clientName.toLowerCase();
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          name: app.clientName,
          phone: app.clientPhone,
          totalAppointments: 0,
          totalSpent: 0,
          lastAppointmentDate: app.date,
          appointments: [],
        });
      }

      const client = clientMap.get(key)!;
      client.totalAppointments += 1;
      if (app.status !== 'cancelled') {
        client.totalSpent += app.servicePrice;
      }
      if (app.date > client.lastAppointmentDate) {
        client.lastAppointmentDate = app.date;
      }
      client.appointments.push(app);
    }

    const clients = Array.from(clientMap.values()).sort((a, b) => b.totalAppointments - a.totalAppointments);
    res.json(clients);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// CONFIGURAÇÕES DA BARBEARIA
// ==========================================
apiRouter.get('/admin/settings', (_req: Request, res: Response) => {
  const settings = dbInstance.getSettings();
  res.json({
    ...settings,
    adminPasswordHash: '••••••••', // Não expor senha na leitura
  });
});

apiRouter.put('/admin/settings', (req: Request, res: Response) => {
  try {
    const { name, slogan, phone, whatsappMessage, address, slotIntervalMinutes, newPassword } = req.body;
    const updates: any = {};

    if (name) updates.name = name.trim();
    if (slogan) updates.slogan = slogan.trim();
    if (phone) updates.phone = phone.trim();
    if (whatsappMessage) updates.whatsappMessage = whatsappMessage.trim();
    if (address) updates.address = address.trim();
    if (slotIntervalMinutes) updates.slotIntervalMinutes = Number(slotIntervalMinutes);
    if (newPassword && newPassword.trim().length >= 4) {
      updates.adminPasswordHash = newPassword.trim();
    }

    const updated = dbInstance.updateSettings(updates);
    res.json({
      ...updated,
      adminPasswordHash: '••••••••',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
