"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  image: string;
  ctaHref: string;
  accent: string;
}

const SLIDES: HeroSlide[] = [
  {
    id: "1",
    title: "ბრენდის დღე",
    subtitle: "Weleda · Teology · Payot — ფასდაკლება 50%-მდე",
    tag: "კოსმეტიკა",
    image:
      "https://images.unsplash.com/photo-1596462502278-27bfdd403348?w=1200&q=80",
    ctaHref: "/search?q=კოსმეტიკა",
    accent: "from-norix-magenta/15 via-white to-white",
  },
  {
    id: "2",
    title: "ჯანმრთელობის კვირა",
    subtitle: "ვიტამინები, ბადები და ველნესი",
    tag: "ველნესი",
    image:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80",
    ctaHref: "/search?q=ვიტამინი",
    accent: "from-norix-green/15 via-white to-white",
  },
  {
    id: "3",
    title: "ონლაინ შეთავაზება",
    subtitle: "მხოლოდ Norix-ზე — ახალი ფასები ყოველდღე",
    tag: "აქცია",
    image:
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1200&q=80",
    ctaHref: "/search",
    accent: "from-norix-blue/10 via-white to-white",
  },
];

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  const goTo = useCallback((index: number) => {
    setCurrent((index + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => goTo(current + 1), 7000);
    return () => clearInterval(timer);
  }, [current, goTo]);

  const slide = SLIDES[current];

  return (
    <section className="w-full">
      <div
        className={`relative w-full overflow-hidden bg-gradient-to-br ${slide.accent}`}
      >
        <div className="grid min-h-[280px] md:min-h-[360px] lg:min-h-[400px] md:grid-cols-[1.05fr_1fr]">
          <div className="relative z-10 flex flex-col justify-center px-6 py-8 md:px-10 md:py-10 lg:px-16 xl:px-20">
            <span className="mb-3 inline-flex w-fit rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-norix-blue ring-1 ring-norix-border/60 backdrop-blur-sm">
              {slide.tag}
            </span>
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl lg:text-[2.75rem]">
              {slide.title}
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-norix-gray-600 md:text-base lg:max-w-2xl">
              {slide.subtitle}
            </p>
            <Link
              href={slide.ctaHref}
              className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl bg-norix-blue px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              იხილე შეთავაზება
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative hidden min-h-[200px] md:block">
            <Image
              src={slide.image}
              alt=""
              fill
              className="object-cover object-center"
              sizes="50vw"
              priority={current === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/40 to-transparent" />
          </div>
        </div>

        <button
          type="button"
          onClick={() => goTo(current - 1)}
          className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-norix-gray-600 shadow-md transition-colors hover:bg-white md:left-4"
          aria-label="წინა სლაიდი"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => goTo(current + 1)}
          className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-norix-gray-600 shadow-md transition-colors hover:bg-white md:right-4"
          aria-label="შემდეგი სლაიდი"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === current
                  ? "w-8 bg-norix-blue"
                  : "w-1.5 bg-norix-gray-300 hover:bg-norix-gray-400"
              }`}
              aria-label={`სლაიდი ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
