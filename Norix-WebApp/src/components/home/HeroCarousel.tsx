"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  sideLabel: string;
  image: string;
  brands: { name: string; discount: string }[];
}

const SLIDES: HeroSlide[] = [
  {
    id: "1",
    title: "ბრენდის დღე",
    subtitle: "Weleda · Teology · Payot",
    sideLabel: "BEAUTY",
    image:
      "https://images.unsplash.com/photo-1596462502278-27bfdd403348?w=800&q=80",
    brands: [
      { name: "Weleda", discount: "-30%" },
      { name: "Teology", discount: "-40%" },
      { name: "Payot", discount: "-50%" },
    ],
  },
  {
    id: "2",
    title: "ჯანმრთელობის კვირა",
    subtitle: "ვიტამინები და ბადები",
    sideLabel: "HEALTH",
    image:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
    brands: [
      { name: "Solgar", discount: "-25%" },
      { name: "Nature's", discount: "-35%" },
      { name: "Centrum", discount: "-20%" },
    ],
  },
  {
    id: "3",
    title: "ონლაინ შეთავაზება",
    subtitle: "მხოლოდ Norix-ზე",
    sideLabel: "ONLINE",
    image:
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80",
    brands: [
      { name: "Bioderma", discount: "-45%" },
      { name: "La Roche", discount: "-30%" },
      { name: "Vichy", discount: "-40%" },
    ],
  },
];

function ScallopedSide({ label }: { label: string }) {
  return (
    <div className="relative flex w-8 shrink-0 flex-col items-center justify-center bg-norix-magenta md:w-10">
      <div className="absolute inset-y-0 -right-3 w-6 overflow-hidden">
        <svg
          viewBox="0 0 24 400"
          preserveAspectRatio="none"
          className="h-full w-full"
          aria-hidden
        >
          <path
            d="M0,0 Q12,20 0,40 Q12,60 0,80 Q12,100 0,120 Q12,140 0,160 Q12,180 0,200 Q12,220 0,240 Q12,260 0,280 Q12,300 0,320 Q12,340 0,360 Q12,380 0,400 L24,400 L24,0 Z"
            fill="var(--norix-magenta)"
          />
        </svg>
      </div>
      <span
        className="relative z-10 text-[10px] font-bold tracking-widest text-white md:text-xs"
        style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
      >
        {label}
      </span>
    </div>
  );
}

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  const goTo = useCallback((index: number) => {
    setCurrent((index + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => goTo(current + 1), 8000);
    return () => clearInterval(timer);
  }, [current, goTo]);

  const slide = SLIDES[current];

  return (
    <section className="relative w-full px-4 py-4 md:px-8 md:py-6 lg:px-12">
      <div className="relative flex overflow-hidden rounded-2xl border-2 border-norix-magenta shadow-md">
        <ScallopedSide label={slide.sideLabel} />

        <div className="relative flex min-h-[220px] flex-1 items-center bg-white md:min-h-[280px]">
          <button
            type="button"
            onClick={() => goTo(current - 1)}
            className="absolute left-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-norix-gray-600 shadow-md transition-colors hover:bg-white md:left-4 md:h-10 md:w-10"
            aria-label="წინა სლაიდი"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex flex-1 flex-col gap-4 px-10 py-6 md:flex-row md:items-center md:gap-8 md:px-14 md:py-8">
            <div className="flex-1">
              <h2 className="text-2xl font-bold uppercase tracking-tight text-norix-magenta md:text-4xl">
                {slide.title}
              </h2>
              <p className="mt-1 text-sm text-norix-gray-600 md:text-base">
                {slide.subtitle}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {slide.brands.map((brand) => (
                  <div
                    key={brand.name}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-norix-magenta/20 bg-norix-magenta-light text-xs font-semibold text-norix-magenta md:h-16 md:w-16">
                      {brand.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-bold text-norix-magenta">
                      {brand.discount}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative hidden h-48 w-48 shrink-0 overflow-hidden rounded-xl md:block lg:h-56 lg:w-56">
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                className="object-cover"
                sizes="224px"
                priority={current === 0}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => goTo(current + 1)}
            className="absolute right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-norix-gray-600 shadow-md transition-colors hover:bg-white md:right-4 md:h-10 md:w-10"
            aria-label="შემდეგი სლაიდი"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <ScallopedSide label={slide.sideLabel} />
      </div>

      <div className="mt-3 flex justify-center gap-2">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all ${
              i === current
                ? "w-6 bg-norix-magenta"
                : "w-2 bg-norix-gray-200 hover:bg-norix-gray-400"
            }`}
            aria-label={`სლაიდი ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
