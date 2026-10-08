import React, { useState, useEffect } from 'react';
import { UserCheck, Phone, MessageSquare, DollarSign, Calendar, Search, RefreshCw } from 'lucide-react';
import { api, ClientSummary } from './api.ts';
import { formatDatePtBR, formatCurrency, formatPhone, getWhatsAppLink } from './dateUtils.ts';

export const ClientsView: React.FC = () => {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await api.getClients();
      setClients(data || []);
    } catch (e) {
      console.error('Erro ao carregar clientes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-white font-['Oswald'] uppercase tracking-wide flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-amber-500" />
            Base de Clientes
          </h2>
          <p className="text-xs text-zinc-400">
            Histórico consolidado de clientes atendidos, fidelidade e contato direto no WhatsApp.
          </p>
        </div>

        <button
          type="button"
          onClick={loadClients}
          className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 self-start sm:self-auto transition"
          title="Recarregar clientes"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
        </button>
      </div>

      {/* Busca */}
      <div className="relative bg-[#181a20] p-2 rounded-2xl border border-zinc-800">
        <input
          type="text"
          placeholder="Buscar por nome ou número de telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-500"
        />
        <Search className="w-4 h-4 text-zinc-400 absolute left-5 top-1/2 -translate-y-1/2" />
      </div>

      {/* Lista de Clientes */}
      {loading ? (
        <div className="py-12 text-center text-xs text-zinc-400">Carregando histórico de clientes...</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center bg-[#181a20] rounded-2xl border border-zinc-800">
          <UserCheck className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-xs text-zinc-400">Nenhum cliente encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered.map((client, idx) => {
            const waUrl = getWhatsAppLink(
              client.phone,
              `Olá ${client.name}! Tudo bem? Estamos entrando em contato da barbearia Gigante do Corte!`
            );

            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#181a20] border border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-white">{client.name}</h3>
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold hover:underline mt-1"
                        title="Abrir WhatsApp com este cliente"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{formatPhone(client.phone)}</span>
                      </a>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-xs font-['Oswald']">
                      {client.totalAppointments}x
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-zinc-800 text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold block">
                        Total Investido:
                      </span>
                      <span className="font-extrabold text-amber-400 font-['Oswald'] text-sm">
                        {formatCurrency(client.totalSpent)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold block">
                        Última Visita:
                      </span>
                      <span className="text-zinc-300 font-medium">
                        {formatDatePtBR(client.lastAppointmentDate)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex justify-end">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Iniciar Conversa no WhatsApp</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
