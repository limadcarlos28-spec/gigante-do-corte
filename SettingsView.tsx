import React, { useState } from 'react';
import { Settings, Lock, Check, Building, Phone, MapPin, Loader2 } from 'lucide-react';
import { BarbershopSettings } from '../../types/barbershop.ts';
import { api } from '../../services/api.ts';

interface SettingsViewProps {
  settings: BarbershopSettings;
  onRefreshSettings: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings: initialSettings,
  onRefreshSettings,
}) => {
  const [settings, setSettings] = useState<BarbershopSettings>(initialSettings);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess(false);

    try {
      await api.updateSettings(settings);
      setSettingsSuccess(true);
      onRefreshSettings();
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err: any) {
      alert('Erro ao salvar configurações: ' + (err.message || ''));
    } finally {
      setSavingSettings(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!newPassword || newPassword.length < 4) {
      setPasswordError('A nova senha deve ter no mínimo 4 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas digitadas não coincidem.');
      return;
    }

    setSavingPassword(true);
    try {
      await api.updateAdminPassword(newPassword);
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: any) {
      setPasswordError(err.message || 'Erro ao atualizar senha.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Dados Gerais da Barbearia */}
      <div className="p-6 bg-[#181a20] rounded-2xl border border-zinc-800 shadow-md">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-white font-['Oswald'] uppercase tracking-wide flex items-center gap-2">
              <Building className="w-5 h-5 text-amber-500" />
              Informações da Barbearia
            </h2>
            <p className="text-xs text-zinc-400">
              Personalize o nome, slogan, telefone do WhatsApp e localização.
            </p>
          </div>

          {settingsSuccess && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1.5 animate-fadeIn">
              <Check className="w-4 h-4" /> Dados Salvos!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-zinc-300 mb-1">
                Nome do Estabelecimento *
              </label>
              <input
                type="text"
                required
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="w-full px-3 py-2 bg-[#121418] border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-zinc-300 mb-1">
                Slogan / Frase de Destaque
              </label>
              <input
                type="text"
                value={settings.slogan}
                onChange={(e) => setSettings({ ...settings, slogan: e.target.value })}
                className="w-full px-3 py-2 bg-[#121418] border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-zinc-300 mb-1">
                WhatsApp de Atendimento da Barbearia *
              </label>
              <input
                type="tel"
                required
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 bg-[#121418] border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-zinc-500 mt-0.5 block">
                Usado para os clientes entrarem em contato com a barbearia.
              </span>
            </div>

            <div>
              <label className="block font-bold uppercase text-zinc-300 mb-1">
                Intervalo entre Slots na Agenda (Minutos)
              </label>
              <select
                value={settings.slotIntervalMinutes}
                onChange={(e) =>
                  setSettings({ ...settings, slotIntervalMinutes: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-[#121418] border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              >
                <option value="15">A cada 15 minutos</option>
                <option value="30">A cada 30 minutos (Recomendado)</option>
                <option value="45">A cada 45 minutos</option>
                <option value="60">A cada 60 minutos (1 hora)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold uppercase text-zinc-300 mb-1">
                Endereço Completo
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 bg-[#121418] border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl shadow transition cursor-pointer disabled:opacity-50"
            >
              {savingSettings ? 'Salvando...' : 'Salvar Informações da Barbearia'}
            </button>
          </div>
        </form>
      </div>

      {/* Alteração da Senha de Administrador */}
      <div className="p-6 bg-[#181a20] rounded-2xl border border-zinc-800 shadow-md">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-white font-['Oswald'] uppercase tracking-wide flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-500" />
              Segurança & Senha de Acesso
            </h2>
            <p className="text-xs text-zinc-400">
              Altere a senha de acesso ao Painel Administrativo.
            </p>
          </div>

          {passwordSuccess && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1.5 animate-fadeIn">
              <Check className="w-4 h-4" /> Senha Atualizada com Sucesso!
            </span>
          )}
        </div>

        {passwordError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
            {passwordError}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-zinc-300 mb-1">
                Nova Senha de Acesso *
              </label>
              <input
                type="password"
                required
                placeholder="Mínimo 4 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[#121418] border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-zinc-300 mb-1">
                Confirmar Nova Senha *
              </label>
              <input
                type="password"
                required
                placeholder="Digite a mesma senha novamente"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[#121418] border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingPassword}
              className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold rounded-xl border border-zinc-700 transition cursor-pointer disabled:opacity-50"
            >
              {savingPassword ? 'Alterando senha...' : 'Atualizar Senha de Acesso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
