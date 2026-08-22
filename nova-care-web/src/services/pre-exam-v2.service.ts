import { apiClient } from '@/lib/api-client';

export const preExamV2Service = {
  async start(data: {
    age: number;
    gender: string;
    medicalHistory?: string[];
    medications?: string;
    allergies?: string;
    height?: number;
    weight?: number;
  }) {
    const response = await apiClient.post<any>('/pre-exam-v2/start', data);
    return response?.data !== undefined ? response.data : response;
  },

  async submitSymptoms(
    sessionId: string,
    payload: {
      text: string;
      bodyDiagram?: any;
      voiceFile?: File | null;
      imageFiles?: File[];
      vitals?: any;
    },
  ) {
    const formData = new FormData();
    formData.append('text', payload.text || '');

    if (payload.bodyDiagram) {
      formData.append('bodyDiagram', JSON.stringify(payload.bodyDiagram));
    }
    if (payload.vitals) {
      formData.append('vitals', JSON.stringify(payload.vitals));
    }
    if (payload.voiceFile) {
      formData.append('voice', payload.voiceFile);
    }
    if (payload.imageFiles && payload.imageFiles.length > 0) {
      payload.imageFiles.forEach((file) => formData.append('images', file));
    }

    const response = await apiClient.post<any>(`/pre-exam-v2/${sessionId}/symptoms`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response?.data !== undefined ? response.data : response;
  },

  async answerQuestion(sessionId: string, questionId: string, answer: string) {
    const response = await apiClient.post<any>(`/pre-exam-v2/${sessionId}/answer`, {
      questionId,
      answer,
    });
    return response?.data !== undefined ? response.data : response;
  },

  async complete(sessionId: string) {
    const response = await apiClient.post<any>(`/pre-exam-v2/${sessionId}/complete`);
    return response?.data !== undefined ? response.data : response;
  },

  async getSession(sessionId: string) {
    const response = await apiClient.get<any>(`/pre-exam-v2/${sessionId}`);
    return response?.data !== undefined ? response.data : response;
  },

  async evaluateHealthAssessment(payload: {
    textInput?: string;
    symptoms?: any[];
    medicalHistory?: string[];
    medications?: string[];
    allergies?: string[];
    familyHistory?: string[];
    vitalSigns?: any;
    voiceFile?: File | null;
    imageFiles?: File[];
  }) {
    const formData = new FormData();
    if (payload.textInput) formData.append('textInput', payload.textInput);
    if (payload.symptoms) formData.append('symptoms', JSON.stringify(payload.symptoms));
    if (payload.medicalHistory) formData.append('medicalHistory', JSON.stringify(payload.medicalHistory));
    if (payload.medications) formData.append('medications', JSON.stringify(payload.medications));
    if (payload.allergies) formData.append('allergies', JSON.stringify(payload.allergies));
    if (payload.familyHistory) formData.append('familyHistory', JSON.stringify(payload.familyHistory));
    if (payload.vitalSigns) formData.append('vitalSigns', JSON.stringify(payload.vitalSigns));

    if (payload.voiceFile) formData.append('voice', payload.voiceFile);
    if (payload.imageFiles && payload.imageFiles.length > 0) {
      payload.imageFiles.forEach((file) => formData.append('images', file));
    }

    const response = await apiClient.post<any>('/pre-exam-v2/health-assessment', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response?.data !== undefined ? response.data : response;
  },
};
