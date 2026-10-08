import React from 'react';
import { Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
import {
  formatLocalDate,
  getTodayDateString,
  getTomorrowDateString,
  parseDateString,
  getDayOfWeekKey
} from './dateUtils.ts';

interface DateSelectorProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  const todayStr = getTodayDateString();
  const tomorrowStr = getTomorrowDateString();

  // Gerar os próximos 14 dias a partir de hoje
  const upcomingDays = React.useMemo(() => {
    const list: { dateStr: string; dayName: string; dayNumber: string; monthName: string; isToday: boolean; isTomorrow: boolean }[] = [];
    const baseDate = new Date();

    const shortDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const shortMonths = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    for (let i = 0; i < 14; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const str = formatLocalDate(d);

      list.push({
        dateStr: str,
        dayName: i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : shortDays[d.getDay()],
        dayNumber: String(d.getDate()).padStart(2, '0'),
        monthName: shortMonths[d.getMonth()],
        isToday: i === 0,
        isTomorrow: i === 1,
      });
    }
    return list;
  }, []);

  return (
    <div className="space-y-4">
      <div className="text-center sm:text-left mb-2">
        <h2 className="text-xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
          <CalendarIcon className="w-5 h-5 text-amber-500" />
          3. Escolha a Data
        </h2>
        <p className="text-sm text-zinc-400">
          Selecione o dia ideal para comparecer à barbearia.
        </p>
      </div>

      {/* Atalhos rápidos: HOJE e AMANHÃ em destaque */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onSelectDate(todayStr)}
          className={`p-3.5 rounded-xl border text-center transition flex flex-col items-center justify-center ${
            selectedDate === todayStr
              ? 'bg-amber-500/15 border-amber-500 text-amber-400 font-bold shadow-md shadow-amber-500/10'
              : 'bg-[#181a20] border-zinc-800 text-zinc-300 hover:border-zinc-700'
          }`}
        >
          <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400">Atendimento</span>
          <span className="text-lg font-extrabold font-['Oswald']">HOJE</span>
          <span className="text-[11px] text-zinc-400">
            {todayStr.split('-')[2]}/{todayStr.split('-')[1]}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectDate(tomorrowStr)}
          className={`p-3.5 rounded-xl border text-center transition flex flex-col items-center justify-center ${
            selectedDate === tomorrowStr
              ? 'bg-amber-500/15 border-amber-500 text-amber-400 font-bold shadow-md shadow-amber-500/10'
              : 'bg-[#181a20] border-zinc-800 text-zinc-300 hover:border-zinc-700'
          }`}
        >
          <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400">Atendimento</span>
          <span className="text-lg font-extrabold font-['Oswald'] text-amber-400">AMANHÃ</span>
          <span className="text-[11px] text-zinc-400">
            {tomorrowStr.split('-')[2]}/{tomorrowStr.split('-')[1]}
          </span>
        </button>
      </div>

      {/* Carrossel de datas para os próximos 14 dias */}
      <div>
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Ou escolha outro dia:
        </label>
        <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-zinc-700">
          {upcomingDays.map((item) => {
            const isSelected = selectedDate === item.dateStr;
            return (
              <button
                key={item.dateStr}
                type="button"
                onClick={() => onSelectDate(item.dateStr)}
                className={`flex-shrink-0 w-16 py-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-black border-amber-500 font-bold shadow-lg shadow-amber-500/20 scale-105'
                    : 'bg-[#181a20] border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800'
                }`}
              >
                <span className={`text-[11px] uppercase tracking-wider font-semibold ${isSelected ? 'text-black/80' : 'text-zinc-400'}`}>
                  {item.dayName}
                </span>
                <span className={`text-xl font-extrabold font-['Oswald'] my-0.5 ${isSelected ? 'text-black' : 'text-white'}`}>
                  {item.dayNumber}
                </span>
                <span className={`text-[10px] ${isSelected ? 'text-black/70' : 'text-zinc-500'}`}>
                  {item.monthName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Seletor de data livre */}
      <div className="flex items-center gap-3 bg-[#181a20] p-3 rounded-xl border border-zinc-800">
        <CalendarIcon className="w-5 h-5 text-amber-400 shrink-0" />
        <div className="flex-1">
          <label className="block text-[11px] text-zinc-400 uppercase font-semibold">
            Escolher data específica no calendário:
          </label>
          <input
            type="date"
            min={todayStr}
            value={selectedDate}
            onChange={(e) => e.target.value && onSelectDate(e.target.value)}
            className="w-full bg-transparent text-white font-medium text-sm focus:outline-none cursor-pointer [color-scheme:dark]"
          />
        </div>
      </div>
    </div>
  );
};
