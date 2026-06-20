import { SiteHeader } from "@/components/layout/SiteHeader";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { HomeTrustBar } from "@/components/home/HomeTrustBar";
import { MainCategoryCards } from "@/components/home/MainCategoryCards";
import { ProductOffersSection } from "@/components/home/ProductOffersSection";
import { fetchFeaturedProducts } from "@/lib/api/products";

export default async function HomePage() {
  const products = await fetchFeaturedProducts(10);

  return (
    <>
      <SiteHeader />
      <main className="w-full flex-1 bg-[#f8f9fb]">
        <HeroCarousel />
        <div className="w-full px-4 md:px-8 lg:px-12 xl:px-16">
          <HomeTrustBar />
          <MainCategoryCards />
          <ProductOffersSection products={products} />
        </div>
      </main>
    </>
  );
}
