"use client";

import {
  Building2,
  Eye,
  EyeOff,
  IdCard,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { AccountType, RegisterPayload } from "@/types/auth";
import { AuthField } from "./AuthField";

interface RegisterFormProps {
  loading: boolean;
  onSubmit: (payload: RegisterPayload) => void;
  onLoginClick: () => void;
}

type FieldErrors = Record<string, string>;

function emptyErrors(): FieldErrors {
  return {};
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function RegisterForm({
  loading,
  onSubmit,
  onLoginClick,
}: RegisterFormProps) {
  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [personalId, setPersonalId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [legalId, setLegalId] = useState("");
  const [address, setAddress] = useState("");
  const [representative, setRepresentative] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>(emptyErrors());

  const switchAccountType = (type: AccountType) => {
    setAccountType(type);
    setErrors(emptyErrors());
    if (type === "individual") {
      setCompanyName("");
      setLegalId("");
      setRepresentative("");
    } else {
      setFirstName("");
      setLastName("");
      setPersonalId("");
    }
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    let valid = true;

    if (!email.trim()) {
      next.email = "ელ.ფოსტა სავალდებულოა";
      valid = false;
    } else if (!isValidEmail(email)) {
      next.email = "შეიყვანეთ სწორი ელ.ფოსტა";
      valid = false;
    }

    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 9) {
      next.phone = "ტელეფონი სავალდებულოა";
      valid = false;
    }

    if (!password) {
      next.password = "პაროლი სავალდებულოა";
      valid = false;
    } else if (password.length < 8) {
      next.password = "პაროლი მინიმუმ 8 სიმბოლო";
      valid = false;
    }

    if (password !== confirmPassword) {
      next.confirmPassword = "პაროლები არ ემთხვევა";
      valid = false;
    }

    if (!acceptedTerms) {
      next.terms = "წესებსა და პირობებზე თანხმობა სავალდებულოა";
      valid = false;
    }

    if (accountType === "individual") {
      if (!firstName.trim()) {
        next.firstName = "სახელი სავალდებულოა";
        valid = false;
      }
      if (!lastName.trim()) {
        next.lastName = "გვარი სავალდებულოა";
        valid = false;
      }
      if (personalId.replace(/\D/g, "").length !== 11) {
        next.personalId = "პირადი ნომერი — 11 ციფრი";
        valid = false;
      }
      if (!address.trim()) {
        next.address = "მისამართი სავალდებულოა";
        valid = false;
      }
    } else {
      if (!companyName.trim()) {
        next.companyName = "დასახელება სავალდებულოა";
        valid = false;
      }
      if (!legalId.trim()) {
        next.legalId = "საიდენტიფიკაციო კოდი სავალდებულოა";
        valid = false;
      }
      if (!address.trim()) {
        next.address = "მისამართი სავალდებულოა";
        valid = false;
      }
    }

    setErrors(next);
    return valid;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const common = {
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      ...(country.trim() ? { country: country.trim() } : {}),
    };

    if (accountType === "individual") {
      onSubmit({
        accountType: "individual",
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        personalId: personalId.replace(/\D/g, ""),
        address: address.trim(),
        ...common,
      });
      return;
    }

    onSubmit({
      accountType: "legal",
      companyName: companyName.trim(),
      legalId: legalId.trim(),
      address: address.trim(),
      ...(representative.trim()
        ? { representative: representative.trim() }
        : {}),
      ...common,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-norix-gray-100 p-1">
        <button
          type="button"
          onClick={() => switchAccountType("individual")}
          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
            accountType === "individual"
              ? "bg-white text-norix-blue shadow-sm"
              : "text-norix-gray-600 hover:text-foreground"
          }`}
        >
          <User className="h-4 w-4" />
          ფიზიკური
        </button>
        <button
          type="button"
          onClick={() => switchAccountType("legal")}
          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
            accountType === "legal"
              ? "bg-white text-norix-blue shadow-sm"
              : "text-norix-gray-600 hover:text-foreground"
          }`}
        >
          <Building2 className="h-4 w-4" />
          იურიდიული
        </button>
      </div>

      {accountType === "individual" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <AuthField
              placeholder="სახელი"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              error={errors.firstName}
              leftIcon={<User className="h-5 w-5" />}
            />
            <AuthField
              placeholder="გვარი"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              error={errors.lastName}
              leftIcon={<User className="h-5 w-5" />}
            />
          </div>
          <AuthField
            placeholder="პირადი ნომერი (11 ციფრი)"
            value={personalId}
            onChange={(event) => setPersonalId(event.target.value)}
            inputMode="numeric"
            error={errors.personalId}
            leftIcon={<IdCard className="h-5 w-5" />}
          />
        </>
      ) : (
        <>
          <AuthField
            placeholder="შპს / დასახელება"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            error={errors.companyName}
            leftIcon={<Building2 className="h-5 w-5" />}
          />
          <AuthField
            placeholder="საიდენტიფიკაციო კოდი"
            value={legalId}
            onChange={(event) => setLegalId(event.target.value)}
            error={errors.legalId}
            leftIcon={<IdCard className="h-5 w-5" />}
          />
          <AuthField
            placeholder="წარმომადგენელი (არასავალდებულო)"
            value={representative}
            onChange={(event) => setRepresentative(event.target.value)}
            error={errors.representative}
            leftIcon={<UserCircle className="h-5 w-5" />}
          />
        </>
      )}

      <AuthField
        placeholder="მისამართი"
        value={address}
        onChange={(event) => setAddress(event.target.value)}
        error={errors.address}
        leftIcon={<MapPin className="h-5 w-5" />}
      />

      <AuthField
        placeholder="ქვეყანა (არასავალდებულო)"
        value={country}
        onChange={(event) => setCountry(event.target.value)}
        error={errors.country}
      />

      <AuthField
        placeholder="ტელეფონი +995"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        inputMode="tel"
        error={errors.phone}
        leftIcon={<Phone className="h-5 w-5" />}
      />

      <AuthField
        type="email"
        placeholder="ელ.ფოსტა"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoComplete="email"
        error={errors.email}
        leftIcon={<Mail className="h-5 w-5" />}
      />

      <AuthField
        type={showPassword ? "text" : "password"}
        placeholder="პაროლი"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="new-password"
        error={errors.password}
        leftIcon={<Lock className="h-5 w-5" />}
        rightSlot={
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="text-norix-gray-400 transition-colors hover:text-norix-gray-600"
            aria-label={showPassword ? "პაროლის დამალვა" : "პაროლის ჩვენება"}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        }
      />

      <AuthField
        type={showPassword ? "text" : "password"}
        placeholder="გაიმეორე პაროლი"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        autoComplete="new-password"
        error={errors.confirmPassword}
        leftIcon={<Lock className="h-5 w-5" />}
      />

      <label className="flex items-start gap-3 text-sm leading-6 text-norix-gray-600">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(event) => setAcceptedTerms(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-norix-border text-norix-blue focus:ring-norix-blue"
        />
        <span>
          ვეთანხმები{" "}
          <Link href="/terms" className="text-norix-blue underline">
            წესებს და პირობებს
          </Link>
        </span>
      </label>
      {errors.terms && <p className="text-sm text-red-500">{errors.terms}</p>}

      <button
        type="submit"
        disabled={loading}
        className="h-12 w-full rounded-xl bg-norix-blue text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "იტვირთება..." : "რეგისტრაცია"}
      </button>

      <div className="pt-1 text-center">
        <button
          type="button"
          onClick={onLoginClick}
          className="text-base font-medium text-norix-blue hover:underline"
        >
          ავტორიზაცია
        </button>
      </div>
    </form>
  );
}
