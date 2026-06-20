export type AccountType = "individual" | "legal";

export type AuthView = "login" | "register";

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  phoneVerified?: boolean;
  buyerId?: string;
  balanceBuyerUid?: string;
}

export type RegisterPayload =
  | {
      accountType: "individual";
      firstName: string;
      lastName: string;
      personalId: string;
      address: string;
      country?: string;
      email: string;
      phone: string;
      password: string;
    }
  | {
      accountType: "legal";
      companyName: string;
      legalId: string;
      address: string;
      representative?: string;
      country?: string;
      email: string;
      phone: string;
      password: string;
    };
