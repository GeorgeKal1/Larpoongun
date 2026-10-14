import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductArt } from "@/components/ProductArt";
import { ProductCard } from "@/components/ProductCard";
import { QuantityAdd } from "@/components/QuantityAdd";
import { categories, formatPrice, getProduct, products } from "@/lib/products";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  return { title: product?.name ?? "Not found" };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const category = categories.find((c) => c.id === product.category);
  const related = products.filter((p) => p.category === product.category && p.slug !== product.slug).slice(0, 3);

  return (
    <div className="page">
      <div className="container">
        <nav className="breadcrumbs">
          <Link href="/shop">Shop</Link> /{" "}
          <Link href={`/shop?category=${product.category}`}>{category?.label}</Link> / <span>{product.name}</span>
        </nav>

        <div className="product-detail">
          <div className="product-detail-art">
            <ProductArt art={product.art} accent={product.accent} />
          </div>
          <div className="product-detail-info">
            <h1>{product.name}</h1>
            <p className="tagline">{product.tagline}</p>
            <p className="price price-lg">{formatPrice(product.price)}</p>
            <p>{product.description}</p>
            <QuantityAdd slug={product.slug} />
            <dl className="specs">
              {Object.entries(product.specs).map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {related.length > 0 && (
          <section className="related">
            <h2>You might also like</h2>
            <div className="product-grid">
              {related.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
