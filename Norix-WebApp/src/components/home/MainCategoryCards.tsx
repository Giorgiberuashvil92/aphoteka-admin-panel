import Link from "next/link";
import { Baby, Pill, Sparkles } from "lucide-react";
import { buildMainCategoryCards } from "@/lib/categoryNav";
import { fetchCategories } from "@/lib/api/categories";

const CARD_ICONS = {
  medications: Pill,
  "mother-child": Baby,
  cosmetics: Sparkles,
} as const;

export async function MainCategoryCards() {
  const categories = await fetchCategories();
  const cards = buildMainCategoryCards(categories);

  if (cards.length === 0) return null;

  return (
    <section className="grid grid-cols-1 gap-3 py-2 sm:grid-cols-3 md:gap-4 md:py-4">
      {cards.map((cat) => {
        const Icon = CARD_ICONS[cat.key as keyof typeof CARD_ICONS] ?? Pill;
        return (
          <Link
            key={cat.key}
            href={cat.href}
            className={`group flex items-center justify-between rounded-xl ${cat.bg} px-6 py-5 text-white transition-transform hover:scale-[1.02] md:px-8 md:py-6`}
          >
            <span className="text-lg font-semibold md:text-xl lg:text-2xl">
              {cat.title}
            </span>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/25 transition-colors group-hover:bg-white/35 md:h-16 md:w-16">
              <Icon className="h-7 w-7 md:h-8 md:w-8" strokeWidth={1.5} />
            </div>
          </Link>
        );
      })}
    </section>
  );
}
