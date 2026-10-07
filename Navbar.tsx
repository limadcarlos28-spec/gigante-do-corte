import React from 'react';
import { Scissors, Shield, Calendar, Clock, MapPin } from 'lucide-react';
import { BarbershopSettings } from '../types/barbershop.ts';

interface NavbarProps {
  settings?: BarbershopSettings;
  isAdminLoggedIn: boolean;
  activeView: 'booking' | 'admin' | 'professional';
  onNavigateToBooking: () => void;
  onOpenAdminLogin: () => void;
  onNavigateToAdmin: () => void;
  onNavigateToProfessional: () => void;
  onAdminLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  isAdminLoggedIn,
  activeView,
  onNavigateToBooking,
  onOpenAdminLogin,
  onNavigateToAdmin,
  onNavigateToProfessional,
  onAdminLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0f1115]/95 backdrop-blur-md border-b border-amber-500/20 shadow-lg shadow-black/50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo & Marca */}
        <div 
          onClick={onNavigateToBooking}
          className="flex items-center gap-3 cursor-pointer group transition"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-black font-black shadow-md shadow-amber-500/20 group-hover:scale-105 transition">
            <Scissors className="w-5 h-5 text-neutral-950 -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-lg sm:text-xl text-white font-['Oswald',sans-serif] uppercase group-hover:text-amber-400 transition">
                {settings?.name || 'GIGANTE DO CORTE'}
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded">
                Barbearia
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              {settings?.slogan || 'Agende seu horário de forma rápida e fácil.'}
            </p>
          </div>
        </div>

        {/* Informações rápidas & Navegação entre Ambientes */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Botão de Agendamento Público */}
          <button
            onClick={onNavigateToBooking}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition cursor-pointer ${
              activeView === 'booking'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-semibold'
                : 'bg-zinc-800/80 hover:bg-zinc-700 border-zinc-700 text-zinc-300'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Agendamento Público</span>
            <span className="sm:hidden">Agendar</span>
          </button>

          {/* Botão Painel do Dono */}
          {isAdminLoggedIn ? (
            <button
              onClick={onNavigateToAdmin}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeView === 'admin'
                  ? 'bg-amber-500 text-black border-amber-500 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/40 text-amber-400'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Painel do Dono</span>
              <span className="sm:hidden">Dono</span>
            </button>
          ) : (
            <button
              onClick={onOpenAdminLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-medium transition cursor-pointer"
              title="Acesso restrito para barbeiro e administração"
            >
              <Shield className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Área do Barbeiro</span>
              <span className="sm:hidden">Admin</span>
            </button>
          )}

          {/* Botão Especial: Painel do Profissional (GIVANILSON) */}
          <button
            onClick={onNavigateToProfessional}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeView === 'professional'
                ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/30'
                : 'bg-blue-500/15 hover:bg-blue-500/25 border-blue-500/40 text-blue-300'
            }`}
            title="Acessar o Painel exclusivo do Profissional (GIVANILSON)"
          >
            <Scissors className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">Painel do Profissional (GIVANILSON)</span>
            <span className="md:hidden">Givanilson</span>
          </button>

          {/* Logout (se em admin) */}
          {activeView === 'admin' && (
            <button
              onClick={onAdminLogout}
              className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-medium transition cursor-pointer"
            >
              Sair
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
