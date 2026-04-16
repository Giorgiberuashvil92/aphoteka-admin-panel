/**
 * ადმინ პანელი — ფიქსირებული შესვლა (ლოკალური განვითარება / ტესტი).
 *
 * პრიორიტეტი: `NEXT_PUBLIC_ADMIN_LOGIN_*` env → ქვემოთ ჩაწერილი მნიშვნელობები.
 * თუ 401 — შეცვალე `phoneNumber` / `password` DB-ში არსებული აქტიური ადმინის მიხედვით,
 * ან ჩასვი JWT `ADMIN_PANEL_JWT_FALLBACK`-ში / `NEXT_PUBLIC_ADMIN_JWT`-ში.
 *
 * `NEXT_PUBLIC_*` და ეს ფაილი ბრაუზერში ჩანს — მხოლოდ შიდო გამოყენებისთვის.
 */

/** ცარიელი ნაგულისხმევად — შედით `/login`-ით ან გამოიყენეთ `NEXT_PUBLIC_ADMIN_JWT` (მხოლოდ dev). არ ჩასვათ რეალური JWT რეპოში. */
export const ADMIN_PANEL_JWT_FALLBACK = "";

export const ADMIN_PANEL_LOGIN = {
  phoneNumber:
    process.env.NEXT_PUBLIC_ADMIN_LOGIN_PHONE?.trim() || "+995555000000",
  password:
    process.env.NEXT_PUBLIC_ADMIN_LOGIN_PASSWORD?.trim() || "ChangeMe_Admin1!",
};
