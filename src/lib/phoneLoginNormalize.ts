/**
 * Nest `/auth/login` ეძებს `phoneNumber`-ს ზუსტად DB-ის მნიშვნელობით —
 * ხშირად `+9955XXXXXXXX`. აპიდან შეყვანილი `555...` / `995...` ერთ სტანდარტზე მოვიყვანოთ.
 */
export function normalizePhoneForAdminLogin(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  const digits = t.replace(/\D/g, '');
  if (digits.length === 9 && digits.startsWith('5')) {
    return `+995${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('995')) {
    return `+${digits}`;
  }
  if (digits.length === 10 && digits.startsWith('05')) {
    return `+995${digits.slice(1)}`;
  }
  if (t.startsWith('+')) {
    const d = t.slice(1).replace(/\D/g, '');
    if (d.length === 12 && d.startsWith('995')) {
      return `+${d}`;
    }
  }
  return t;
}
