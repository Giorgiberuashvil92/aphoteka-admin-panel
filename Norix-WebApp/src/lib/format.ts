export function formatPrice(value: number): string {
  return `${value.toFixed(2)}₾`;
}

export function formatPriceSpaced(value: number): string {
  const fixed = value.toFixed(2);
  const [whole, fraction] = fixed.split(".");
  const spacedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${spacedWhole}.${fraction}₾`;
}
