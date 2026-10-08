import React from 'react';
import { CheckCircle, Calendar, MessageSquare, PlusCircle, Clock, User, Scissors } from 'lucide-react';
import { Appointment, BarbershopSettings } from './barbershop.ts';
import { formatDatePtBR, formatCurrency, getWhatsAppLink } from './dateUtils.ts';

interface BookingSuccessProps {
  appointment: Appointment;
  settings?: BarbershopSettings;
  onNewBooking: () => void;
}

export const BookingSuccess: React.FC<BookingSuccessProps> = ({
  appointment,
  settings,
  onNewBooking,
}) => {
  // Criar link do Google Calendar
  const googleCalendarUrl = React.useMemo(() => {
    const [year, month, day] = appointment.date.split('-');
    const [startH, startM] = appointment.time.split(':');
    const [endH, endM] = appointment.endTime.split(':');

    // Formato YYYYMMDDTHHmmSS
    const startIso = `${year}${month}${day}T${startH}${startM}00`;
    const endIso = `${year}${month}${day}T${endH}${endM}00`;

    const title = encodeURIComponent(`${appointment.serviceName} - ${settings?.name || 'GIGANTE DO CORTE'}`);
    const details = encodeURIComponent(
      `Agendamento confirmado com o profissional ${appointment.professionalName}.\nValor: ${formatCurrency(appointment.servicePrice)}`
    );
    const location = encodeURIComponent(settings?.address || 'Av. Antonio Ramos, 26 – Alto da Saudade, São Caetano-PE');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
  }, [appointment, settings]);

  const barbershopWhatsAppUrl = React.useMemo(() => {
    const phone = settings?.phone || '(81) 99474-1304';
    const msg = `Olá! Acabei de fazer um agendamento na Gigante do Corte para ${formatDatePtBR(appointment.date)} às ${appointment.time} (${appointment.serviceName}) com ${appointment.professionalName}.`;
    return getWhatsAppLink(phone, msg);
  }, [appointment, settings]);

  return (
    <div className="text-center py-6 sm:py-8 max-w-lg mx-auto space-y-6">
      {/* Animação e Ícone de Sucesso */}
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 shadow-xl shadow-emerald-500/10 animate-bounce">
        <CheckCircle className="w-10 h-10 stroke-[2.5]" />
      </div>

      <div>
        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          Sucesso
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-3 font-['Oswald'] uppercase tracking-wide">
          Agendamento confirmado!
        </h1>
        <p className="text-base sm:text-lg text-emerald-300 font-semibold mt-1">
          Seu horário já foi reservado.
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          O barbeiro já foi notificado e o horário foi bloqueado no sistema.
        </p>
      </div>

      {/* Cartão de Detalhes */}
      <div className="bg-[#181a20] border border-zinc-700/80 rounded-2xl p-5 text-left shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Comprovante
          </span>
          <span className="text-xs font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            #{appointment.id.slice(-6).toUpperCase()}
          </span>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 flex items-center gap-1.5 text-xs">
              <Scissors className="w-3.5 h-3.5 text-amber-400" />
              Serviço:
            </span>
            <span className="font-bold text-white">{appointment.serviceName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400 flex items-center gap-1.5 text-xs">
              <User className="w-3.5 h-3.5 text-amber-400" />
              Profissional:
            </span>
            <span className="font-semibold text-zinc-200">{appointment.professionalName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400 flex items-center gap-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Data:
            </span>
            <span className="font-bold text-white">
              {formatDatePtBR(appointment.date, { showDayOfWeek: true })}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400 flex items-center gap-1.5 text-xs">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Horário:
            </span>
            <span className="font-extrabold text-amber-400 font-['Oswald'] text-base">
              {appointment.time} às {appointment.endTime}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <span className="text-zinc-400 text-xs">Valor a pagar no local:</span>
            <span className="text-lg font-black text-white font-['Oswald']">
              {formatCurrency(appointment.servicePrice)}
            </span>
          </div>
        </div>

        <div className="bg-black/30 p-3 rounded-xl border border-zinc-800 text-xs text-zinc-400">
          <p>
            <strong className="text-zinc-200">Cliente:</strong> {appointment.clientName}
          </p>
          <p className="mt-0.5">
            <strong className="text-zinc-200">Telefone:</strong> {appointment.clientPhone}
          </p>
        </div>
      </div>

      {/* Ações pós-agendamento */}
      <div className="space-y-2.5">
        <a
          href={googleCalendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition"
        >
          <Calendar className="w-4 h-4 text-amber-400" />
          <span>Adicionar ao Google Agenda</span>
        </a>

        <a
          href={barbershopWhatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 text-sm font-semibold flex items-center justify-center gap-2 transition"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Falar com a Barbearia no WhatsApp</span>
        </a>

        <button
          onClick={onNewBooking}
          className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold flex items-center justify-center gap-2 transition shadow-md shadow-amber-500/20 mt-4 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Agendar Outro Horário</span>
        </button>
      </div>
    </div>
  );
};
