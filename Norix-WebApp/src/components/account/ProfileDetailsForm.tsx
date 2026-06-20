"use client";

import { Check, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { changePassword, updateProfile } from "@/lib/api/auth";

export function ProfileDetailsForm() {
  const { user, refreshUser } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setPhone(user.phone ?? "");
    setEmail(user.email);
  }, [user]);

  if (!user) return null;

  const handleProfileSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);

    const result = await updateProfile(user.id, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
    });

    setSavingProfile(false);
    if (!result.success) {
      setProfileMessage(result.message);
      return;
    }

    await refreshUser();
    setProfileMessage("ცვლილებები შენახულია");
  };

  const handlePasswordSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordMessage(null);

    if (!currentPassword || !newPassword) {
      setPasswordMessage("შეავსეთ ყველა პაროლის ველი");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage("ახალი პაროლი მინიმუმ 6 სიმბოლო");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage("პაროლები არ ემთხვევა");
      return;
    }

    setSavingPassword(true);
    const result = await changePassword(currentPassword, newPassword);
    setSavingPassword(false);

    if (!result.success) {
      setPasswordMessage(result.message);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage("პაროლი შეცვლილია");
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-norix-border bg-white p-6 md:p-8">
        <h1 className="mb-6 text-2xl font-bold text-foreground">
          პროფილის დეტალები
        </h1>

        <form onSubmit={handleProfileSave} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-[180px_1fr] md:items-center">
            <label className="text-[15px] font-medium text-norix-gray-600">
              სახელი*
            </label>
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="h-12 rounded-xl border border-norix-border bg-norix-gray-100 px-4 text-[15px] outline-none focus:border-norix-blue-light focus:bg-white"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-[180px_1fr] md:items-center">
            <label className="text-[15px] font-medium text-norix-gray-600">
              გვარი*
            </label>
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className="h-12 rounded-xl border border-norix-border bg-norix-gray-100 px-4 text-[15px] outline-none focus:border-norix-blue-light focus:bg-white"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-[180px_1fr] md:items-center">
            <label className="text-[15px] font-medium text-norix-gray-600">
              ტელეფონის ნომერი*
            </label>
            <div className="relative">
              <input
                value={phone}
                readOnly
                className="h-12 w-full rounded-xl border border-norix-border bg-norix-gray-100 px-4 pr-36 text-[15px] outline-none"
              />
              {user.phoneVerified !== false && phone && (
                <span className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1.5 text-sm font-medium text-norix-green">
                  <Check className="h-4 w-4" />
                  ვერიფიცირებული
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-[180px_1fr] md:items-center">
            <label className="text-[15px] font-medium text-norix-gray-600">
              ელ.ფოსტა
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 rounded-xl border border-norix-border bg-norix-gray-100 px-4 text-[15px] outline-none focus:border-norix-blue-light focus:bg-white"
            />
          </div>

          {profileMessage && (
            <p className="text-sm text-norix-gray-600">{profileMessage}</p>
          )}

          <button
            type="submit"
            disabled={savingProfile}
            className="h-11 rounded-xl bg-norix-blue px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {savingProfile ? "ინახება..." : "დამახსოვრება"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-norix-border bg-white p-6 md:p-8">
        <h2 className="mb-6 text-2xl font-bold text-foreground">
          პაროლის შეცვლა
        </h2>

        <form onSubmit={handlePasswordSave} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-[180px_1fr] md:items-center">
            <label className="text-[15px] font-medium text-norix-gray-600">
              მიმდინარე პაროლი
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="h-12 w-full rounded-xl border border-norix-border bg-norix-gray-100 px-4 pr-12 text-[15px] outline-none focus:border-norix-blue-light focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((value) => !value)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-norix-gray-400"
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-[180px_1fr] md:items-center">
            <label className="text-[15px] font-medium text-norix-gray-600">
              ახალი პაროლი
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="h-12 w-full rounded-xl border border-norix-border bg-norix-gray-100 px-4 pr-12 text-[15px] outline-none focus:border-norix-blue-light focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((value) => !value)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-norix-gray-400"
              >
                {showNewPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-[180px_1fr] md:items-center">
            <label className="text-[15px] font-medium text-norix-gray-600">
              გაიმეორე პაროლი
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="h-12 rounded-xl border border-norix-border bg-norix-gray-100 px-4 text-[15px] outline-none focus:border-norix-blue-light focus:bg-white"
            />
          </div>

          {passwordMessage && (
            <p className="text-sm text-norix-gray-600">{passwordMessage}</p>
          )}

          <button
            type="submit"
            disabled={savingPassword}
            className="h-11 rounded-xl bg-norix-blue px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {savingPassword ? "ინახება..." : "პაროლის შეცვლა"}
          </button>
        </form>
      </section>
    </div>
  );
}
