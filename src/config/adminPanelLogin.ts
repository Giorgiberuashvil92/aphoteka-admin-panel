/**
 * ადმინ პანელი — ფიქსირებული შესვლა (ლოკალური განვითარება / ტესტი).
 *
 * პრიორიტეტი: `NEXT_PUBLIC_ADMIN_LOGIN_*` env → ქვემოთ ჩაწერილი მნიშვნელობები.
 * თუ 401 — შეცვალე `phoneNumber` / `password` DB-ში არსებული აქტიური ადმინის მიხედვით,
 * ან ჩასვი JWT `ADMIN_PANEL_JWT_FALLBACK`-ში / `NEXT_PUBLIC_ADMIN_JWT`-ში.
 *
 * `NEXT_PUBLIC_*` და ეს ფაილი ბრაუზერში ჩანს — მხოლოდ შიდო გამოყენებისთვის.
 */

/** ცარიელია ნაგულისხმევად; ჩასვი ტოკენი თუ login არ გინდა */
export const ADMIN_PANEL_JWT_FALLBACK = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OWMwODkyZWVkMGRkNjRhMDU2MjkxNWYiLCJwaG9uZU51bWJlciI6Iis5OTU1NTUwMDAwMDAiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NzQyMjU3MTUsImV4cCI6MTc3NDgzMDUxNX0.pr5AVhDRwl3RlQ395XlMhCrs4qnwIDiVLrMPUKilPQI`;

export const ADMIN_PANEL_LOGIN = {
  phoneNumber:
    process.env.NEXT_PUBLIC_ADMIN_LOGIN_PHONE?.trim() || "+995555000000",
  password:
    process.env.NEXT_PUBLIC_ADMIN_LOGIN_PASSWORD?.trim() || "ChangeMe_Admin1!",
};
