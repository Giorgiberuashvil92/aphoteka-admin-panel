import { SiteHeader } from "@/components/layout/SiteHeader";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { MainCategoryCards } from "@/components/home/MainCategoryCards";
import { ProductOffersSection } from "@/components/home/ProductOffersSection";
import { fetchFeaturedProducts } from "@/lib/api/products";

export default async function HomePage() {
  const products = await fetchFeaturedProducts(5);

  return (
    <>
      <SiteHeader />
      <main className="w-full flex-1">
        <HeroCarousel />
        <div className="w-full px-4 md:px-8 lg:px-12">
          <MainCategoryCards />
          <ProductOffersSection products={products} />
        </div>
      </main>
    </>
  );
}
