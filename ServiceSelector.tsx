import React from 'react';
import { Scissors, Sparkles, Clock, Check } from 'lucide-react';
import { Service } from './barbershop.ts';
import { formatCurrency } from './dateUtils.ts';

interface ServiceSelectorProps {
  services: Service[];
  selectedService: Service | null;
  onSelectService: (service: Service) => void;
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  services,
  selectedService,
  onSelectService,
}) => {
  return (
    <div className="space-y-4">
      <div className="text-center sm:text-left mb-2">
        <h2 className="text-xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
          <Scissors className="w-5 h-5 text-amber-500" />
          1. Escolha o Serviço
        </h2>
        <p className="text-sm text-zinc-400">
          Selecione o procedimento que deseja realizar com nossos especialistas.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {services.map((service) => {
          const isSelected = selectedService?.id === service.id;
          return (
            <div
              key={service.id}
              onClick={() => onSelectService(service)}
              className={`relative p-4 rounded-xl cursor-pointer transition-all duration-200 border text-left ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500'
                  : 'bg-[#181a20] hover:bg-[#1f222a] border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white text-base truncate">
                      {service.name}
                    </h3>
                    {service.name.includes('+') && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-amber-500 text-black rounded font-['Oswald']">
                        Combo
                      </span>
                    )}
                  </div>

                  {service.description && (
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{service.durationMinutes} min</span>
                    </div>

                    <div className="text-base font-extrabold text-amber-400 font-['Oswald'] tracking-wide">
                      {formatCurrency(service.price)}
                    </div>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition ${
                    isSelected
                      ? 'bg-amber-500 text-black shadow'
                      : 'border border-zinc-700 bg-zinc-900 text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
