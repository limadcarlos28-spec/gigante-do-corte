import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Plus, Trash2, Check, AlertCircle, Loader2 } from 'lucide-react';
import { OperatingHoursConfig, Blockout, Professional } from '../../types/barbershop.ts';
import { api } from '../../services/api.ts';
import { formatDatePtBR, getTodayDateString } from '../../utils/dateUtils.ts';

interface OperatingHoursViewProps {
  operatingHours: OperatingHoursConfig;
  professionals: Professional[];
  onRefreshOperatingHours: () => void;
}

export const OperatingHoursView: React.FC<OperatingHoursViewProps> = ({
  operatingHours: initialHours,
  professionals,
  onRefreshOperatingHours,
}) => {
  const [hours, setHours] = useState<OperatingHoursConfig>(initialHours);
  const [blockouts, setBlockouts] = useState<Blockout[]>([]);
  const [loadingBlockouts, setLoadingBlockouts] = useState(true);

  const [savingHours, setSavingHours] = useState(false);
  const [hoursSuccess, setHoursSuccess] = useState(false);

  // Formulário de Novo Bloqueio
  const [showBlockoutForm, setShowBlockoutForm] = useState(false);
  const [blockDate, setBlockDate] = useState(getTodayDateString());
  const [blockProId, setBlockProId] = useState('all');
  const [blockAllDay, setBlockAllDay] = useState(true);
  const [blockStart, setBlockStart] = useState('14:00');
  const [blockEnd, setBlockEnd] = useState('16:00');
  const [blockReason, setBlockReason] = useState('');
  const [savingBlockout, setSavingBlockout] = useState(false);

  useEffect(() => {
    setHours(initialHours);
  }, [initialHours]);

  const loadBlockouts = async () => {
    try {
      const data = await api.getBlockouts();
      setBlockouts(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBlockouts(false);
    }
  };

  useEffect(() => {
    loadBlockouts();
  }, []);

  const handleSaveHours = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingHours(true);
    setHoursSuccess(false);
    try {
      await api.updateOperatingHours(hours);
      setHoursSuccess(true);
      onRefreshOperatingHours();
      setTimeout(() => setHoursSuccess(false), 3000);
    } catch (err: any) {
      alert('Erro ao salvar horários: ' + (err.message || ''));
    } finally {
      setSavingHours(false);
    }
  };

  const handleAddBlockout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDate || !blockReason.trim()) return;

    setSavingBlockout(true);
    try {
      await api.createBlockout({
        professionalId: blockProId,
        date: blockDate,
        allDay: blockAllDay,
        startTime: blockAllDay ? undefined : blockStart,
        endTime: blockAllDay ? undefined : blockEnd,
        reason: blockReason.trim(),
      });
      setShowBlockoutForm(false);
      setBlockReason('');
      loadBlockouts();
    } catch (err: any) {
      alert('Erro ao criar bloqueio: ' + (err.message || ''));
    } finally {
      setSavingBlockout(false);
    }
  };

  const handleDeleteBlockout = async (id: string) => {
    if (!confirm('Deseja remover este bloqueio?')) return;
    try {
      await api.deleteBlockout(id);
      loadBlockouts();
    } catch (e: any) {
      alert('Erro ao excluir: ' + e.message);
    }
  };

  const daysList: { key: keyof Omit<OperatingHoursConfig, 'breakInterval'>; label: string }[] = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
  ];

  return (
    <div className="space-y-8">
      {/* Seção 1: Horários Semanais de Expediente */}
      <div className="p-6 bg-[#181a20] rounded-2xl border border-zinc-800 shadow-md">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-white font-['Oswald'] uppercase tracking-wide flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Horário de Funcionamento
            </h2>
            <p className="text-xs text-zinc-400">
              Configure abertura e fechamento para cada dia da semana.
            </p>
          </div>

          {hoursSuccess && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1.5 animate-fadeIn">
              <Check className="w-4 h-4" /> Horários Salvos!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveHours} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 divide-y divide-zinc-800/80">
            {daysList.map(({ key, label }) => {
              const day = hours[key];
              return (
                <div key={key} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 w-40">
                    <input
                      type="checkbox"
                      id={`day-${key}`}
                      checked={day.active}
                      onChange={(e) =>
                        setHours({
                          ...hours,
                          [key]: { ...day, active: e.target.checked },
                        })
                      }
                      className="rounded bg-zinc-800 border-zinc-700 text-amber-500"
                    />
                    <label
                      htmlFor={`day-${key}`}
                      className={`font-semibold cursor-pointer ${
                        day.active ? 'text-white' : 'text-zinc-500 line-through'
                      }`}
                    >
                      {label}
                    </label>
                  </div>

                  {day.active ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-400">Abre às:</span>
                        <input
                          type="time"
                          value={day.open}
                          onChange={(e) =>
                            setHours({
                              ...hours,
                              [key]: { ...day, open: e.target.value },
                            })
                          }
                          className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-white [color-scheme:dark]"
                        />
                      </div>
                      <span className="text-zinc-500">até</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-400">Fecha às:</span>
                        <input
                          type="time"
                          value={day.close}
                          onChange={(e) =>
                            setHours({
                              ...hours,
                              [key]: { ...day, close: e.target.value },
                            })
                          }
                          className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-white [color-scheme:dark]"
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-zinc-500 font-medium italic">
                      Fechado (Não recebe agendamentos)
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Intervalo Padrão de Almoço */}
          <div className="pt-4 border-t border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/40 p-4 rounded-xl border border-zinc-800">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="breakActive"
                  checked={hours.breakInterval.active}
                  onChange={(e) =>
                    setHours({
                      ...hours,
                      breakInterval: {
                        ...hours.breakInterval,
                        active: e.target.checked,
                      },
                    })
                  }
                  className="rounded bg-zinc-800 border-zinc-700 text-amber-500"
                />
                <div>
                  <label htmlFor="breakActive" className="font-bold text-white text-sm cursor-pointer block">
                    Intervalo de Almoço / Pausa
                  </label>
                  <span className="text-zinc-400 text-[11px]">
                    Bloqueia automaticamente este período na agenda de todos os dias
                  </span>
                </div>
              </div>

              {hours.breakInterval.active && (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={hours.breakInterval.start}
                    onChange={(e) =>
                      setHours({
                        ...hours,
                        breakInterval: {
                          ...hours.breakInterval,
                          start: e.target.value,
                        },
                      })
                    }
                    className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-white [color-scheme:dark]"
                  />
                  <span className="text-zinc-500">às</span>
                  <input
                    type="time"
                    value={hours.breakInterval.end}
                    onChange={(e) =>
                      setHours({
                        ...hours,
                        breakInterval: {
                          ...hours.breakInterval,
                          end: e.target.value,
                        },
                      })
                    }
                    className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-white [color-scheme:dark]"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={savingHours}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {savingHours ? 'Salvando horários...' : 'Salvar Alterações de Horário'}
            </button>
          </div>
        </form>
      </div>

      {/* Seção 2: Folgas Especiais e Bloqueios Pontuais */}
      <div className="p-6 bg-[#181a20] rounded-2xl border border-zinc-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-white font-['Oswald'] uppercase tracking-wide flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              Bloqueios Manuais & Folgas
            </h2>
            <p className="text-xs text-zinc-400">
              Bloqueie datas inteiras ou intervalos específicos para feriados, cursos ou folgas pessoais.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowBlockoutForm(!showBlockoutForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl shadow transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Folga / Bloqueio</span>
          </button>
        </div>

        {/* Formulário de Bloqueio */}
        {showBlockoutForm && (
          <form onSubmit={handleAddBlockout} className="p-4 mb-4 bg-zinc-900/90 rounded-xl border border-zinc-700 space-y-3 text-xs animate-fadeIn">
            <h4 className="font-bold text-white text-sm">Novo Bloqueio</h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold uppercase text-zinc-400 mb-1">Data *</label>
                <input
                  type="date"
                  required
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121418] border border-zinc-700 rounded-lg text-white [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-zinc-400 mb-1">Profissional</label>
                <select
                  value={blockProId}
                  onChange={(e) => setBlockProId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121418] border border-zinc-700 rounded-lg text-white"
                >
                  <option value="all">Todos os Barbeiros</option>
                  {professionals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-zinc-400 mb-1">Motivo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Feriado, Consulta médica..."
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121418] border border-zinc-700 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allDayBlock"
                  checked={blockAllDay}
                  onChange={(e) => setBlockAllDay(e.target.checked)}
                  className="rounded bg-zinc-800 border-zinc-700 text-amber-500"
                />
                <label htmlFor="allDayBlock" className="text-zinc-300 font-semibold cursor-pointer">
                  Bloquear o dia inteiro
                </label>
              </div>

              {!blockAllDay && (
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">Das</span>
                  <input
                    type="time"
                    value={blockStart}
                    onChange={(e) => setBlockStart(e.target.value)}
                    className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-white [color-scheme:dark]"
                  />
                  <span className="text-zinc-400">às</span>
                  <input
                    type="time"
                    value={blockEnd}
                    onChange={(e) => setBlockEnd(e.target.value)}
                    className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-white [color-scheme:dark]"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowBlockoutForm(false)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingBlockout}
                className="px-4 py-1.5 rounded-lg bg-amber-500 text-black font-bold"
              >
                {savingBlockout ? 'Salvando...' : 'Salvar Bloqueio'}
              </button>
            </div>
          </form>
        )}

        {/* Lista de Bloqueios */}
        {loadingBlockouts ? (
          <div className="py-6 text-center text-xs text-zinc-500">Carregando bloqueios...</div>
        ) : blockouts.length === 0 ? (
          <div className="py-6 text-center text-xs text-zinc-500 bg-zinc-900/40 rounded-xl border border-zinc-800/80">
            Nenhum bloqueio ou folga cadastrado no momento.
          </div>
        ) : (
          <div className="space-y-2">
            {blockouts.map((b) => {
              const proName =
                b.professionalId === 'all'
                  ? 'Todos os Profissionais'
                  : professionals.find((p) => p.id === b.professionalId)?.name || 'Barbeiro';

              return (
                <div
                  key={b.id}
                  className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{b.reason}</span>
                        <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                          {proName}
                        </span>
                      </div>
                      <div className="text-zinc-400 mt-0.5">
                        <span>Data: <strong>{formatDatePtBR(b.date)}</strong></span>
                        <span className="mx-1">•</span>
                        <span>
                          {b.allDay ? 'Dia Inteiro' : `${b.startTime} às ${b.endTime}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteBlockout(b.id)}
                    className="p-2 text-zinc-500 hover:text-red-400 transition"
                    title="Excluir bloqueio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
