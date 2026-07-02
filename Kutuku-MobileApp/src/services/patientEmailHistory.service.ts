import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PatientLookup } from '@/src/services/prescriptions.service';

const RECENT_PATIENTS_KEY = '@doctor_recent_patients';
const MAX_RECENT = 12;

export type RecentPatient = PatientLookup;

export const PatientHistory = {
  async getRecent(): Promise<RecentPatient[]> {
    try {
      const raw = await AsyncStorage.getItem(RECENT_PATIENTS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as RecentPatient[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  async add(patient: RecentPatient): Promise<void> {
    const personalId = patient.personalId?.replace(/\D/g, '');
    if (!personalId) return;
    const recent = await this.getRecent();
    const next = [
      { ...patient, personalId },
      ...recent.filter((p) => p.personalId?.replace(/\D/g, '') !== personalId),
    ].slice(0, MAX_RECENT);
    await AsyncStorage.setItem(RECENT_PATIENTS_KEY, JSON.stringify(next));
  },
};

/** @deprecated use PatientHistory */
export const PatientEmailHistory = PatientHistory;
