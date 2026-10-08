import React, { useState, useEffect } from 'react';
import {
  Scissors,
  Calendar,
  Shield,
  MapPin,
  Clock,
  Phone,
  Star,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { api, BootstrapResponse } from './api.ts';
import { Service, Professional, BarbershopSettings, OperatingHoursConfig, Appointment } from './types/barbershop.ts';
import { Navbar } from './Navbar.tsx';
import { BookingWizard } from './BookingWizard.tsx';
import { AdminLayout, AdminTab } from './AdminLayout.tsx';
import { AdminLoginModal } from './AdminLoginModal.tsx';
import { DashboardView } from './DashboardView.tsx';
import { AgendaView } from './AgendaView.tsx';
import { ServicesView } from './ServicesView.tsx';
  
import { ProfessionalsView } from './ProfessionalsView.tsx';
import { OperatingHoursView } from './OperatingHoursView.tsx';
import { ClientsView } from './ClientsView.tsx';
import { SettingsView } from './SettingsView.tsx';
import { ManualBookingModal } from './ManualBookingModal.tsx';
import { TomorrowTestModal } from './TomorrowTestModal.tsx';
import { ProfessionalPanel } from './ProfessionalPanel.tsx';
import { formatPhone, getWhatsAppLink } from './dateUtils.ts';
export default function App() {
  const [data, setData] = useState<BootstrapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Navegação
  const [activeView, setActiveView] = useState<'booking' | 'admin' | 'professional'>('admin');
  const [adminTab, setAdminTab] = useState<AdminTab>('agenda');

  // Autenticação Admin (aberto diretamente no Painel do Dono)
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem('gigante_admin_token') || 'admin-authenticated';
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Modais do Painel
  const [isManualBookingOpen, setIsManualBookingOpen] = useState(false);
  const [isTomorrowTestOpen, setIsTomorrowTestOpen] = useState(false);

  // Notificação Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const boot = await api.getBootstrapData();
      setData(boot);
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar ao servidor da barbearia');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdminLogin = (token: string) => {
    setAdminToken(token);
    setActiveView('admin');
    showToast('Acesso administrativo liberado com sucesso.');
  };

  const handleAdminLogout = () => {
    api.logoutAdmin();
    setAdminToken(null);
    setActiveView('booking');
    showToast('Você saiu do painel administrativo.');
  };

  const handleAppointmentCreated = (appointment: Appointment) => {
    showToast(`Agendamento de ${appointment.clientName} reservado com sucesso!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0f13] text-white flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-xl shadow-amber-500/20 mb-4 animate-pulse">
          <Scissors className="w-8 h-8 text-black -rotate-45" />
        </div>
        <h1 className="text-2xl font-black font-['Oswald'] uppercase tracking-widest text-amber-400">
          GIGANTE DO CORTE
        </h1>
        <p className="text-xs text-zinc-400 mt-2 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
          <span>Carregando sistema e banco de dados...</span>
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0d0f13] text-white flex flex-col items-center justify-center p-4 text-center">
        <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500 text-red-400 flex items-center justify-center mb-3">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-['Oswald'] uppercase tracking-wide">
          Não foi possível inicializar o sistema
        </h2>
        <p className="text-xs text-zinc-400 mt-1 max-w-sm">{error}</p>
        <button
          onClick={loadData}
          className="mt-4 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  const { settings, services, professionals, operatingHours } = data;

  return (
    <div className="min-h-screen bg-[#0d0f13] text-zinc-100 flex flex-col selection:bg-amber-500 selection:text-black font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast flutuante */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-xl bg-zinc-900 border border-amber-500/50 text-white shadow-2xl flex items-center gap-2 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navbar Superior */}
      <Navbar
        settings={settings}
        isAdminLoggedIn={Boolean(adminToken)}
        activeView={activeView}
        onNavigateToBooking={() => setActiveView('booking')}
        onOpenAdminLogin={() => setIsLoginModalOpen(true)}
        onNavigateToAdmin={() => setActiveView('admin')}
        onNavigateToProfessional={() => setActiveView('professional')}
        onAdminLogout={handleAdminLogout}
      />

      {/* Barra de Demonstração / Acesso Rápido com 1 clique */}
      <div className="bg-[#12141a] border-b border-zinc-800/80 px-4 py-2 sticky top-[61px] z-30 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold uppercase text-[10px] tracking-wider">
              Ambiente de Demonstração
            </span>
            <span className="text-zinc-400 hidden sm:inline">Acesso rápido:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveView('booking')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeView === 'booking'
                  ? 'bg-zinc-700 text-white font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              Página Pública
            </button>

            <button
              type="button"
              onClick={() => setActiveView('admin')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeView === 'admin'
                  ? 'bg-amber-500 text-black font-bold shadow-xs'
                  : 'text-zinc-400 hover:text-amber-400 hover:bg-zinc-800'
              }`}
            >
              Painel do Dono
            </button>

            <button
              type="button"
              onClick={() => setActiveView('professional')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeView === 'professional'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Painel do GIVANILSON (Profissional)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {activeView === 'booking' ? (
          <div className="space-y-8">
            {/* Banner de Apresentação Hero */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#181b22] to-[#121418] border border-amber-500/20 p-6 sm:p-10 shadow-2xl text-center">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-amber-500/10 blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4 font-['Oswald']">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>A melhor experiência em corte & barba</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight font-['Oswald']">
                  {settings.name}
                </h1>

                <p className="text-sm sm:text-base text-zinc-300 mt-2 font-medium">
                  {settings.slogan}
                </p>

                {/* Badges de Destaque */}
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-6 pt-5 border-t border-zinc-800/80 text-xs text-zinc-300">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Seg a Sáb: 09h às 21h</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <span>{settings.address}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <a
                      href={getWhatsAppLink(settings.phone, 'Olá! Gostaria de tirar uma dúvida sobre os horários.')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-emerald-300 hover:underline"
                    >
                      {formatPhone(settings.phone)}
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* Fluxo de Agendamento em 5 Passos */}
            <section>
              <BookingWizard
                services={services.filter((s: Service) => s.active)}
                professionals={professionals.filter((p: Professional) => p.status === 'active')}
                settings={settings}
                onAppointmentCreated={handleAppointmentCreated}
              />
            </section>
          </div>
        ) : activeView === 'professional' ? (
          /* PAINEL EXCLUSIVO DO PROFISSIONAL */
          <ProfessionalPanel
            professionals={professionals}
            currentProfessionalId="pro-givanilson"
            onNavigateToBooking={() => setActiveView('booking')}
            onNavigateToAdmin={() => setActiveView('admin')}
          />
        ) : (
          /* PAINEL ADMINISTRATIVO DO DONO */
          <AdminLayout
            currentTab={adminTab}
            onSelectTab={setAdminTab}
            onOpenManualBooking={() => setIsManualBookingOpen(true)}
            onOpenTomorrowTest={() => setIsTomorrowTestOpen(true)}
            onNavigateToProfessional={() => setActiveView('professional')}
            onLogout={handleAdminLogout}
          >
            {adminTab === 'dashboard' && (
              <DashboardView
                onNavigateTab={setAdminTab}
                onOpenManualBooking={() => setIsManualBookingOpen(true)}
                onOpenTomorrowTest={() => setIsTomorrowTestOpen(true)}
              />
            )}

            {adminTab === 'agenda' && (
              <AgendaView
                professionals={professionals}
                onOpenManualBooking={() => setIsManualBookingOpen(true)}
                initialFilter="tomorrow"
              />
            )}

            {adminTab === 'services' && (
              <ServicesView
                services={services}
                onRefreshServices={loadData}
              />
            )}

            {adminTab === 'professionals' && (
              <ProfessionalsView
                professionals={professionals}
                onRefreshProfessionals={loadData}
              />
            )}

            {adminTab === 'operating-hours' && (
              <OperatingHoursView
                operatingHours={operatingHours}
                professionals={professionals}
                onRefreshOperatingHours={loadData}
              />
            )}

            {adminTab === 'clients' && <ClientsView />}

            {adminTab === 'settings' && (
              <SettingsView
                settings={settings}
                onRefreshSettings={loadData}
              />
            )}
          </AdminLayout>
        )}
      </main>

      {/* Rodapé Elegante */}
      <footer className="mt-12 border-t border-zinc-800/80 bg-[#0a0c0f] py-8 text-center text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center text-black font-black">
              <Scissors className="w-3.5 h-3.5 -rotate-45" />
            </div>
            <span className="font-bold text-zinc-300 font-['Oswald'] uppercase tracking-wider">
              {settings.name}
            </span>
          </div>

          <div>
            <span>© {new Date().getFullYear()} {settings.name}. Todos os direitos reservados.</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <button
              type="button"
              onClick={() => setActiveView('booking')}
              className="text-zinc-400 hover:text-white transition"
            >
              Agendamento Público
            </button>
            <span className="text-zinc-700">•</span>
            <button
              type="button"
              onClick={() => {
                if (adminToken) {
                  setActiveView('admin');
                } else {
                  setIsLoginModalOpen(true);
                }
              }}
              className="text-zinc-400 hover:text-amber-400 transition"
            >
              Painel do Dono
            </button>
            <span className="text-zinc-700">•</span>
            <button
              type="button"
              onClick={() => setActiveView('professional')}
              className="text-blue-400 hover:underline transition font-semibold"
            >
              Painel do GIVANILSON
            </button>
          </div>
        </div>
      </footer>

      {/* Modais Globais */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleAdminLogin}
      />

      <ManualBookingModal
        isOpen={isManualBookingOpen}
        onClose={() => setIsManualBookingOpen(false)}
        services={services.filter((s: Service) => s.active)}
        professionals={professionals.filter((p: Professional) => p.status === 'active')}
        onBookingCreated={() => {
          showToast('Agendamento manual cadastrado com sucesso!');
          loadData();
        }}
      />

      <TomorrowTestModal
        isOpen={isTomorrowTestOpen}
        onClose={() => setIsTomorrowTestOpen(false)}
        services={services}
        professionals={professionals}
        onTestCompleted={() => {
          showToast('Checklist de agendamento validado com sucesso!');
          loadData();
        }}
      />
    </div>
  );
}
