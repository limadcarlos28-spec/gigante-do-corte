import React, { useState } from 'react';
import { UserCheck, Phone, FileText, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { Service, Professional } from './barbershop.ts';
import { formatDatePtBR, formatCurrency, addMinutesToTime } from './dateUtils.ts';

interface ClientFormProps {
  service: Service;
  professional: Professional;
  date: string;
  time: string;
  onSubmit: (clientData: { name: string; phone: string; notes?: string }) => Promise<void>;
  onBack: () => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({
  service,
  professional,
  date,
  time,
  onSubmit,
  onBack,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endTime = addMinutesToTime(time, service.durationMinutes);

  // Formatação automática do telefone brasileiro (11) 99999-9999
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);

    if (v.length > 6) {
      v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    } else if (v.length > 2) {
      v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    } else if (v.length > 0) {
      v = `(${v}`;
    }
    setPhone(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, informe seu nome completo.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Por favor, informe um número de WhatsApp válido com DDD (ex: (11) 99999-8888).');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        phone: phone.trim(),
        notes: notes.trim() || undefined,
      });
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao confirmar seu agendamento.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center sm:text-left">
        <h2 className="text-xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
          <UserCheck className="w-5 h-5 text-amber-500" />
          5. Seus Dados e Confirmação
        </h2>
        <p className="text-sm text-zinc-400">
          Você não precisa criar conta. Apenas informe seus dados para receber o lembrete.
        </p>
      </div>

      {/* Resumo do Agendamento */}
      <div className="bg-gradient-to-br from-[#1b1e26] to-[#14161b] p-4 sm:p-5 rounded-2xl border border-amber-500/30 shadow-lg space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" />
          <span>Resumo da Sua Reserva</span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-zinc-800 text-sm">
          <div>
            <span className="text-xs text-zinc-400 block">Serviço:</span>
            <span className="font-bold text-white">{service.name}</span>
          </div>

          <div>
            <span className="text-xs text-zinc-400 block">Valor:</span>
            <span className="font-extrabold text-amber-400 font-['Oswald'] text-base">
              {formatCurrency(service.price)}
            </span>
          </div>

          <div>
            <span className="text-xs text-zinc-400 block">Profissional:</span>
            <span className="font-semibold text-zinc-200">{professional.name}</span>
          </div>

          <div>
            <span className="text-xs text-zinc-400 block">Duração:</span>
            <span className="text-zinc-300 font-medium">{service.durationMinutes} minutos</span>
          </div>

          <div className="col-span-2 bg-black/40 p-2.5 rounded-lg border border-zinc-800/80">
            <span className="text-xs text-zinc-400 block">Data e Horário:</span>
            <div className="text-white font-bold flex items-center justify-between">
              <span>{formatDatePtBR(date, { full: true })}</span>
              <span className="text-amber-400 font-['Oswald'] text-lg">
                {time} às {endTime}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
            Seu Nome Completo *
          </label>
          <input
            type="text"
            required
            placeholder="Ex: Carlos Eduardo Silva"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-[#181a20] border border-zinc-700/80 focus:border-amber-500 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
            WhatsApp / Celular com DDD *
          </label>
          <div className="relative">
            <input
              type="tel"
              required
              placeholder="(11) 99999-9999"
              value={phone}
              onChange={handlePhoneChange}
              className="w-full pl-10 pr-4 py-3 bg-[#181a20] border border-zinc-700/80 focus:border-amber-500 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm"
            />
            <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            Utilizamos apenas para confirmar seu agendamento e enviar lembretes.
          </span>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
            Observações ou preferências (Opcional)
          </label>
          <textarea
            rows={2}
            placeholder="Ex: Prefiro degradê na navalha, corte bem baixo..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#181a20] border border-zinc-700/80 focus:border-amber-500 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm resize-none"
          />
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="py-3 px-5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-sm font-semibold transition"
          >
            Voltar
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-base tracking-wide shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Gravando no banco de dados...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirmar Agendamento</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
