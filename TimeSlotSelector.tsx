import React, { useEffect, useState } from 'react';
import { Clock, Sun, Sunset, Moon, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api.ts';
import { formatDatePtBR, timeToMinutes } from '../../utils/dateUtils.ts';

interface TimeSlotSelectorProps {
  selectedDate: string;
  professionalId: string;
  serviceId: string;
  selectedTime: string;
  onSelectTime: (time: string) => void;
}

export const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  selectedDate,
  professionalId,
  serviceId,
  selectedTime,
  onSelectTime,
}) => {
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchSlots() {
      if (!selectedDate || !professionalId || !serviceId) return;
      setLoading(true);
      setError(null);
      try {
        const available = await api.getAvailableSlots(selectedDate, professionalId, serviceId);
        if (isMounted) {
          setSlots(available);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Erro ao carregar horários disponíveis');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSlots();
    return () => {
      isMounted = false;
    };
  }, [selectedDate, professionalId, serviceId]);

  // Agrupar horários por períodos
  const morningSlots = slots.filter((t) => timeToMinutes(t) < 12 * 60);
  const afternoonSlots = slots.filter((t) => timeToMinutes(t) >= 12 * 60 && timeToMinutes(t) < 18 * 60);
  const eveningSlots = slots.filter((t) => timeToMinutes(t) >= 18 * 60);

  return (
    <div className="space-y-4">
      <div className="text-center sm:text-left mb-2">
        <h2 className="text-xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          4. Escolha o Horário
        </h2>
        <p className="text-sm text-zinc-400">
          Horários disponíveis em <span className="text-amber-400 font-semibold">{formatDatePtBR(selectedDate, { showDayOfWeek: true })}</span>:
        </p>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-center bg-[#181a20] rounded-2xl border border-zinc-800">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
          <p className="text-sm text-zinc-300 font-medium">Verificando disponibilidade em tempo real...</p>
          <p className="text-xs text-zinc-500 mt-1">Garantindo que não haja conflitos de agenda.</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : slots.length === 0 ? (
        <div className="py-10 px-6 bg-[#181a20] rounded-2xl border border-zinc-800 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Nenhum horário disponível para esta data</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            A barbearia pode estar fechada neste dia, no horário de folga ou todos os horários já foram reservados.
          </p>
          <p className="text-xs text-amber-400 mt-3 font-semibold">
            Por favor, selecione outra data acima (por exemplo, escolha Amanhã).
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Manhã */}
          {morningSlots.length > 0 && (
            <div className="bg-[#181a20] p-4 rounded-xl border border-zinc-800/80">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
                <Sun className="w-4 h-4" />
                <span>Manhã (09h às 12h)</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {morningSlots.map((time) => {
                  const isSelected = selectedTime === time;
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => onSelectTime(time)}
                      className={`py-2.5 px-2 rounded-lg font-['Oswald'] text-base tracking-wider font-bold transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30 scale-105 ring-2 ring-amber-400'
                          : 'bg-zinc-800/90 text-white hover:bg-zinc-700 hover:text-amber-300 border border-zinc-700/50'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tarde */}
          {afternoonSlots.length > 0 && (
            <div className="bg-[#181a20] p-4 rounded-xl border border-zinc-800/80">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
                <Sunset className="w-4 h-4" />
                <span>Tarde (13h às 18h)</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {afternoonSlots.map((time) => {
                  const isSelected = selectedTime === time;
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => onSelectTime(time)}
                      className={`py-2.5 px-2 rounded-lg font-['Oswald'] text-base tracking-wider font-bold transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30 scale-105 ring-2 ring-amber-400'
                          : 'bg-zinc-800/90 text-white hover:bg-zinc-700 hover:text-amber-300 border border-zinc-700/50'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Noite */}
          {eveningSlots.length > 0 && (
            <div className="bg-[#181a20] p-4 rounded-xl border border-zinc-800/80">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
                <Moon className="w-4 h-4" />
                <span>Noite (18h às 21h)</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {eveningSlots.map((time) => {
                  const isSelected = selectedTime === time;
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => onSelectTime(time)}
                      className={`py-2.5 px-2 rounded-lg font-['Oswald'] text-base tracking-wider font-bold transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30 scale-105 ring-2 ring-amber-400'
                          : 'bg-zinc-800/90 text-white hover:bg-zinc-700 hover:text-amber-300 border border-zinc-700/50'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
