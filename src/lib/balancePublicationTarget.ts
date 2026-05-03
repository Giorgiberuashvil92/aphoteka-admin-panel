/**
 * Balance Cloud `.../Balance/{ApplicationID}/hs/Exchange/...`
 * ამ ადმინის სამიზნე პუბლიკაცია. სერვერზე `balanceClient` იყენებს იგივეს,
 * თუ `BALANCE_PUBLICATION_ID` env არ ცვლის (იხილე `balanceClient.ts`).
 * Nest (`balance-exchange.service.ts`) — იგივე ნაგულისხმევი ID, თუ env ცარიელია.
 * „use client“ კომპონენტებიდან იმპორტი — node-მოდულების გარეშე.
 */
export const BALANCE_PUBLICATION_TARGET = '7596' as const;
