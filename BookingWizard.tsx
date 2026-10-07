import React, { useState } from 'react';
import { Service, Professional, Appointment, BarbershopSettings } from '../../types/barbershop.ts';
import { getTodayDateString } from '../../utils/dateUtils.ts';
import { ServiceSelector } from './ServiceSelector.tsx';
import { ProfessionalSelector } from './ProfessionalSelector.tsx';
import { DateSelector } from './DateSelector.tsx';
import { TimeSlotSelector } from './TimeSlotSelector.tsx';
import { ClientForm } from './ClientForm.tsx';
import { BookingSuccess } from './BookingSuccess.tsx';
import { api } from '../../services/api.ts';
import { Check, ChevronLeft, ChevronRight, Scissors } from 'lucide-react';

interface BookingWizardProps {
  services: Service[];
  professionals: Professional[];
  settings?: BarbershopSettings;
  onAppointmentCreated?: (app: Appointment) => void;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({
  services,
  professionals,
  settings,
  onAppointmentCreated,
}) => {
  const [step, setStep] = useState<number>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

  // Auto-selecionar o profissional padrão (ex: GIVANILSON) se houver apenas um
  React.useEffect(() => {
    if (!selectedProfessional && professionals.length === 1) {
      setSelectedProfessional(professionals[0]);
    }
  }, [professionals, selectedProfessional]);

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    // Se só tem 1 profissional, pula direto para a escolha da data!
    if (professionals.length === 1) {
      setSelectedProfessional(professionals[0]);
      setStep(3);
    } else {
      setStep(2);
    }
  };

  const handleSelectProfessional = (pro: Professional) => {
    setSelectedProfessional(pro);
    setStep(3);
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setSelectedTime('');
    setStep(4);
  };

  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
    setStep(5);
  };

  const handleConfirmBooking = async (clientData: { name: string; phone: string; notes?: string }) => {
    if (!selectedService || !selectedProfessional || !selectedDate || !selectedTime) {
      throw new Error('Dados incompletos para realizar o agendamento');
    }

    const res = await api.createAppointment({
      serviceId: selectedService.id,
      professionalId: selectedProfessional.id,
      date: selectedDate,
      time: selectedTime,
      clientName: clientData.name,
      clientPhone: clientData.phone,
      clientNotes: clientData.notes,
    });

    setConfirmedAppointment(res.appointment);
    if (onAppointmentCreated) {
      onAppointmentCreated(res.appointment);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedService(null);
    if (professionals.length > 1) {
      setSelectedProfessional(null);
    }
    setSelectedDate(getTodayDateString());
    setSelectedTime('');
    setConfirmedAppointment(null);
  };

  if (confirmedAppointment) {
    return (
      <BookingSuccess
        appointment={confirmedAppointment}
        settings={settings}
        onNewBooking={handleReset}
      />
    );
  }

  const stepLabels = [
    { num: 1, label: 'Serviço' },
    { num: 2, label: 'Barbeiro' },
    { num: 3, label: 'Data' },
    { num: 4, label: 'Horário' },
    { num: 5, label: 'Confirmar' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Barra de Progresso Superior */}
      <div className="mb-6 bg-[#16191f] p-3 rounded-2xl border border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between">
          {stepLabels.map((s, index) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;

            return (
              <React.Fragment key={s.num}>
                <div
                  onClick={() => {
                    // Permitir voltar para etapas anteriores já preenchidas
                    if (isCompleted) setStep(s.num);
                  }}
                  className={`flex flex-col items-center cursor-pointer transition ${
                    isCompleted ? 'hover:opacity-80' : ''
                  }`}
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                        : isCurrent
                        ? 'bg-amber-400 text-black ring-4 ring-amber-500/20 scale-105'
                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : s.num}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs font-medium mt-1 truncate max-w-[50px] sm:max-w-none ${
                      isCurrent ? 'text-amber-400 font-bold' : isCompleted ? 'text-zinc-300' : 'text-zinc-500'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>

                {index < stepLabels.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 sm:mx-2 rounded transition-all ${
                      step > index + 1 ? 'bg-amber-500' : 'bg-zinc-800'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Navegação Voltar rápida se não for o primeiro passo */}
      {step > 1 && (
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (step === 3 && professionals.length === 1) {
                setStep(1);
              } else {
                setStep((prev) => Math.max(1, prev - 1));
              }
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-amber-400 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Voltar passo anterior</span>
          </button>

          {selectedService && (
            <div className="text-xs text-zinc-400 truncate max-w-[200px]">
              <span className="text-amber-400 font-semibold">{selectedService.name}</span>
              {selectedProfessional && ` com ${selectedProfessional.name}`}
            </div>
          )}
        </div>
      )}

      {/* Conteúdo de cada Passo */}
      <div className="bg-[#12141a]/60 border border-zinc-800/80 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-sm">
        {step === 1 && (
          <ServiceSelector
            services={services}
            selectedService={selectedService}
            onSelectService={handleSelectService}
          />
        )}

        {step === 2 && (
          <ProfessionalSelector
            professionals={professionals}
            selectedProfessional={selectedProfessional}
            onSelectProfessional={handleSelectProfessional}
          />
        )}

        {step === 3 && (
          <DateSelector
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
          />
        )}

        {step === 4 && selectedService && selectedProfessional && (
          <TimeSlotSelector
            selectedDate={selectedDate}
            professionalId={selectedProfessional.id}
            serviceId={selectedService.id}
            selectedTime={selectedTime}
            onSelectTime={handleSelectTime}
          />
        )}

        {step === 5 && selectedService && selectedProfessional && selectedTime && (
          <ClientForm
            service={selectedService}
            professional={selectedProfessional}
            date={selectedDate}
            time={selectedTime}
            onSubmit={handleConfirmBooking}
            onBack={() => setStep(4)}
          />
        )}
      </div>
    </div>
  );
};
