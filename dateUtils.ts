/**
 * Utilitários robustos de manipulação de data e horário sem problemas de fuso horário UTC.
 * Todas as datas de agendamento são tratadas na string estrita 'YYYY-MM-DD'.
 */

export function formatLocalDate(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayDateString(): string {
  return formatLocalDate(new Date());
}

export function getTomorrowDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatLocalDate(d);
}

export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function isToday(dateStr: string): boolean {
  return dateStr === getTodayDateString();
}

export function isTomorrow(dateStr: string): boolean {
  return dateStr === getTomorrowDateString();
}

export function isPastDate(dateStr: string): boolean {
  return dateStr < getTodayDateString();
}

export function getDayOfWeekKey(dateStr: string): 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' {
  const date = parseDateString(dateStr);
  const days: ('sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday')[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday'
  ];
  return days[date.getDay()];
}

export function formatDatePtBR(dateStr: string, options?: { showDayOfWeek?: boolean; full?: boolean }): string {
  if (!dateStr) return '';
  const date = parseDateString(dateStr);
  
  const dayOfWeek = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado'
  ][date.getDay()];

  const dayOfWeekShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][date.getDay()];

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const monthsShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const monthShort = monthsShort[date.getMonth()];
  const year = date.getFullYear();

  if (isToday(dateStr)) {
    return `Hoje (${day}/${String(date.getMonth() + 1).padStart(2, '0')})`;
  }

  if (isTomorrow(dateStr)) {
    return `Amanhã (${day}/${String(date.getMonth() + 1).padStart(2, '0')})`;
  }

  if (options?.full) {
    return `${dayOfWeek}, ${day} de ${month} de ${year}`;
  }

  if (options?.showDayOfWeek) {
    return `${dayOfWeekShort}, ${day} ${monthShort}`;
  }

  return `${day}/${String(date.getMonth() + 1).padStart(2, '0')}/${year}`;
}

/**
 * Converte "HH:mm" para minutos desde 00:00
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Converte minutos desde 00:00 para "HH:mm"
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Adiciona duração em minutos a um horário "HH:mm"
 */
export function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  const totalMin = timeToMinutes(timeStr) + minutesToAdd;
  return minutesToTime(totalMin);
}

/**
 * Verifica se dois intervalos [startA, endA) e [startB, endB) colidem
 */
export function intervalsOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const sA = timeToMinutes(startA);
  const eA = timeToMinutes(endA);
  const sB = timeToMinutes(startB);
  const eB = timeToMinutes(endB);
  return Math.max(sA, sB) < Math.min(eA, eB);
}

/**
 * Formata telefone brasileiro para exibição
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

/**
 * Retorna link seguro de WhatsApp
 */
export function getWhatsAppLink(phone: string, text?: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('55') && (cleaned.length === 10 || cleaned.length === 11)) {
    cleaned = '55' + cleaned;
  }
  const encodedText = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${cleaned}${encodedText}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

/**
 * Verifica se a data e horário de um agendamento já ocorreram em relação ao momento atual.
 * - Se a data for anterior a hoje: já ocorreu (true).
 * - Se a data for futura (após hoje): ainda não ocorreu (false).
 * - Se for hoje: compara o horário de início com o horário atual do relógio.
 */
export function hasAppointmentTimeOccurred(dateStr: string, timeStr: string): boolean {
  const today = getTodayDateString();
  if (dateStr < today) {
    return true;
  }
  if (dateStr > today) {
    return false;
  }
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const appointmentMinutes = timeToMinutes(timeStr);
  return currentMinutes >= appointmentMinutes;
}
