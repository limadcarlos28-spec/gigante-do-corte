import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Scissors,
  Users,
  Clock,
  UserCheck,
  Settings,
  PlusCircle,
  FlaskConical,
  LogOut
} from 'lucide-react';

export type AdminTab =
  | 'dashboard'
  | 'agenda'
  | 'services'
  | 'professionals'
  | 'operating-hours'
  | 'clients'
  | 'settings';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onOpenManualBooking: () => void;
  onOpenTomorrowTest: () => void;
  onNavigateToProfessional?: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  onOpenManualBooking,
  onOpenTomorrowTest,
  onNavigateToProfessional,
  onLogout,
  children,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'services', label: 'Serviços', icon: Scissors },
    { id: 'professionals', label: 'Profissionais', icon: Users },
    { id: 'operating-hours', label: 'Horários & Folgas', icon: Clock },
    { id: 'clients', label: 'Clientes', icon: UserCheck },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Barra de Ações Rápidas do Administrador */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#161920] p-4 rounded-2xl border border-zinc-800 shadow-md">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-zinc-300">
            Painel do Dono & Gestão Administrativa
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {onNavigateToProfessional && (
            <button
              type="button"
              onClick={onNavigateToProfessional}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold transition cursor-pointer"
              title="Acessar visão restrita da agenda do profissional GIVANILSON"
            >
              <Scissors className="w-4 h-4 text-blue-400" />
              <span>Painel do GIVANILSON</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenTomorrowTest}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold transition"
            title="Executar verificação obrigatória de agendamento de Hoje e Amanhã"
          >
            <FlaskConical className="w-4 h-4 text-purple-400" />
            <span>Teste de Hoje & Amanhã</span>
          </button>

          <button
            type="button"
            onClick={onOpenManualBooking}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold transition shadow-md shadow-amber-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* Abas de Navegação */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-zinc-800 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/10'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo Dinâmico */}
      <div>{children}</div>
    </div>
  );
};
