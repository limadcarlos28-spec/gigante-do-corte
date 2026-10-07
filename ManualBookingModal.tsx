import React, { useState, useEffect } from 'react';
import { PlusCircle, X, Clock, Calendar, User, Scissors, Phone, Loader2 } from 'lucide-react';
import { Service, Professional } from '../../types/barbershop.ts';
import { api } from '../../services/api.ts';
import { getTodayDateString, getTomorrowDateString } from '../../utils/dateUtils.ts';

interface ManualBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  professionals: Professional[];
  onBookingCreated: () => void;
}

export const ManualBookingModal: React.FC<ManualBookingModalProps> = ({
  isOpen,
  onClose,
  services,
  professionals,
  onBookingCreated,
}) => {
  const [serviceId, setServiceId] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState('10:00');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [forceConflict, setForceConflict] = useState(false);

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (services.length > 0 && !serviceId) {
      setServiceId(services[0].id);
    }
    if (professionals.length > 0 && !professionalId) {
      setProfessionalId(professionals[0].id);
    }
  }, [services, professionals, serviceId, professionalId]);

  // Carregar slots para ajudar a escolher
  useEffect(() => {
    if (!serviceId || !professionalId || !date) return;
    let isMounted = true;
    async function load() {
      setLoadingSlots(true);
      try {
        const slots = await api.getAvailableSlots(date, professionalId, serviceId);
        if (isMounted) {
          setAvailableSlots(slots);
          if (slots.length > 0 && !slots.includes(time)) {
            setTime(slots[0]);
          }
        }
      } catch (e) {
        // ignore
      } finally {
        if (isMounted) setLoadingSlots(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [serviceId, professionalId, date]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      setError('Nome e telefone do cliente são obrigatórios.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.createManualAppointment({
        serviceId,
        professionalId,
        date,
        time,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientNotes: clientNotes.trim() || undefined,
        forceConflict,
      });

      onBookingCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar agendamento manual');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#181a20] border border-amber-500/30 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-left">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-['Oswald'] uppercase tracking-wide">
              Novo Agendamento Manual
            </h2>
            <p className="text-xs text-zinc-400">
              Cadastre um cliente que ligou ou compareceu no balcão
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Serviço e Barbeiro */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-zinc-300 mb-1">
                Serviço
              </label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#121418] border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.durationMinutes} min - R$ {s.price})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-zinc-300 mb-1">
                Barbeiro
              </label>
              <select
                value={professionalId}
                onChange={(e) => setProfessionalId(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#121418] border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              >
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Data e Horário */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-zinc-300 mb-1">
                Data do Atendimento
              </label>
              <div className="flex gap-1.5 mb-1.5">
                <button
                  type="button"
                  onClick={() => setDate(getTodayDateString())}
                  className={`px-2 py-1 rounded text-[10px] font-bold ${
                    date === getTodayDateString() ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={() => setDate(getTomorrowDateString())}
                  className={`px-2 py-1 rounded text-[10px] font-bold ${
                    date === getTomorrowDateString() ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  Amanhã
                </button>
              </div>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#121418] border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500 [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-zinc-300 mb-1">
                Horário (HH:mm)
              </label>
              <input
                type="time"
                required
                step="900"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 bg-[#121418] border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500 [color-scheme:dark]"
              />

              {availableSlots.length > 0 && (
                <div className="mt-1.5">
                  <span className="text-[10px] text-zinc-400 block mb-1">Sugestões livres:</span>
                  <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                    {availableSlots.slice(0, 6).map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setTime(slot)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                          time === slot ? 'bg-amber-500 text-black font-bold' : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dados do Cliente */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-zinc-300 mb-1">
              Nome do Cliente *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: João Santos"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#121418] border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-zinc-300 mb-1">
              WhatsApp / Telefone *
            </label>
            <input
              type="tel"
              required
              placeholder="(11) 99999-9999"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#121418] border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-zinc-300 mb-1">
              Observações (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Pagamento adiantado no Pix, corte na navalha..."
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              className="w-full px-3 py-2 bg-[#121418] border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="forceConflict"
              checked={forceConflict}
              onChange={(e) => setForceConflict(e.target.checked)}
              className="rounded bg-zinc-800 border-zinc-700 text-amber-500 focus:ring-0"
            />
            <label htmlFor="forceConflict" className="text-[11px] text-zinc-400 cursor-pointer">
              Encaixe de emergência (permitir salvar mesmo se houver conflito de horário)
            </label>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold flex items-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Confirmar Agendamento</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
