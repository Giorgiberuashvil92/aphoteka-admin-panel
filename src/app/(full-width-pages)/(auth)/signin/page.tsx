import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "შესვლა | ადმინ",
  description: "აფოტეკა ადმინ პანელი — ავტორიზაცია",
};

/** `/signin` ძველი ბმულები — რეალური ფორმა `/login`-ზეა (ტელეფონი + პაროლი, Nest). */
export default async function SignInRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, val] of Object.entries(sp)) {
    if (typeof val === "string" && val) {
      qs.set(key, val);
    } else if (Array.isArray(val)) {
      for (const v of val) {
        if (v) qs.append(key, v);
      }
    }
  }
  const suffix = qs.toString();
  redirect(suffix ? `/login?${suffix}` : "/login");
}
