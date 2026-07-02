import { API_CONFIG, getAuthHeaders } from '@/src/config/api.config';
import { UserService } from '@/src/services/user.service';

export type PatientLookup = {
  id: string;
  personalId?: string;
  email?: string;
  fullName?: string;
  phoneNumber?: string;
};

export type LookupPatientResult =
  | { ok: true; patient: PatientLookup }
  | { ok: false; error: 'auth' | 'not_found' | 'network' | 'unknown'; message?: string };

export type SearchPatientsResult =
  | { ok: true; patients: PatientLookup[] }
  | { ok: false; error: 'auth' | 'network' | 'unknown'; message?: string };

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
  /** ექიმის სახელი, ვინც დანიშნა */
  prescribedByName?: string;
  prescribedByEmail?: string;
  items: MyPrescriptionLine[];
};

export type GetMyPrescriptionsResult =
  | { ok: true; prescriptions: MyPrescriptionRow[] }
  | {
      ok: false;
      error: 'no_token' | 'unauthorized' | 'network' | 'unknown';
      message?: string;
    };

function normalizePersonalId(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 11);
}

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

  async lookupPatientByPersonalId(personalId: string): Promise<LookupPatientResult> {
    const headers = await authHeaders();
    if (!headers) return { ok: false, error: 'auth' };
    const digits = normalizePersonalId(personalId);
    if (!digits) {
      return { ok: false, error: 'unknown', message: 'პირადი ნომერი ცარიელია' };
    }
    if (digits.length !== 11) {
      return { ok: false, error: 'unknown', message: 'პირადი ნომერი უნდა იყოს 11 ციფრი' };
    }

    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.users.lookupByPersonalId}?personalId=${encodeURIComponent(digits)}`;
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

  async searchPatientsByPersonalId(query: string, limit = 8): Promise<SearchPatientsResult> {
    const headers = await authHeaders();
    if (!headers) return { ok: false, error: 'auth' };
    const digits = normalizePersonalId(query);
    if (!digits || digits.length < 3) return { ok: true, patients: [] };

    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.users.searchByPersonalId}?q=${encodeURIComponent(digits)}&limit=${limit}`;
      const res = await fetch(url, { method: 'GET', headers });
      if (res.status === 401 || res.status === 403) return { ok: false, error: 'auth' };
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        return { ok: false, error: 'unknown', message: text || `HTTP ${res.status}` };
      }
      const patients = (await res.json()) as PatientLookup[];
      return { ok: true, patients: Array.isArray(patients) ? patients : [] };
    } catch (e) {
      return {
        ok: false,
        error: 'network',
        message: e instanceof Error ? e.message : undefined,
      };
    }
  },

  /** @deprecated პირადი ნომრით გამოიყენეთ lookupPatientByPersonalId */
  async lookupPatientByEmail(email: string): Promise<LookupPatientResult> {
    return this.lookupPatientByPersonalId(email);
  },

  /** @deprecated პირადი ნომრით გამოიყენეთ searchPatientsByPersonalId */
  async searchPatientsByEmail(query: string, limit = 8): Promise<SearchPatientsResult> {
    return this.searchPatientsByPersonalId(query, limit);
  },

  async createPrescription(
    patientPersonalId: string,
    items: { productId: string; quantity: number; notes?: string }[],
  ): Promise<SubmitPrescriptionResult> {
    const headers = await authHeaders();
    if (!headers) return { ok: false, error: 'auth' };
    const digits = normalizePersonalId(patientPersonalId);
    if (digits.length !== 11) {
      return { ok: false, error: 'validation', message: 'პირადი ნომერი უნდა იყოს 11 ციფრი' };
    }

    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.prescriptions.create}`;
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ patientPersonalId: digits, items }),
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
