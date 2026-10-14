import Link from "next/link";
import OceanScene from "@/components/OceanScene";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/lib/products";

export default function HomePage() {
  const spearguns = products.filter((p) => p.category === "spearguns");
  const suitsAndFins = products.filter((p) => p.featured && (p.category === "wetsuits" || p.category === "fins"));
  const accessories = products.filter((p) => p.category === "accessories" || p.category === "masks").slice(0, 3);

  return (
    <div className="home">
      <OceanScene />

      <section className="zone zone-hero">
        <div className="container">
          <span className="zone-depth">0 m · Surface</span>
          <h1>
            Hunt <em>deeper.</em>
          </h1>
          <p className="lead">
            Spearguns and freediving gear built for the moment the blue goes quiet. Scroll down to start your dive.
          </p>
          <div className="hero-actions">
            <Link href="/shop?category=spearguns" className="btn btn-lg">
              Shop spearguns
            </Link>
            <Link href="/shop" className="btn btn-lg btn-ghost">
              All gear
            </Link>
          </div>
          <div className="scroll-hint" aria-hidden="true">
            <span />
            Dive
          </div>
        </div>
      </section>

      <section className="zone">
        <div className="container">
          <div className="zone-panel">
            <span className="zone-depth">5 m · The Reef</span>
            <h2>Spearguns</h2>
            <p className="zone-intro">From tight reef holes to open-water pelagics, pick the length that fits your water.</p>
            <div className="product-grid">
              {spearguns.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="zone">
        <div className="container">
          <div className="zone-panel">
            <span className="zone-depth">15 m · Open Blue</span>
            <h2>Built for the long breath-hold</h2>
            <ul className="feature-list">
              <li>
                <strong>Carbon where it counts</strong>
                Stiff barrels, light fins, less effort on every kick.
              </li>
              <li>
                <strong>Tested at depth</strong>
                Every gun is test-fired and every suit is pressure-checked.
              </li>
              <li>
                <strong>2-year warranty</strong>
                On all spearguns and fins. Bands are replaced free in year one.
              </li>
            </ul>
            <div className="product-grid">
              {suitsAndFins.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="zone">
        <div className="container">
          <div className="zone-panel zone-panel-dark">
            <span className="zone-depth">28 m · Twilight</span>
            <h2>The small things that bring you home</h2>
            <p className="zone-intro">Knives, floats, gloves and masks. Don&apos;t leave the boat without them.</p>
            <div className="product-grid">
              {accessories.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="zone zone-catch">
        <div className="container">
          <div className="catch-copy">
            <span className="zone-depth">40 m · The Catch</span>
            <h2>One breath. One shot.</h2>
            <p>Everything you need for your next dive is in the shop.</p>
            <Link href="/shop" className="btn btn-lg">
              Gear up
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
