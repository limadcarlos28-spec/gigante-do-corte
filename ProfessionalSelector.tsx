import React from 'react';
import { User, Check, Star } from 'lucide-react';
import { Professional } from '../../types/barbershop.ts';

interface ProfessionalSelectorProps {
  professionals: Professional[];
  selectedProfessional: Professional | null;
  onSelectProfessional: (pro: Professional) => void;
}

export const ProfessionalSelector: React.FC<ProfessionalSelectorProps> = ({
  professionals,
  selectedProfessional,
  onSelectProfessional,
}) => {
  return (
    <div className="space-y-4">
      <div className="text-center sm:text-left mb-2">
        <h2 className="text-xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
          <User className="w-5 h-5 text-amber-500" />
          2. Escolha o Profissional
        </h2>
        <p className="text-sm text-zinc-400">
          Escolha o barbeiro de sua preferência para o seu atendimento.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {professionals.map((pro) => {
          const isSelected = selectedProfessional?.id === pro.id;
          return (
            <div
              key={pro.id}
              onClick={() => onSelectProfessional(pro)}
              className={`relative p-4 rounded-xl cursor-pointer transition-all duration-200 border flex items-center justify-between gap-3 ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500'
                  : 'bg-[#181a20] hover:bg-[#1f222a] border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-3.5">
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
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#181a20]" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base font-['Oswald'] uppercase tracking-wide">
                      {pro.name}
                    </h3>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Disponível
                    </span>
                  </div>

                  {pro.specialties && pro.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {pro.specialties.slice(0, 2).map((spec, i) => (
                        <span
                          key={i}
                          className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition shrink-0 ${
                  isSelected
                    ? 'bg-amber-500 text-black shadow'
                    : 'border border-zinc-700 bg-zinc-900 text-transparent'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
