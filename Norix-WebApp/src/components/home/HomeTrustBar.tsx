import { CreditCard, Headphones, Truck } from "lucide-react";

const ITEMS = [
  {
    icon: Truck,
    title: "სწრაფი მიწოდება",
    desc: "თბილისში",
  },
  {
    icon: CreditCard,
    title: "უსაფრთხო გადახდა",
    desc: "საქართველოს ბანკი",
  },
  {
    icon: Headphones,
    title: "მხარდაჭერა",
    desc: "ონლაინ კონსულტაცია",
  },
] as const;

export function HomeTrustBar() {
  return (
    <section className="grid grid-cols-1 gap-3 py-6 sm:grid-cols-3 sm:gap-4">
      {ITEMS.map((item) => (
        <div
          key={item.title}
          className="flex items-center gap-4 rounded-2xl border border-norix-border/80 bg-white px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-norix-blue/8 text-norix-blue">
            <item.icon className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{item.title}</p>
            <p className="text-xs text-norix-gray-600">{item.desc}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
