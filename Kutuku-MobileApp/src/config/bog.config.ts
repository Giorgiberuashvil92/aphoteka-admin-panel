/**
 * BOG გადახდა მობილურში მხოლოდ სერვერის გავლით: `POST /orders/:id/payment/bog`.
 *
 * ⚠️ `BOG_CLIENT_SECRET` (და OAuth წყვილი) არასოდეს არ ჩაწეროთ ამ რეპოში ან აპის bundle-ში —
 * APK/IPA-დან მარტივად ირღვევა. ინახება მხოლოდ Nest `.env` / Railway (`bog.config` + `BOG_*`).
 *
 * ოფციონალური: მხოლოდ თუ როცეხეს UI-ში დაგჭირდებათ პუბლიკური იდენტიფიკატორი (ჩვეულებრივ არ სჭირდება).
 */
export const BOG_MOBILE_CONFIG = {
  clientId: process.env.EXPO_PUBLIC_BOG_CLIENT_ID?.trim() ?? '',
} as const;
