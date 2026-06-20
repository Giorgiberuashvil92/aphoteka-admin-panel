import { fetchCategories } from "@/lib/api/categories";
import { SiteHeaderClient } from "./SiteHeaderClient";

export async function SiteHeader() {
  const categories = await fetchCategories();
  return <SiteHeaderClient categories={categories} />;
}
