import Link from "next/link";
import { ArrowUpRight, Baby, Pill, Sparkles } from "lucide-react";
import { buildMainCategoryCards } from "@/lib/categoryNav";
import { fetchCategories } from "@/lib/api/categories";

const CARD_STYLE = {
  medications: {
    icon: Pill,
    iconWrap: "bg-emerald-50 text-emerald-600",
    ring: "hover:ring-emerald-200",
  },
  "mother-child": {
    icon: Baby,
    iconWrap: "bg-amber-50 text-amber-600",
    ring: "hover:ring-amber-200",
  },
  cosmetics: {
    icon: Sparkles,
    iconWrap: "bg-pink-50 text-norix-magenta",
    ring: "hover:ring-pink-200",
  },
} as const;

export async function MainCategoryCards() {
  const categories = await fetchCategories();
  const cards = buildMainCategoryCards(categories);

  if (cards.length === 0) return null;

  return (
    <section className="py-4 md:py-6">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground md:text-2xl">
            კატეგორიები
          </h2>
          <p className="mt-1 text-sm text-norix-gray-600">
            აირჩიეთ სასურველი განყოფილება
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
        {cards.map((cat) => {
          const style =
            CARD_STYLE[cat.key as keyof typeof CARD_STYLE] ?? CARD_STYLE.medications;
          const Icon = style.icon;

          return (
            <Link
              key={cat.key}
              href={cat.href}
              className={`group flex items-center gap-4 rounded-2xl border border-norix-border/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-transparent transition-all hover:-translate-y-0.5 hover:shadow-md ${style.ring}`}
            >
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${style.iconWrap}`}
              >
                <Icon className="h-7 w-7" strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold text-foreground">{cat.title}</p>
                <p className="text-sm text-norix-gray-600">ნახვა →</p>
              </div>
              <ArrowUpRight className="h-5 w-5 shrink-0 text-norix-gray-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-norix-blue" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
