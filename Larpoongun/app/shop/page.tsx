import Link from "next/link";
import type { Metadata } from "next";
import { ProductCard } from "@/components/ProductCard";
import { categories, products, type Category } from "@/lib/products";

export const metadata: Metadata = { title: "Shop" };

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const active = categories.find((c) => c.id === category)?.id as Category | undefined;
  const list = active ? products.filter((p) => p.category === active) : products;

  return (
    <div className="page">
      <div className="container">
        <header className="page-header">
          <h1>{active ? categories.find((c) => c.id === active)?.label : "All gear"}</h1>
          <p>{list.length} products</p>
        </header>

        <nav className="filter-bar" aria-label="Categories">
          <Link href="/shop" className={!active ? "chip active" : "chip"}>
            All
          </Link>
          {categories.map((c) => (
            <Link key={c.id} href={`/shop?category=${c.id}`} className={active === c.id ? "chip active" : "chip"}>
              {c.label}
            </Link>
          ))}
        </nav>

        <div className="product-grid">
          {list.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
