import { API_CONFIG, getAuthHeaders } from '@/src/config/api.config';
import { UserService } from '@/src/services/user.service';

export type PatientLookup = {
  id: string;
  email?: string;
  fullName?: string;
  phoneNumber?: string;
};

export type LookupPatientResult =
  | { ok: true; patient: PatientLookup }
  | { ok: false; error: 'auth' | 'not_found' | 'network' | 'unknown'; message?: string };

export type SubmitPrescriptionResult =
  | { ok: true }
  | { ok: false; error: 'auth' | 'validation' | 'network' | 'unknown'; message?: string };

export type MyPrescriptionLine = {
  productId: string;
  productName: string;
  quantity: number;
  notes?: string;
};

export type MyPrescriptionRow = {
  id: string;
  createdAt?: string;
  items: MyPrescriptionLine[];
};

export type GetMyPrescriptionsResult =
  | { ok: true; prescriptions: MyPrescriptionRow[] }
  | {
      ok: false;
      error: 'no_token' | 'unauthorized' | 'network' | 'unknown';
      message?: string;
    };

async function authHeaders() {
  const token = await UserService.getAccessToken();
  if (!token) return null;
  return getAuthHeaders(token);
}

export const PrescriptionsApi = {
  async getMyPrescriptions(): Promise<GetMyPrescriptionsResult> {
    const token = await UserService.getAccessToken();
    if (!token?.trim()) return { ok: false, error: 'no_token' };
    const headers = getAuthHeaders(token.trim());
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.prescriptions.my}`;
      const res = await fetch(url, { method: 'GET', headers });
      if (res.status === 401 || res.status === 403) {
        return { ok: false, error: 'unauthorized' };
      }
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        return { ok: false, error: 'unknown', message: text || `HTTP ${res.status}` };
      }
      const prescriptions = (await res.json()) as MyPrescriptionRow[];
      return { ok: true, prescriptions: Array.isArray(prescriptions) ? prescriptions : [] };
    } catch (e) {
      return {
        ok: false,
        error: 'network',
        message: e instanceof Error ? e.message : undefined,
      };
    }
  },

  async lookupPatientByEmail(email: string): Promise<LookupPatientResult> {
    const headers = await authHeaders();
    if (!headers) return { ok: false, error: 'auth' };
    const q = email?.trim();
    if (!q) return { ok: false, error: 'unknown', message: 'ელფოსტა ცარიელია' };

    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.users.lookupByEmail}?email=${encodeURIComponent(q)}`;
      const res = await fetch(url, { method: 'GET', headers });
      if (res.status === 401 || res.status === 403) return { ok: false, error: 'auth' };
      if (res.status === 404) {
        const j = await res.json().catch(() => ({}));
        return {
          ok: false,
          error: 'not_found',
          message: j.message || 'პაციენტი არ მოიძებნა',
        };
      }
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        return { ok: false, error: 'unknown', message: text || `HTTP ${res.status}` };
      }
      const patient = (await res.json()) as PatientLookup;
      return { ok: true, patient };
    } catch (e) {
      return {
        ok: false,
        error: 'network',
        message: e instanceof Error ? e.message : undefined,
      };
    }
  },

  async createPrescription(
    patientEmail: string,
    items: { productId: string; quantity: number; notes?: string }[],
  ): Promise<SubmitPrescriptionResult> {
    const headers = await authHeaders();
    if (!headers) return { ok: false, error: 'auth' };

    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.prescriptions.create}`;
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ patientEmail: patientEmail.trim(), items }),
      });
      if (res.status === 401 || res.status === 403) return { ok: false, error: 'auth' };
      if (res.status === 400) {
        const j = await res.json().catch(() => ({}));
        const msg = Array.isArray(j.message) ? j.message.join(', ') : j.message;
        return { ok: false, error: 'validation', message: msg || 'მონაცემები არასწორია' };
      }
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        return { ok: false, error: 'unknown', message: text || `HTTP ${res.status}` };
      }
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        error: 'network',
        message: e instanceof Error ? e.message : undefined,
      };
    }
  },
};
