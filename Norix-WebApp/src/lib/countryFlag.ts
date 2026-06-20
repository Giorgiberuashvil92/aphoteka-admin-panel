const COUNTRY_CODES: Record<string, string> = {
  გერმანია: "de",
  საქართველო: "ge",
  თურქეთი: "tr",
  იტალია: "it",
  საფრანგეთი: "fr",
  აშშ: "us",
  ამერიკა: "us",
  ინგლისი: "gb",
  უკრაინა: "ua",
  რუსეთი: "ru",
  პოლონეთი: "pl",
  სომხეთი: "am",
  აზერბაიჯანი: "az",
  ბულგარეთი: "bg",
  საბერძნეთი: "gr",
  ინდოეთი: "in",
  ჩინეთი: "cn",
  იაპონია: "jp",
  შვეიცარია: "ch",
  ბელგია: "be",
  ნიდერლანდები: "nl",
  ჰოლანდია: "nl",
  ესპანეთი: "es",
  პორტუგალია: "pt",
  ჩეხეთი: "cz",
  ავსტრია: "at",
  უნგრეთი: "hu",
  რუმინეთი: "ro",
};

export function countryFlagUrl(country?: string): string | null {
  const name = country?.trim();
  if (!name) return null;
  const code = COUNTRY_CODES[name];
  if (!code) return null;
  return `https://flagcdn.com/w40/${code}.png`;
}

export function countryFlagEmoji(country?: string): string {
  const name = country?.trim();
  if (!name) return "";
  const code = COUNTRY_CODES[name];
  if (!code) return "🌍";
  return code
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}
