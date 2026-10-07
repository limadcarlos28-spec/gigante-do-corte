import React, { useState } from 'react';
import { Scissors, Plus, Edit2, Trash2, Clock, Check, X, Loader2 } from 'lucide-react';
import { Service } from '../../types/barbershop.ts';
import { api } from '../../services/api.ts';
import { formatCurrency } from '../../utils/dateUtils.ts';

interface ServicesViewProps {
  services: Service[];
  onRefreshServices: () => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({
  services,
  onRefreshServices,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | string>(35);
  const [durationMinutes, setDurationMinutes] = useState<number | string>(30);
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenNew = () => {
    setEditingId(null);
    setName('');
    setPrice(35);
    setDurationMinutes(30);
    setDescription('');
    setActive(true);
    setError(null);
    setIsEditing(true);
  };

  const handleOpenEdit = (s: Service) => {
    setEditingId(s.id);
    setName(s.name);
    setPrice(s.price);
    setDurationMinutes(s.durationMinutes);
    setDescription(s.description || '');
    setActive(s.active);
    setError(null);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome do serviço é obrigatório.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await api.updateService(editingId, {
          name: name.trim(),
          price: Number(price),
          durationMinutes: Number(durationMinutes),
          description: description.trim() || undefined,
          active,
        });
      } else {
        await api.createService({
          name: name.trim(),
          price: Number(price),
          durationMinutes: Number(durationMinutes),
          description: description.trim() || undefined,
          active,
        });
      }
      setIsEditing(false);
      onRefreshServices();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar serviço');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, sName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o serviço "${sName}"?`)) return;
    try {
      await api.deleteService(id);
      onRefreshServices();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir serviço');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-white font-['Oswald'] uppercase tracking-wide flex items-center gap-2">
            <Scissors className="w-6 h-6 text-amber-500" />
            Serviços & Preços
          </h2>
          <p className="text-xs text-zinc-400">
            Cadastre, edite valores, altere a duração ou pause serviços da barbearia.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Serviço</span>
        </button>
      </div>

      {/* Modal / Formulário de Edição */}
      {isEditing && (
        <div className="p-5 bg-[#181a20] rounded-2xl border border-amber-500/40 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="font-bold text-white text-base font-['Oswald'] uppercase tracking-wide">
              {editingId ? 'Editar Serviço' : 'Cadastrar Novo Serviço'}
            </h3>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-bold uppercase text-zinc-300 mb-1">
                Nome do Serviço *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Corte Degradê Navalhado"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-[#121418] border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-zinc-300 mb-1">
                Preço (R$) *
              </label>
              <input
                type="number"
                step="0.50"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 bg-[#121418] border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-zinc-300 mb-1">
                Duração (Minutos) *
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-3 py-2 bg-[#121418] border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              >
                <option value="15">15 minutos</option>
                <option value="20">20 minutos</option>
                <option value="30">30 minutos</option>
                <option value="45">45 minutos</option>
                <option value="60">60 minutos (1 hora)</option>
                <option value="75">75 minutos</option>
                <option value="90">90 minutos (1h30)</option>
                <option value="120">120 minutos (2 horas)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold uppercase text-zinc-300 mb-1">
                Descrição do Serviço
              </label>
              <input
                type="text"
                placeholder="Ex: Acabamento com navalhete e toalha quente..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-[#121418] border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-3 flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="activeSrv"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded bg-zinc-800 border-zinc-700 text-amber-500"
              />
              <label htmlFor="activeSrv" className="text-zinc-300 font-semibold cursor-pointer">
                Serviço ativo para agendamento online
              </label>
            </div>

            <div className="sm:col-span-3 flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold flex items-center gap-1.5 shadow"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <span>Salvar Serviço</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid de Serviços */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {services.map((service) => (
          <div
            key={service.id}
            className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
              service.active
                ? 'bg-[#181a20] border-zinc-800 hover:border-zinc-700'
                : 'bg-zinc-900/40 border-zinc-800/40 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-white font-['Oswald'] uppercase tracking-wide">
                    {service.name}
                  </h3>
                  <span
                    className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mt-1 ${
                      service.active
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                    }`}
                  >
                    {service.active ? 'Ativo' : 'Pausado'}
                  </span>
                </div>

                <div className="text-right font-['Oswald'] font-black text-amber-400 text-xl">
                  {formatCurrency(service.price)}
                </div>
              </div>

              {service.description && (
                <p className="text-xs text-zinc-400 mt-2 line-clamp-2">
                  {service.description}
                </p>
              )}

              <div className="flex items-center gap-2 text-xs text-zinc-300 font-medium mt-3">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Duração: {service.durationMinutes} minutos</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => handleOpenEdit(service)}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                title="Editar serviço"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleDelete(service.id, service.name)}
                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                title="Excluir serviço"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
