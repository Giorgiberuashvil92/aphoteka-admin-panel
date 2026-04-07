/**
 * BOG — ერთი წყარო `AppModule`-ისა და `BogPaymentsService`-ისთვის.
 * ჩაწერე აქ ან გამოიყენე .env (იგივე სახელები) — სერვისი ყოველთვის ამასაც კითხულობს, თუ ConfigService-მა `bog` ვერ დააბრუნა.
 */
export type BogInlineConfig = {
  clientId: string;
  clientSecret: string;
  publicBaseUrl: string;
  callbackUrlFull: string;
};

export const BOG_INLINE: BogInlineConfig = {
  clientId: '',
  clientSecret: '',
  publicBaseUrl: '',
  callbackUrlFull: '',
};
