import React, { useState, useRef } from 'react';
import { User, Plus, Edit2, Trash2, Phone, Star, Check, X, Loader2, Upload, Camera } from 'lucide-react';
import { Professional } from './barbershop.ts';
import { api } from './api.ts';

interface ProfessionalsViewProps {
  professionals: Professional[];
  onRefreshProfessionals: () => void;
}

export const ProfessionalsView: React.FC<ProfessionalsViewProps> = ({
  professionals,
  onRefreshProfessionals,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenNew = () => {
    setEditingId(null);
    setName('');
    setPhone('');
    setSpecialties('');
    setAvatarUrl('');
    setStatus('active');
    setError(null);
    setIsEditing(true);
  };

  const handleOpenEdit = (p: Professional) => {
    setEditingId(p.id);
    setName(p.name);
    setPhone(p.phone || '');
    setSpecialties(p.specialties?.join(', ') || '');
    setAvatarUrl(p.avatarUrl || '');
    setStatus(p.status);
    setError(null);
    setIsEditing(true);
  };

  /**
   * Redimensiona e comprime automaticamente qualquer foto JPG/JPEG/PNG para ~500x500 px.
   * Garante qualidade visual perfeita para avatar e gera um payload ultraleve (~25-45 KB),
   * eliminando completamente o erro de 'request entity too large'.
   */
  const resizeAndCompressAvatar = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const validExtensions = /\.(jpe?g|png)$/i;
      const isImage = file.type.startsWith('image/') || validExtensions.test(file.name);
      if (!isImage) {
        reject(new Error('Formato inválido. Por favor, selecione uma imagem JPG, JPEG ou PNG.'));
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        const targetDim = 500;
        let { width, height } = img;

        // Proporcional dentro de ~500x500 px
        if (width > height) {
          if (width > targetDim) {
            height = Math.round((height * targetDim) / width);
            width = targetDim;
          }
        } else {
          if (height > targetDim) {
            width = Math.round((width * targetDim) / height);
            height = targetDim;
          }
        }

        width = Math.max(1, width);
        height = Math.max(1, height);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível processar a imagem.'));
          return;
        }

        // Fundo escuro elegante para recortes com transparência
        ctx.fillStyle = '#1e222b';
        ctx.fillRect(0, 0, width, height);

        // Suavização em alta definição
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Exporta em JPEG 0.82 (aproximadamente 25-45 KB, ultra leve e nítido)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(compressedDataUrl);
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Falha ao ler o arquivo de imagem. Tente outra foto.'));
      };

      img.src = objectUrl;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageProcessing(true);
    setError(null);

    try {
      const optimizedDataUrl = await resizeAndCompressAvatar(file);
      setAvatarUrl(optimizedDataUrl);
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar e comprimir a imagem.');
    } finally {
      setImageProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome do barbeiro é obrigatório.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const specs = specialties
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (editingId) {
        await api.updateProfessional(editingId, {
          name: name.trim(),
          phone: phone.trim() || undefined,
          specialties: specs,
          avatarUrl: avatarUrl.trim() || undefined,
          status,
        });
      } else {
        await api.createProfessional({
          name: name.trim(),
          phone: phone.trim() || undefined,
          specialties: specs,
          avatarUrl: avatarUrl.trim() || undefined,
          status,
        });
      }
      setIsEditing(false);
      onRefreshProfessionals();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar profissional');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, pName: string) => {
    if (professionals.length === 1) {
      alert('A barbearia precisa ter pelo menos um profissional cadastrado.');
      return;
    }
    if (!confirm(`Tem certeza que deseja remover o profissional ${pName}?`)) return;

    try {
      await api.deleteProfessional(id);
      onRefreshProfessionals();
    } catch (err: any) {
      alert(err.message || 'Erro ao remover profissional');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-white font-['Oswald'] uppercase tracking-wide flex items-center gap-2">
            <User className="w-6 h-6 text-amber-500" />
            Equipe de Barbeiros
          </h2>
          <p className="text-xs text-zinc-400">
            Gerencie os barbeiros da Gigante do Corte, status de atendimento e especialidades.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Barbeiro</span>
        </button>
      </div>

      {isEditing && (
        <div className="p-5 bg-[#181a20] rounded-2xl border border-amber-500/40 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="font-bold text-white text-base font-['Oswald'] uppercase tracking-wide">
              {editingId ? 'Editar Profissional' : 'Cadastrar Novo Barbeiro'}
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

          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold uppercase text-zinc-300 mb-1">
                Nome do Barbeiro *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: GIVANILSON"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-[#121418] border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-zinc-300 mb-1">
                WhatsApp / Celular
              </label>
              <input
                type="tel"
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-[#121418] border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-zinc-300 mb-1">
                Especialidades (separadas por vírgula)
              </label>
              <input
                type="text"
                placeholder="Ex: Degradê, Barba Terapia, Pigmentação"
                value={specialties}
                onChange={(e) => setSpecialties(e.target.value)}
                className="w-full px-3 py-2 bg-[#121418] border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Substituição da URL por Enviar/Trocar Foto com Pré-visualização Imediata */}
            <div className="sm:col-span-2 bg-[#121418] border border-zinc-700/80 rounded-2xl p-4 space-y-3">
              <label className="block font-bold uppercase text-zinc-300 text-xs">
                Foto / Avatar do Barbeiro
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Pré-visualização da Imagem Imediata */}
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Pré-visualização do Barbeiro"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-500 shadow-md shadow-amber-500/20"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-zinc-800 border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center text-zinc-500">
                      <Camera className="w-7 h-7 mb-1 text-zinc-500" />
                      <span className="text-[10px] font-semibold">Sem Foto</span>
                    </div>
                  )}
                  {avatarUrl && (
                    <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-md bg-emerald-500 text-[9px] font-black text-black uppercase tracking-wider shadow">
                      Ativa
                    </span>
                  )}
                </div>

                {/* Opção de Enviar/Trocar Foto */}
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleFileChange}
                    className="hidden"
                    id="professional-photo-file-input"
                  />

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <button
                      type="button"
                      disabled={imageProcessing}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black font-extrabold text-xs flex items-center gap-2 shadow-md shadow-amber-500/10 transition cursor-pointer"
                    >
                      {imageProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Otimizando Foto...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>{avatarUrl ? 'Trocar Foto' : 'Enviar Foto'}</span>
                        </>
                      )}
                    </button>

                    {avatarUrl && !imageProcessing && (
                      <span className="text-[11px] text-zinc-400">
                        Foto atual mantida (clique em Trocar Foto para alterar)
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Selecione uma imagem <strong className="text-zinc-200">JPG, JPEG ou PNG</strong> diretamente do computador ou celular. Se nenhuma foto for escolhida, a imagem atual será preservada.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase text-zinc-300 mb-1">
                Status de Atendimento
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                className="w-full px-3 py-2 bg-[#121418] border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              >
                <option value="active">Ativo (Recebendo agendamentos)</option>
                <option value="inactive">Inativo (Pausado)</option>
              </select>
            </div>

            <div className="sm:col-span-2 flex justify-end gap-2 pt-2 border-t border-zinc-800">
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
                  <span>Salvar Barbeiro</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid de Barbeiros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {professionals.map((pro) => (
          <div
            key={pro.id}
            className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
              pro.status === 'active'
                ? 'bg-[#181a20] border-zinc-800'
                : 'bg-zinc-900/40 border-zinc-800/40 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center gap-3.5 mb-3">
                <div className="relative">
                  {pro.avatarUrl ? (
                    <img
                      src={pro.avatarUrl}
                      alt={pro.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-amber-500/50"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-zinc-800 border-2 border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg">
                      {pro.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span
                    className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#181a20] ${
                      pro.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-500'
                    }`}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-black text-white font-['Oswald'] uppercase tracking-wide">
                    {pro.name}
                  </h3>
                  <span
                    className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mt-0.5 ${
                      pro.status === 'active'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                    }`}
                  >
                    {pro.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>

              {pro.phone && (
                <div className="text-xs text-zinc-400 flex items-center gap-1.5 mb-2">
                  <Phone className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{pro.phone}</span>
                </div>
              )}

              {pro.specialties && pro.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {pro.specialties.map((spec, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-medium"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => handleOpenEdit(pro)}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                title="Editar barbeiro"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleDelete(pro.id, pro.name)}
                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                title="Excluir barbeiro"
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
