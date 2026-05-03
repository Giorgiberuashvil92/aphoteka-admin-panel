/**
 * Next `balanceClient` — ნაგულისხმევი Balance იუზერი/პაროლი.
 * Nest იგივე მნიშვნელობებს იყენებს `aphoteka-backend/src/config/balance-default-auth.ts`-ში (ორი ფაილი პარალელურად შეინარჩუნე).
 * პროდში გადაფარე `.env` / Railway: `BALANCE_USER_NAME`, `BALANCE_USER_PASSWORD`.
 */
export const BALANCE_DEV_DEFAULT_USER_NAME = 'Ntsulik@gmail.com' as const;
export const BALANCE_DEV_DEFAULT_USER_PASSWORD = '1985+Mai' as const;
