import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Scissors,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CalendarDays
} from 'lucide-react';
import { Appointment, Professional, AppointmentStatus } from './barbershop.ts';
import { api } from './api.ts';
import {
  formatDatePtBR,
  formatPhone,
  getWhatsAppLink,
  getTodayDateString,
  getTomorrowDateString,
  isToday,
  isTomorrow,
  hasAppointmentTimeOccurred
} from './dateUtils.ts';
interface ProfessionalPanelProps {
  professionals: Professional[];
  currentProfessionalId?: string;
  onNavigateToBooking: () => void;
  onNavigateToAdmin?: () => void;
}

type AgendaFilter = 'today' | 'tomorrow' | 'upcoming' | 'calendar' | 'all';

export const ProfessionalPanel: React.FC<ProfessionalPanelProps> = ({
  professionals,
  currentProfessionalId,
  onNavigateToBooking,
  onNavigateToAdmin,
}) => {
  // Profissional selecionado (padrão: GIVANILSON ou o primeiro ativo)
  const defaultProf =
    professionals.find((p) => p.id === currentProfessionalId) ||
    professionals.find((p) => p.name.toUpperCase().includes('GIVANILSON')) ||
    professionals[0];

  const [selectedProfId, setSelectedProfId] = useState<string>(defaultProf?.id || 'pro-givanilson');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profInfo, setProfInfo] = useState<Professional | null>(defaultProf || null);
  const [activeFilter, setActiveFilter] = useState<AgendaFilter>('tomorrow');
  const [calendarDate, setCalendarDate] = useState<string>(getTodayDateString());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Modal de confirmação de cancelamento
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Notificação local de sucesso
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const loadAppointments = async () => {
    if (!selectedProfId) return;
    setLoading(true);
    try {
      const res = await api.getProfessionalAppointments(selectedProfId, {
        filter: activeFilter === 'calendar' ? 'date' : activeFilter,
        date: activeFilter === 'calendar' ? calendarDate : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setAppointments(res.appointments || []);
      if (res.professional) {
        setProfInfo(res.professional);
      }
    } catch (err: any) {
      console.error('Erro ao buscar agenda do profissional:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [selectedProfId, activeFilter, calendarDate, statusFilter]);

  const handleStatusChange = async (appointmentId: string, newStatus: AppointmentStatus) => {
    setUpdatingId(appointmentId);
    try {
      const updated = await api.updateProfessionalAppointmentStatus(selectedProfId, appointmentId, newStatus);
      setAppointments((prev) =>
        prev.map((app) => (app.id === appointmentId ? { ...app, status: updated.status } : app))
      );
      if (newStatus === 'completed') {
        showFeedback('Atendimento concluído com sucesso!');
      } else if (newStatus === 'cancelled') {
        showFeedback('Agendamento cancelado e horário liberado imediatamente.');
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!appointmentToCancel) return;
    setCancelling(true);
    try {
      await handleStatusChange(appointmentToCancel.id, 'cancelled');
      setAppointmentToCancel(null);
    } finally {
      setCancelling(false);
    }
  };

  // Filtragem local por texto
  const filteredAppointments = appointments.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.clientName.toLowerCase().includes(q) ||
      app.clientPhone.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
      app.serviceName.toLowerCase().includes(q)
    );
  });

  const currentProf = professionals.find((p) => p.id === selectedProfId) || profInfo;

  return (
    <div className="space-y-6">
      {/* Mensagem Toast Local */}
      {feedbackMsg && (
        <div className="fixed top-20 right-5 z-50 p-4 rounded-xl bg-zinc-900 border border-emerald-500/50 text-white shadow-2xl flex items-center gap-2 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Banner de Identificação Exclusiva do Profissional */}
      <div className="bg-gradient-to-r from-[#181b22] via-[#14161b] to-[#121317] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentProf?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
                alt={currentProf?.name || 'Profissional'}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-amber-500/60 shadow-lg shadow-amber-500/10"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#121317] rounded-full" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-bold uppercase tracking-wider mb-1 font-['Oswald']">
                <Scissors className="w-3 h-3" />
                <span>Painel do Profissional</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white font-['Oswald'] uppercase tracking-tight flex items-center gap-2">
                <span>{currentProf?.name || 'GIVANILSON'}</span>
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Visualização restrita da sua agenda e atendimentos vinculados.
              </p>
              {currentProf?.specialties && currentProf.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {currentProf.specialties.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 text-[10px] text-zinc-300 font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Troca de Profissional (para teste de ambiente) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-black/40 p-3 rounded-2xl border border-zinc-800">
            <span className="text-xs text-zinc-400 font-medium">Profissional em exibição:</span>
            <select
              value={selectedProfId}
              onChange={(e) => setSelectedProfId(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.status === 'active' ? '(Ativo)' : '(Inativo)'}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={loadAppointments}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
              title="Atualizar agenda"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Navegação Rápida da Agenda */}
      <div className="bg-[#161920] border border-zinc-800 rounded-2xl p-4 space-y-4 shadow-md">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Botões de Filtro Temporal */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setActiveFilter('today')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeFilter === 'today'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Hoje</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('tomorrow')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeFilter === 'tomorrow'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Amanhã</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('upcoming')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeFilter === 'upcoming'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Próximos</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('calendar')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeFilter === 'calendar'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Calendário</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <span>Todos</span>
            </button>
          </div>

          {/* Campo de Data quando Filtro for Calendário */}
          {activeFilter === 'calendar' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Data:</span>
              <input
                type="date"
                value={calendarDate}
                onChange={(e) => setCalendarDate(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {/* Filtro por Status */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">Todos os Status</option>
              <option value="confirmed">Confirmados</option>
              <option value="completed">Concluídos</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </div>
        </div>

        {/* Barra de Pesquisa de Cliente */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar por nome do cliente, serviço ou telefone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>
      </div>

      {/* Contador de Agendamentos */}
      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <span>
          Exibindo <strong className="text-amber-400">{filteredAppointments.length}</strong> agendamento(s) para{' '}
          <strong className="text-white">{currentProf?.name || 'GIVANILSON'}</strong>
        </span>
        <span className="text-[11px] text-zinc-500">
          * Horários e clientes restritos exclusivamente a este profissional
        </span>
      </div>

      {/* Lista de Cards de Agendamentos */}
      {loading ? (
        <div className="p-12 text-center bg-[#161920] border border-zinc-800 rounded-2xl">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mx-auto mb-2" />
          <p className="text-xs text-zinc-400">Carregando seus agendamentos...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="p-12 text-center bg-[#161920] border border-zinc-800 rounded-2xl space-y-3">
          <Calendar className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold text-zinc-300 font-['Oswald'] uppercase">
            Nenhum agendamento encontrado
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Não há agendamentos atribuídos ao profissional {currentProf?.name} para o filtro selecionado.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAppointments.map((app) => {
            const isOccurred = hasAppointmentTimeOccurred(app.date, app.time);
            const isAptToday = isToday(app.date);
            const isAptTomorrow = isTomorrow(app.date);

            // Mensagem amigável para contato via WhatsApp
            const whatsAppMessage = `Olá, ${app.clientName}! Aqui é o ${app.professionalName} da Barbearia Gigante do Corte. Estou entrando em contato sobre o seu agendamento de ${app.serviceName} marcado para ${formatDatePtBR(app.date)} às ${app.time}.`;
            const whatsAppLink = getWhatsAppLink(app.clientPhone, whatsAppMessage);

            return (
              <div
                key={app.id}
                className={`bg-[#161920] border rounded-2xl p-5 space-y-4 transition hover:border-zinc-700 shadow-md ${
                  app.status === 'cancelled'
                    ? 'border-red-500/20 bg-red-950/5 opacity-75'
                    : app.status === 'completed'
                    ? 'border-emerald-500/30 bg-emerald-950/5'
                    : 'border-zinc-800 hover:border-amber-500/40'
                }`}
              >
                {/* Cabeçalho do Card: Data, Horário e Status */}
                <div className="flex items-start justify-between gap-3 border-b border-zinc-800/80 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base text-amber-400 font-mono">
                        {app.time} às {app.endTime}
                      </span>
                      <span className="text-xs text-zinc-400">({app.durationMinutes} min)</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{formatDatePtBR(app.date, { full: true })}</span>
                      {isAptToday && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                          HOJE
                        </span>
                      )}
                      {isAptTomorrow && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40">
                          AMANHÃ
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Badge de Status */}
                  <div>
                    {app.status === 'confirmed' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/15 border border-blue-500/30 text-blue-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        Confirmado
                      </span>
                    )}
                    {app.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Concluído
                      </span>
                    )}
                    {app.status === 'cancelled' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/15 border border-red-500/30 text-red-400">
                        <XCircle className="w-3.5 h-3.5" />
                        Cancelado
                      </span>
                    )}
                  </div>
                </div>

                {/* Detalhes do Cliente e Serviço */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Cliente */}
                  <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800/80 space-y-1">
                    <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
                      <User className="w-3 h-3 text-amber-400" />
                      Cliente
                    </span>
                    <p className="text-white font-bold text-sm tracking-wide">{app.clientName}</p>
                    <p className="text-zinc-300 font-mono text-xs">{formatPhone(app.clientPhone)}</p>
                  </div>

                  {/* Serviço e Profissional */}
                  <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800/80 space-y-1">
                    <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
                      <Scissors className="w-3 h-3 text-amber-400" />
                      Serviço
                    </span>
                    <p className="text-white font-bold text-sm">{app.serviceName}</p>
                    <p className="text-zinc-400 text-[11px]">
                      Profissional: <strong className="text-amber-400">{app.professionalName}</strong>
                    </p>
                  </div>
                </div>

                {/* Observações do Cliente se houver */}
                {app.clientNotes && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-2.5 text-xs text-zinc-300">
                    <span className="text-amber-400 font-semibold">Obs:</span> {app.clientNotes}
                  </div>
                )}

                {/* Ações: WhatsApp + Concluir + Cancelar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/80">
                  {/* Botão de WhatsApp */}
                  <a
                    href={whatsAppLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 text-xs font-bold transition cursor-pointer"
                    title={`Abrir conversa no WhatsApp com ${app.clientName}`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp do Cliente</span>
                  </a>

                  {/* Botões Operacionais com as regras mantidas */}
                  <div className="flex items-center gap-2">
                    {app.status !== 'completed' && (
                      isOccurred ? (
                        <button
                          type="button"
                          disabled={updatingId === app.id}
                          onClick={() => handleStatusChange(app.id, 'completed')}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                          title="Marcar atendimento como Concluído"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Concluir</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={true}
                          className="px-3 py-2 rounded-xl bg-zinc-800/60 border border-zinc-700/50 text-zinc-500 text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed opacity-50"
                          title="Não é permitido concluir agendamentos futuros. Disponível apenas após a ocorrência da data e horário."
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Concluir</span>
                        </button>
                      )
                    )}

                    {app.status !== 'cancelled' && (
                      <button
                        type="button"
                        disabled={updatingId === app.id}
                        onClick={() => setAppointmentToCancel(app)}
                        className="px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-400 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        title="Cancelar este agendamento"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancelar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Confirmação de Cancelamento para o Profissional */}
      {appointmentToCancel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#181a20] border border-red-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-['Oswald'] uppercase tracking-wide">
                  Confirmar Cancelamento
                </h3>
                <p className="text-xs text-zinc-400">Liberar horário na agenda</p>
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
                <span className="text-zinc-200">{appointmentToCancel.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Profissional:</span>
                <span className="text-zinc-200">{appointmentToCancel.professionalName}</span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Deseja confirmar o cancelamento deste agendamento? O status será alterado para <strong className="text-red-400">CANCELADO</strong> e o horário das <strong>{appointmentToCancel.time}</strong> será liberado imediatamente para novos agendamentos.
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
