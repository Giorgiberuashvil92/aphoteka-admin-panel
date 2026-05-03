/** კარტზე/სიაში: მხოლოდ genericName — ბრენდის/სრული name არ ჩანს */
export function productCardDisplayName(p: { genericName?: string; name?: string }) {
  const gen = (p.genericName ?? '').trim();
  return { name: gen || '—', genericName: undefined as string | undefined };
}
