import { create } from 'zustand';
import { BookingStep, BookingState } from '@/types/booking.types';

interface BookingStore {
  currentStep: BookingStep;
  bookingData: BookingState;
  setStep: (step: BookingStep) => void;
  setBookingData: (data: Partial<BookingState>) => void;
  resetBooking: () => void;
}

const initialState: BookingState = {
  hospitalId: null,
  specialtyId: null,
  doctorId: null,
  workplaceId: null,
  slotId: null,
  slot: null,
  patientProfileId: null,
  medicalServiceId: null,
  reason: '',
  symptoms: '',
  appointmentId: null,
};

export const useBookingStore = create<BookingStore>((set) => ({
  currentStep: 1,
  bookingData: initialState,
  setStep: (step) => set({ currentStep: step }),
  setBookingData: (data) =>
    set((state) => ({
      bookingData: { ...state.bookingData, ...data },
    })),
  resetBooking: () =>
    set({
      currentStep: 1,
      bookingData: initialState,
    }),
}));
