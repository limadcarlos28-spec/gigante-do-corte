import React, { useState, useEffect } from 'react';
import {
  Calendar,
  DollarSign,
  Users,
  Clock,
  ArrowRight,
  PlusCircle,
  FlaskConical,
  CheckCircle,
  MessageSquare,
  Scissors
} from 'lucide-react';
import { api, DashboardStats } from './api.ts'
import { formatDatePtBR, formatCurrency, formatPhone, getWhatsAppLink, getTodayDateString, getTomorrowDateString } from './dateUtils.ts';
import { AdminTab } from './AdminLayout.tsx';

interface DashboardViewProps {
  onNavigateTab: (tab: AdminTab) => void;
  onOpenManualBooking: () => void;
  onOpenTomorrowTest: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenManualBooking,
  onOpenTomorrowTest,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const todayStr = getTodayDateString();
  const tomorrowStr = getTomorrowDateString();

  return (
    <div className="space-y-6">
      {/* Banner de Boas-Vindas & Atalho do Teste Obrigatório */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#181a20] to-[#181a20] border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <span className="px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wider bg-amber-500 text-black font-['Oswald']">
            Visão Geral
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1.5 font-['Oswald'] uppercase tracking-wide">
            Dashboard da Barbearia
          </h2>
          <p className="text-xs text-zinc-400">
            Acompanhe a movimentação de hoje ({todayStr.split('-')[2]}/{todayStr.split('-')[1]}) e amanhã ({tomorrowStr.split('-')[2]}/{tomorrowStr.split('-')[1]}).
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenTomorrowTest}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition cursor-pointer"
          >
            <FlaskConical className="w-4 h-4" />
            <span>Executar Teste de Amanhã</span>
          </button>

          <button
            type="button"
            onClick={onOpenManualBooking}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* Grid de Métricas Principais */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Atendimentos de Hoje */}
        <div
          onClick={() => onNavigateTab('agenda')}
          className="p-4 rounded-2xl bg-[#181a20] border border-zinc-800 hover:border-amber-500/50 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Hoje</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-['Oswald']">
            {loading ? '...' : stats?.todayCount ?? 0}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            Atendimentos agendados
          </span>
        </div>

        {/* Atendimentos de Amanhã */}
        <div
          onClick={() => onNavigateTab('agenda')}
          className="p-4 rounded-2xl bg-[#181a20] border border-zinc-800 hover:border-purple-500/50 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Amanhã</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-['Oswald']">
            {loading ? '...' : stats?.tomorrowCount ?? 0}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            Atendimentos agendados
          </span>
        </div>

        {/* Próximos Agendamentos */}
        <div
          onClick={() => onNavigateTab('agenda')}
          className="p-4 rounded-2xl bg-[#181a20] border border-zinc-800 hover:border-blue-500/50 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Próximos</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-['Oswald']">
            {loading ? '...' : stats?.upcomingCount ?? 0}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            Total futuro
          </span>
        </div>

        {/* Faturamento Estimado do Dia */}
        <div className="p-4 rounded-2xl bg-[#181a20] border border-zinc-800 transition">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Faturamento Hoje</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-['Oswald']">
            {loading ? '...' : formatCurrency(stats?.estimatedTodayRevenue ?? 0)}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            Estimado de hoje
          </span>
        </div>

        {/* Quantidade de Clientes */}
        <div
          onClick={() => onNavigateTab('clients')}
          className="p-4 rounded-2xl bg-[#181a20] border border-zinc-800 hover:border-amber-500/50 cursor-pointer transition group col-span-2 lg:col-span-1"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Clientes</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-['Oswald']">
            {loading ? '...' : stats?.totalClientsCount ?? 0}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            Cadastrados na base
          </span>
        </div>
      </div>

      {/* Agenda Resumida dos Próximos Atendimentos */}
      <div className="bg-[#181a20] rounded-2xl border border-zinc-800 p-5 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white font-['Oswald'] uppercase tracking-wide">
              Agenda Resumida
            </h3>
            <p className="text-xs text-zinc-400">
              Próximos horários na fila de atendimento
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('agenda')}
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition"
          >
            <span>Ver Agenda Completa</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-zinc-500">Carregando fila...</div>
        ) : !stats?.nextAppointments || stats.nextAppointments.length === 0 ? (
          <div className="py-8 text-center bg-zinc-900/50 rounded-xl border border-zinc-800/80">
            <Calendar className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs text-zinc-400">
              Nenhum agendamento futuro no momento.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {stats.nextAppointments.map((app) => {
              const waUrl = getWhatsAppLink(
                app.clientPhone,
                `Olá ${app.clientName}! Confirmando seu horário de ${app.serviceName} às ${app.time} na Gigante do Corte.`
              );

              return (
                <div key={app.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-700/80 text-center min-w-[65px]">
                      <span className="font-['Oswald'] font-black text-amber-400 text-sm block leading-none">
                        {app.time}
                      </span>
                      <span className="text-[9px] text-zinc-400 block mt-0.5">
                        {formatDatePtBR(app.date)}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{app.clientName}</span>
                        <span
                          className={`px-1.5 py-0.2 text-[9px] font-bold rounded uppercase ${
                            app.status === 'confirmed'
                              ? 'bg-blue-500/10 text-blue-400'
                              : app.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {app.status === 'confirmed' ? 'Confirmado' : app.status === 'completed' ? 'Concluído' : 'Cancelado'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-zinc-400 mt-0.5">
                        <span className="text-zinc-300 font-medium">{app.serviceName}</span>
                        <span>•</span>
                        <span>{app.professionalName}</span>
                        <span>•</span>
                        <span className="text-amber-400 font-bold">{formatCurrency(app.servicePrice)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 transition"
                      title="Chamar no WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
