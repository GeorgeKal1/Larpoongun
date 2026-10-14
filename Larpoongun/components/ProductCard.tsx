import Link from "next/link";
import { formatPrice, type Product } from "@/lib/products";
import { ProductArt } from "./ProductArt";
import { AddToCartButton } from "./AddToCartButton";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <Link href={`/products/${product.slug}`} className="product-card-link">
        <ProductArt art={product.art} accent={product.accent} />
        <div className="product-card-body">
          <h3>{product.name}</h3>
          <p>{product.tagline}</p>
        </div>
      </Link>
      <div className="product-card-footer">
        <span className="price">{formatPrice(product.price)}</span>
        <AddToCartButton slug={product.slug} compact />
      </div>
    </article>
  );
}
