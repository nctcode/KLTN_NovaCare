import { create } from 'zustand';
import { BookingStep, BookingState } from '@/types/booking.types';

interface BookingStore {
  currentStep: BookingStep;
  bookingData: BookingState;
  preExamResult: any | null;
  setStep: (step: BookingStep) => void;
  setBookingData: (data: Partial<BookingState>) => void;
  setPreExamResult: (result: any) => void;
  setSelection: (selection: { doctorId?: string; hospitalId?: string; specialtyId?: string; reason?: string }) => void;
  resetBooking: () => void;
}

const initialState: BookingState = {
  hospitalId: null,
  specialtyId: null,
  branchId: null,
  doctorId: null,
  workplaceId: null,
  slotId: null,
  slot: null,
  patientProfileId: null,
  medicalServiceId: null,
  healthPackageId: null,
  bookingType: 'doctor',
  examinationType: 'REGULAR',
  reason: '',
  symptoms: '',
  appointmentId: null,
};

export const useBookingStore = create<BookingStore>((set) => ({
  currentStep: 1,
  bookingData: initialState,
  preExamResult: null,
  setStep: (step) => set({ currentStep: step }),
  setBookingData: (data) =>
    set((state) => ({
      bookingData: { ...state.bookingData, ...data },
    })),
  setPreExamResult: (result) =>
    set((state) => ({
      preExamResult: result,
      bookingData: {
        ...state.bookingData,
        specialtyId: result?.recommendations?.specialtyId || state.bookingData.specialtyId,
        reason: result?.structuredData?.initialText || state.bookingData.reason,
      },
    })),
  setSelection: (selection) =>
    set((state) => ({
      bookingData: {
        ...state.bookingData,
        doctorId: selection.doctorId !== undefined ? selection.doctorId : state.bookingData.doctorId,
        hospitalId: selection.hospitalId !== undefined ? selection.hospitalId : state.bookingData.hospitalId,
        specialtyId: selection.specialtyId !== undefined ? selection.specialtyId : state.bookingData.specialtyId,
        reason: selection.reason !== undefined ? selection.reason : state.bookingData.reason,
      },
    })),
  resetBooking: () =>
    set({
      currentStep: 1,
      bookingData: initialState,
      preExamResult: null,
    }),
}));
