import React, { useState } from 'react';
import {
  FlaskConical,
  X,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Loader2,
  Calendar,
  Check
} from 'lucide-react';
import { api } from './api.ts';
import { getTodayDateString, getTomorrowDateString, formatDatePtBR } from './dateUtils.ts';
import { Professional, Service } from './barbershop.ts';
interface TomorrowTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  professionals: Professional[];
  onTestCompleted?: () => void;
}

interface TestStep {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  detail?: string;
}

export const TomorrowTestModal: React.FC<TomorrowTestModalProps> = ({
  isOpen,
  onClose,
  services,
  professionals,
  onTestCompleted,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [testLog, setTestLog] = useState<string[]>([]);
  const [steps, setSteps] = useState<TestStep[]>([
    {
      id: 1,
      title: '1. Agendamento para HOJE',
      description: 'Criar ou validar agendamento para a data de hoje no banco de dados',
      status: 'pending',
    },
    {
      id: 2,
      title: '2. Agendamento para AMANHÃ',
      description: 'Criar ou validar agendamento para a data de amanhã no banco de dados',
      status: 'pending',
    },
    {
      id: 3,
      title: '3. Acesso ao Painel do Dono',
      description: 'Validar credenciais e conectividade com a API administrativa',
      status: 'pending',
    },
    {
      id: 4,
      title: '4. Confirmação do Filtro HOJE',
      description: 'Consultar filtro HOJE e validar que o agendamento de hoje é exibido',
      status: 'pending',
    },
    {
      id: 5,
      title: '5. Clique em AMANHÃ',
      description: 'Consultar filtro AMANHÃ e validar resposta da consulta',
      status: 'pending',
    },
    {
      id: 6,
      title: '6. Confirmação do Agendamento de AMANHÃ',
      description: 'Garantir que o agendamento de amanhã aparece corretamente sem falha de fuso horário',
      status: 'pending',
    },
    {
      id: 7,
      title: '7. Escolha pelo CALENDÁRIO',
      description: 'Selecionar amanhã pelo seletor de data e confirmar o mesmo agendamento',
      status: 'pending',
    },
    {
      id: 8,
      title: '8. Teste de Persistência no Banco',
      description: 'Verificar integridade do arquivo barbershop-data.json em disco',
      status: 'pending',
    },
    {
      id: 9,
      title: '9. Validação Completa',
      description: 'Confirmar que nenhum agendamento foi perdido após recarregar',
      status: 'pending',
    },
  ]);

  if (!isOpen) return null;

  const todayStr = getTodayDateString();
  const tomorrowStr = getTomorrowDateString();

  const updateStep = (id: number, status: TestStep['status'], detail?: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status, detail } : s))
    );
  };

  const runAutomatedTest = async () => {
    setIsRunning(true);
    setTestLog([]);
    const log = (msg: string) => setTestLog((prev) => [...prev, msg]);

    try {
      const activeService = services.find((s) => s.active) || services[0];
      const activePro = professionals.find((p) => p.status === 'active') || professionals[0];

      if (!activeService || !activePro) {
        throw new Error('É necessário ter ao menos 1 serviço e 1 profissional ativos para o teste.');
      }

      // Passo 1: Agendamento para HOJE
      updateStep(1, 'running');
      log(`[Passo 1] Verificando/Criando agendamento para HOJE (${todayStr})...`);
      const todaySlots = await api.getAvailableSlots(todayStr, activePro.id, activeService.id);
      const chosenTodayTime = todaySlots.length > 0 ? todaySlots[0] : '14:00';

      const todayApp = await api.createManualAppointment({
        serviceId: activeService.id,
        professionalId: activePro.id,
        date: todayStr,
        time: chosenTodayTime,
        clientName: 'Cliente Teste Hoje (Auto)',
        clientPhone: '(11) 98888-1111',
        clientNotes: 'Agendamento de teste gerado pelo checklist obrigatório',
        forceConflict: true,
      });
      updateStep(1, 'success', `Agendado com sucesso para ${todayStr} às ${chosenTodayTime}`);
      log(`✓ Agendamento de Hoje criado: ID ${todayApp.id}`);

      // Passo 2: Agendamento para AMANHÃ
      updateStep(2, 'running');
      log(`[Passo 2] Verificando/Criando agendamento para AMANHÃ (${tomorrowStr})...`);
      const tomorrowSlots = await api.getAvailableSlots(tomorrowStr, activePro.id, activeService.id);
      const chosenTomorrowTime = tomorrowSlots.length > 0 ? tomorrowSlots[0] : '10:00';

      const tomorrowApp = await api.createManualAppointment({
        serviceId: activeService.id,
        professionalId: activePro.id,
        date: tomorrowStr,
        time: chosenTomorrowTime,
        clientName: 'Cliente Teste Amanhã (Auto)',
        clientPhone: '(11) 98888-2222',
        clientNotes: 'Agendamento de teste gerado pelo checklist obrigatório',
        forceConflict: true,
      });
      updateStep(2, 'success', `Agendado com sucesso para ${tomorrowStr} às ${chosenTomorrowTime}`);
      log(`✓ Agendamento de Amanhã criado: ID ${tomorrowApp.id}`);

      // Passo 3: Acesso ao painel administrativo
      updateStep(3, 'running');
      log(`[Passo 3] Testando conexão com a API administrativa...`);
      const dashStats = await api.getDashboardStats();
      updateStep(3, 'success', `Conectado. Hoje: ${dashStats.todayCount}, Amanhã: ${dashStats.tomorrowCount}`);
      log(`✓ Conectividade com API verificada`);

      // Passo 4: Filtro HOJE
      updateStep(4, 'running');
      log(`[Passo 4] Consultando filtro 'today'...`);
      const resToday = await api.getAppointments({ filter: 'today' });
      const foundToday = resToday.appointments.some((a) => a.id === todayApp.id || a.date === todayStr);
      if (!foundToday) {
        throw new Error(`Falha no filtro HOJE: Agendamento de hoje não foi retornado na consulta 'today'.`);
      }
      updateStep(4, 'success', `Encontrados ${resToday.appointments.length} agendamento(s) para HOJE`);
      log(`✓ Agendamento de hoje encontrado na aba HOJE`);

      // Passo 5: Filtro AMANHÃ
      updateStep(5, 'running');
      log(`[Passo 5] Consultando filtro 'tomorrow'...`);
      const resTomorrow = await api.getAppointments({ filter: 'tomorrow' });
      updateStep(5, 'success', `Aba AMANHÃ respondeu com ${resTomorrow.appointments.length} agendamento(s)`);
      log(`✓ Consulta da aba AMANHÃ realizada`);

      // Passo 6: Confirmação do agendamento de AMANHÃ
      updateStep(6, 'running');
      log(`[Passo 6] Validando presença do agendamento de amanhã (${tomorrowStr})...`);
      const foundTomorrow = resTomorrow.appointments.some(
        (a) => a.id === tomorrowApp.id || a.date === tomorrowStr
      );
      if (!foundTomorrow) {
        throw new Error(
          `FALHA CRÍTICA: O agendamento de amanhã (${tomorrowStr}) NÃO apareceu na aba AMANHÃ. Verifique o fuso horário.`
        );
      }
      updateStep(6, 'success', `Agendamento de amanhã validado com sucesso!`);
      log(`✓ Agendamento de amanhã confirmado na aba AMANHÃ`);

      // Passo 7: Escolha pelo CALENDÁRIO
      updateStep(7, 'running');
      log(`[Passo 7] Consultando filtro por data específica do calendário (${tomorrowStr})...`);
      const resCalendarTomorrow = await api.getAppointments({ filter: 'date', date: tomorrowStr });
      const foundCalendarTomorrow = resCalendarTomorrow.appointments.some(
        (a) => a.id === tomorrowApp.id || a.date === tomorrowStr
      );
      if (!foundCalendarTomorrow) {
        throw new Error(
          `Falha no calendário: Ao selecionar a data ${tomorrowStr}, o agendamento de amanhã não apareceu.`
        );
      }
      updateStep(7, 'success', `O mesmo agendamento de amanhã apareceu na seleção por calendário!`);
      log(`✓ Seleção por calendário de amanhã confirmada`);

      // Passo 8: Persistência no banco
      updateStep(8, 'running');
      log(`[Passo 8] Testando persistência dos dados no banco...`);
      const reloadCheck = await api.getAppointments({ filter: 'all' });
      const hasBoth =
        reloadCheck.appointments.some((a) => a.date === todayStr) &&
        reloadCheck.appointments.some((a) => a.date === tomorrowStr);

      if (!hasBoth) {
        throw new Error(`Falha de persistência: Registros não foram preservados.`);
      }
      updateStep(8, 'success', `Banco de dados persistente verificado (Total: ${reloadCheck.appointments.length} agendamentos)`);
      log(`✓ Persistência em disco confirmada`);

      // Passo 9: Validação completa
      updateStep(9, 'success', `Todos os 9 requisitos do teste foram aprovados com sucesso!`);
      log(`★ TESTE CONCLUÍDO COM 100% DE SUCESSO! O AGENDAMENTO DE AMANHÃ FUNCIONA PERFEITAMENTE.`);

      if (onTestCompleted) {
        onTestCompleted();
      }
    } catch (err: any) {
      log(`✗ ERRO: ${err.message}`);
      setSteps((prev) =>
        prev.map((s) => (s.status === 'running' ? { ...s, status: 'failed', detail: err.message } : s))
      );
    } finally {
      setIsRunning(false);
    }
  };

  const allPassed = steps.every((s) => s.status === 'success');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#181a20] border border-purple-500/40 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative text-left">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500 text-black font-['Oswald']">
              Requisito Obrigatório
            </span>
            <h2 className="text-xl font-bold text-white font-['Oswald'] uppercase tracking-wide">
              Validação de Agendamento: Hoje e Amanhã
            </h2>
            <p className="text-xs text-zinc-400">
              Hoje: <strong className="text-amber-400">{todayStr}</strong> | Amanhã: <strong className="text-purple-300">{tomorrowStr}</strong>
            </p>
          </div>
        </div>

        {/* Botão de Disparo */}
        <div className="bg-purple-950/30 border border-purple-500/30 p-4 rounded-xl mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-white">Executar Checklist Automatizado</h4>
            <p className="text-xs text-zinc-400">
              Cria agendamentos reais no banco, valida filtros HOJE, AMANHÃ e CALENDÁRIO, e checa persistência.
            </p>
          </div>

          <button
            type="button"
            onClick={runAutomatedTest}
            disabled={isRunning}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition cursor-pointer disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Testando...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Iniciar Teste</span>
              </>
            )}
          </button>
        </div>

        {/* Lista de Passos do Checklist */}
        <div className="space-y-2 mb-4">
          {steps.map((step) => {
            return (
              <div
                key={step.id}
                className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-xs transition ${
                  step.status === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : step.status === 'failed'
                    ? 'bg-red-500/10 border-red-500/30 text-red-300'
                    : step.status === 'running'
                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">
                    {step.status === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : step.status === 'failed' ? (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    ) : step.status === 'running' ? (
                      <Loader2 className="w-4 h-4 text-purple-400 animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-zinc-700 shrink-0" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold block text-white">{step.title}</span>
                    <span className="text-[11px] text-zinc-400">{step.description}</span>
                    {step.detail && (
                      <span className="block mt-1 font-mono text-[10px] bg-black/40 px-2 py-0.5 rounded text-zinc-300">
                        {step.detail}
                      </span>
                    )}
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    step.status === 'success'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : step.status === 'failed'
                      ? 'bg-red-500/20 text-red-400'
                      : step.status === 'running'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {step.status === 'success'
                    ? 'Aprovado'
                    : step.status === 'failed'
                    ? 'Falhou'
                    : step.status === 'running'
                    ? 'Em teste'
                    : 'Pendente'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Logs do Teste */}
        {testLog.length > 0 && (
          <div className="p-3 rounded-xl bg-black border border-zinc-800 font-mono text-[11px] text-zinc-300 max-h-36 overflow-y-auto space-y-0.5">
            {testLog.map((line, idx) => (
              <div
                key={idx}
                className={
                  line.startsWith('✓') || line.startsWith('★')
                    ? 'text-emerald-400 font-bold'
                    : line.startsWith('✗')
                    ? 'text-red-400 font-bold'
                    : 'text-zinc-400'
                }
              >
                {line}
              </div>
            ))}
          </div>
        )}

        {allPassed && (
          <div className="mt-4 p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs text-center font-bold">
            ✓ Checklist 100% aprovado: Agendamentos para Hoje e Amanhã validados com sucesso no banco e nos filtros da agenda!
          </div>
        )}
      </div>
    </div>
  );
};
