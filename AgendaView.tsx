import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Scissors,
  Phone,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Plus
} from 'lucide-react';
import { Appointment, AppointmentStatus, Professional } from './barbershop.ts';
import { api } from './api.ts';
import {
  formatDatePtBR,
  formatCurrency,
  formatPhone,
  getWhatsAppLink,
  getTodayDateString,
  getTomorrowDateString,
  isToday,
  isTomorrow,
  hasAppointmentTimeOccurred
} from './dateUtils.ts';

interface AgendaViewProps {
  professionals: Professional[];
  onOpenManualBooking: () => void;
  initialFilter?: AgendaFilterType;
}

export type AgendaFilterType = 'today' | 'tomorrow' | 'upcoming' | 'calendar' | 'all';

export const AgendaView: React.FC<AgendaViewProps> = ({
  professionals,
  onOpenManualBooking,
  initialFilter = 'tomorrow',
}) => {
  const [activeFilter, setActiveFilter] = useState<AgendaFilterType>(initialFilter);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(getTodayDateString());
  const [selectedProfessional, setSelectedProfessional] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Estado para confirmação de cancelamento
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const todayStr = getTodayDateString();
  const tomorrowStr = getTomorrowDateString();

  const loadAppointments = async () => {
    setLoading(true);
    try {
      let filterParam: 'today' | 'tomorrow' | 'upcoming' | 'date' | 'all' = 'today';
      let dateParam: string | undefined = undefined;

      if (activeFilter === 'today') {
        filterParam = 'today';
      } else if (activeFilter === 'tomorrow') {
        filterParam = 'tomorrow';
      } else if (activeFilter === 'upcoming') {
        filterParam = 'upcoming';
      } else if (activeFilter === 'calendar') {
        filterParam = 'date';
        dateParam = selectedCalendarDate;
      } else {
        filterParam = 'all';
      }

      const res = await api.getAppointments({
        filter: filterParam,
        date: dateParam,
        professionalId: selectedProfessional !== 'all' ? selectedProfessional : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
      });

      setAppointments(res.appointments || []);
    } catch (err) {
      console.error('Erro ao carregar agendamentos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [activeFilter, selectedCalendarDate, selectedProfessional, selectedStatus]);

  const handleStatusChange = async (appointmentId: string, newStatus: AppointmentStatus) => {
    setUpdatingId(appointmentId);
    try {
      await api.updateAppointmentStatus(appointmentId, newStatus);
      // Atualizar localmente
      setAppointments((prev) =>
        prev.map((app) => (app.id === appointmentId ? { ...app, status: newStatus } : app))
      );
    } catch (err: any) {
      alert('Erro ao atualizar status: ' + (err.message || 'Tente novamente'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!appointmentToCancel) return;
    const id = appointmentToCancel.id;
    setCancelling(true);
    try {
      await api.updateAppointmentStatus(id, 'cancelled');
      // Atualiza localmente: status vira 'cancelled', excluindo imediatamente do faturamento e liberando slot
      setAppointments((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: 'cancelled' } : app))
      );
      setAppointmentToCancel(null);
    } catch (err: any) {
      console.error('Erro ao cancelar agendamento:', err);
      alert('Erro ao cancelar agendamento: ' + (err.message || 'Tente novamente'));
    } finally {
      setCancelling(false);
    }
  };

  // Filtragem local por texto (busca por nome ou telefone)
  const filteredAppointments = appointments.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.clientName.toLowerCase().includes(q) ||
      app.clientPhone.includes(q) ||
      app.serviceName.toLowerCase().includes(q) ||
      app.professionalName.toLowerCase().includes(q)
    );
  });

  // Estatísticas rápidas da lista atual
  const totalRevenueInView = filteredAppointments
    .filter((a) => a.status !== 'cancelled')
    .reduce((acc, curr) => acc + curr.servicePrice, 0);

  return (
    <div className="space-y-5">
      {/* Título e Ação Rápida */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white font-['Oswald'] uppercase tracking-wide flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-amber-500" />
            Agenda de Atendimentos
          </h2>
          <p className="text-xs text-zinc-400">
            Visualize, filtre e gerencie todos os agendamentos da Gigante do Corte.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadAppointments}
            disabled={loading}
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
            title="Recarregar agendamentos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onOpenManualBooking}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* ABAS OBRIGATÓRIAS: HOJE | AMANHÃ | PRÓXIMOS | CALENDÁRIO */}
      <div className="bg-[#181a20] p-1.5 rounded-2xl border border-zinc-800 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setActiveFilter('today')}
          className={`flex-1 min-w-[90px] py-3 px-3 rounded-xl font-['Oswald'] text-sm tracking-wider font-extrabold transition-all flex flex-col items-center justify-center ${
            activeFilter === 'today'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <span>HOJE</span>
          <span className={`text-[10px] font-sans font-medium ${activeFilter === 'today' ? 'text-black/80' : 'text-zinc-500'}`}>
            {todayStr.split('-')[2]}/{todayStr.split('-')[1]}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('tomorrow')}
          className={`flex-1 min-w-[90px] py-3 px-3 rounded-xl font-['Oswald'] text-sm tracking-wider font-extrabold transition-all flex flex-col items-center justify-center ${
            activeFilter === 'tomorrow'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <span>AMANHÃ</span>
          <span className={`text-[10px] font-sans font-medium ${activeFilter === 'tomorrow' ? 'text-black/80' : 'text-zinc-500'}`}>
            {tomorrowStr.split('-')[2]}/{tomorrowStr.split('-')[1]}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('upcoming')}
          className={`flex-1 min-w-[90px] py-3 px-3 rounded-xl font-['Oswald'] text-sm tracking-wider font-extrabold transition-all flex flex-col items-center justify-center ${
            activeFilter === 'upcoming'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <span>PRÓXIMOS</span>
          <span className={`text-[10px] font-sans font-medium ${activeFilter === 'upcoming' ? 'text-black/80' : 'text-zinc-500'}`}>
            A partir de hoje
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('calendar')}
          className={`flex-1 min-w-[110px] py-3 px-3 rounded-xl font-['Oswald'] text-sm tracking-wider font-extrabold transition-all flex flex-col items-center justify-center ${
            activeFilter === 'calendar'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <span className="flex items-center gap-1">
            <CalendarIcon className="w-3.5 h-3.5" />
            CALENDÁRIO
          </span>
          <span className={`text-[10px] font-sans font-medium ${activeFilter === 'calendar' ? 'text-black/80' : 'text-zinc-500'}`}>
            Data específica
          </span>
        </button>
      </div>

      {/* Seletor de Data quando aba CALENDÁRIO estiver ativa (ou para escolher qualquer dia) */}
      {activeFilter === 'calendar' && (
        <div className="p-4 bg-gradient-to-r from-amber-500/10 via-[#181a20] to-[#181a20] rounded-2xl border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
                Visualizando Agendamentos de:
              </span>
              <span className="text-base font-bold text-white">
                {formatDatePtBR(selectedCalendarDate, { full: true })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="date"
              value={selectedCalendarDate}
              onChange={(e) => e.target.value && setSelectedCalendarDate(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-medium text-sm focus:outline-none focus:border-amber-500 [color-scheme:dark] w-full sm:w-auto"
            />
          </div>
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#181a20] p-3 rounded-2xl border border-zinc-800 text-xs">
        {/* Busca por cliente */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por cliente, serviço..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Filtro por profissional */}
        <div>
          <select
            value={selectedProfessional}
            onChange={(e) => setSelectedProfessional(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Todos os Barbeiros</option>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por status */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Todos os Status</option>
            <option value="confirmed">Confirmados</option>
            <option value="completed">Concluídos</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>
      </div>

      {/* Resumo e Totalizador */}
      <div className="flex items-center justify-between text-xs px-2 text-zinc-400">
        <span>
          Exibindo <strong className="text-white">{filteredAppointments.length}</strong> agendamento(s)
        </span>
        <span>
          Previsão de Faturamento: <strong className="text-amber-400 font-bold">{formatCurrency(totalRevenueInView)}</strong>
        </span>
      </div>

      {/* LISTA DE AGENDAMENTOS ORDENADOS POR HORÁRIO */}
      {loading ? (
        <div className="py-16 text-center bg-[#181a20] rounded-2xl border border-zinc-800">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-zinc-300 font-medium">Carregando agendamentos do banco de dados...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="py-16 px-6 text-center bg-[#181a20] rounded-2xl border border-zinc-800">
          <div className="w-14 h-14 rounded-full bg-zinc-800/80 text-zinc-500 flex items-center justify-center mx-auto mb-3">
            <CalendarIcon className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            Nenhum agendamento encontrado
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            {activeFilter === 'today'
              ? 'Não há agendamentos marcados para Hoje até o momento.'
              : activeFilter === 'tomorrow'
              ? 'Não há agendamentos marcados para Amanhã até o momento.'
              : 'Nenhum agendamento corresponde aos filtros selecionados.'}
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={onOpenManualBooking}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow transition cursor-pointer"
            >
              + Agendar Horário Manualmente
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((app) => {
            const isTodayApp = isToday(app.date);
            const isTomorrowApp = isTomorrow(app.date);
            const whatsAppMsg = `Olá ${app.clientName}! Confirmando seu horário de ${app.serviceName} no dia ${formatDatePtBR(app.date)} às ${app.time} na Gigante do Corte com ${app.professionalName}. Qualquer dúvida estamos à disposição!`;
            const waUrl = getWhatsAppLink(app.clientPhone, whatsAppMsg);

            return (
              <div
                key={app.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  app.status === 'confirmed'
                    ? 'bg-[#181a20] border-zinc-800 hover:border-amber-500/40'
                    : app.status === 'completed'
                    ? 'bg-[#141d18] border-emerald-900/40'
                    : 'bg-[#1e1517] border-red-900/30 opacity-70'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Horário e Data */}
                  <div className="flex items-start gap-3.5">
                    <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-700/80 text-center min-w-[85px]">
                      <span className="text-xl font-black text-amber-400 font-['Oswald'] block leading-none">
                        {app.time}
                      </span>
                      <span className="text-[10px] text-zinc-400 block mt-1">
                        até {app.endTime}
                      </span>
                    </div>

                    <div>
                      {/* Cliente e WhatsApp */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-white">{app.clientName}</h3>

                        {/* Tag de Data */}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isTodayApp
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : isTomorrowApp
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {formatDatePtBR(app.date)}
                        </span>
                      </div>

                      {/* WhatsApp Clicável para abrir conversa direta */}
                      <div className="mt-1 flex items-center gap-2">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline transition"
                          title="Clique para abrir conversa no WhatsApp com este cliente"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{formatPhone(app.clientPhone)}</span>
                        </a>
                      </div>

                      {/* Serviço, Barbeiro, Valor e Duração */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-zinc-300">
                        <span className="flex items-center gap-1 font-semibold text-white">
                          <Scissors className="w-3.5 h-3.5 text-amber-400" />
                          {app.serviceName}
                        </span>

                        <span className="flex items-center gap-1 text-zinc-400">
                          <User className="w-3.5 h-3.5 text-zinc-400" />
                          Barbeiro: <strong className="text-zinc-200">{app.professionalName}</strong>
                        </span>

                        <span className="font-extrabold text-amber-400 font-['Oswald'] text-sm">
                          {formatCurrency(app.servicePrice)}
                        </span>

                        <span className="text-zinc-400">
                          ({app.durationMinutes} min)
                        </span>
                      </div>

                      {app.clientNotes && (
                        <p className="text-xs text-zinc-400 mt-2 bg-black/30 p-2 rounded-lg border border-zinc-800/80 italic">
                          "{app.clientNotes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status e Ações do Barbeiro */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2.5 pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                    {/* Badge de Status Atual */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          app.status === 'confirmed'
                            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                            : app.status === 'completed'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/15 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {app.status === 'confirmed'
                          ? 'Confirmado'
                          : app.status === 'completed'
                          ? 'Concluído'
                          : 'Cancelado'}
                      </span>
                    </div>

                    {/* Botões de Ação de Mudança de Status */}
                    <div className="flex items-center gap-1.5">
                      {app.status !== 'completed' && (
                        hasAppointmentTimeOccurred(app.date, app.time) ? (
                          <button
                            type="button"
                            disabled={updatingId === app.id}
                            onClick={() => handleStatusChange(app.id, 'completed')}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                            title="Marcar atendimento como Concluído"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Concluir</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={true}
                            className="px-2.5 py-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50 text-zinc-500 text-xs font-semibold flex items-center gap-1 cursor-not-allowed opacity-50"
                            title="Não é permitido concluir agendamentos futuros. Disponível apenas após a ocorrência da data e horário."
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Concluir</span>
                          </button>
                        )
                      )}

                      {app.status !== 'cancelled' && (
                        <button
                          type="button"
                          disabled={updatingId === app.id}
                          onClick={() => setAppointmentToCancel(app)}
                          className="px-2.5 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-400 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          title="Cancelar agendamento"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Cancelar</span>
                        </button>
                      )}

                      {app.status === 'cancelled' && (
                        <button
                          type="button"
                          disabled={updatingId === app.id}
                          onClick={() => handleStatusChange(app.id, 'confirmed')}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/40 text-blue-400 text-xs font-semibold flex items-center gap-1 transition"
                          title="Reativar como Confirmado"
                        >
                          Reativar
                        </button>
                      )}

                      {/* Botão rápido para WhatsApp */}
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition"
                        title="Enviar mensagem no WhatsApp do cliente"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Confirmação de Cancelamento */}
      {appointmentToCancel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#181a20] border border-red-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-['Oswald'] uppercase tracking-wide">
                  Cancelar Agendamento
                </h3>
                <p className="text-xs text-zinc-400">Confirmação obrigatória</p>
              </div>
            </div>

            <div className="bg-zinc-900/90 rounded-xl p-4 border border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Cliente:</span>
                <strong className="text-white">{appointmentToCancel.clientName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Data e Horário:</span>
                <strong className="text-amber-400">
                  {formatDatePtBR(appointmentToCancel.date)} às {appointmentToCancel.time}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Serviço:</span>
                <span className="text-zinc-200">
                  {appointmentToCancel.serviceName} ({formatCurrency(appointmentToCancel.servicePrice)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Profissional:</span>
                <span className="text-zinc-200">{appointmentToCancel.professionalName}</span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Tem certeza que deseja cancelar este agendamento? O status será alterado para <strong className="text-red-400">CANCELADO</strong>, o valor de <strong>{formatCurrency(appointmentToCancel.servicePrice)}</strong> será retirado da previsão de faturamento e o horário das <strong>{appointmentToCancel.time}</strong> será liberado imediatamente para novos agendamentos.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setAppointmentToCancel(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer"
              >
                Não, manter
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {cancelling ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Cancelando...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Sim, Cancelar Agendamento</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
