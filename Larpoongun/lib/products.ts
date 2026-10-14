export type Category = "spearguns" | "shafts" | "wetsuits" | "fins" | "masks" | "accessories";

export type ArtKind = "speargun" | "shaft" | "wetsuit" | "fins" | "mask" | "knife" | "float" | "gloves";

export interface Product {
  slug: string;
  name: string;
  category: Category;
  price: number;
  tagline: string;
  description: string;
  specs: Record<string, string>;
  art: ArtKind;
  accent: string;
  featured?: boolean;
}

export const categories: { id: Category; label: string }[] = [
  { id: "spearguns", label: "Spearguns" },
  { id: "shafts", label: "Shafts & Tips" },
  { id: "wetsuits", label: "Wetsuits" },
  { id: "fins", label: "Fins" },
  { id: "masks", label: "Masks & Snorkels" },
  { id: "accessories", label: "Accessories" },
];

export const products: Product[] = [
  {
    slug: "reef-runner-75",
    name: "Reef Runner 75",
    category: "spearguns",
    price: 289,
    tagline: "Compact, quick and quiet in the rocks.",
    description:
      "A short, nimble band gun built for tight reef and low-visibility hunting. The open track and teak-composite stock keep it balanced and fast on the swing.",
    specs: { Length: "75 cm", Bands: "1 × 16 mm", Shaft: "6.5 mm Tahitian", Stock: "Teak composite" },
    art: "speargun",
    accent: "#4fb3e8",
    featured: true,
  },
  {
    slug: "bluewater-110",
    name: "Bluewater 110",
    category: "spearguns",
    price: 549,
    tagline: "Range and power for open water.",
    description:
      "Our long-range bluewater gun with a carbon-reinforced barrel and double roller bands. Built to reach pelagics that keep their distance.",
    specs: { Length: "110 cm", Bands: "2 × 16 mm (roller)", Shaft: "7 mm Tahitian", Barrel: "Carbon-reinforced" },
    art: "speargun",
    accent: "#1f6fb2",
    featured: true,
  },
  {
    slug: "abyss-carbon-130",
    name: "Abyss Carbon 130",
    category: "spearguns",
    price: 899,
    tagline: "The flagship. Full carbon, zero recoil.",
    description:
      "Full carbon barrel, enclosed track and a precision-machined trigger mechanism. Recoil-free tracking for the deepest, longest shots.",
    specs: { Length: "130 cm", Bands: "3 × 16 mm", Shaft: "7.5 mm Tahitian", Barrel: "Full carbon" },
    art: "speargun",
    accent: "#0b3c6e",
    featured: true,
  },
  {
    slug: "tahitian-shaft-7mm",
    name: "Tahitian Shaft 7 mm",
    category: "shafts",
    price: 59,
    tagline: "Spring steel, sharpened tri-cut tip.",
    description: "Heat-treated spring steel shaft with notched shark fins and a single flopper. Holds a straight line, shot after shot.",
    specs: { Diameter: "7 mm", Lengths: "120–160 cm", Steel: "Spring steel 17-7", Tip: "Tri-cut" },
    art: "shaft",
    accent: "#8fd3f4",
  },
  {
    slug: "tri-cut-slip-tip",
    name: "Tri-Cut Slip Tip",
    category: "shafts",
    price: 34,
    tagline: "Toggle tip for big, strong fish.",
    description: "A detachable slip tip that toggles on impact for a secure hold on powerful fish. Includes stainless cable.",
    specs: { Fits: "6.5–7.5 mm shafts", Material: "Stainless 316", Cable: "1.5 mm" },
    art: "shaft",
    accent: "#5cb8e6",
  },
  {
    slug: "thermocline-5mm",
    name: "Thermocline 5 mm Wetsuit",
    category: "wetsuits",
    price: 329,
    tagline: "Open-cell warmth with ocean camo.",
    description: "Two-piece open-cell neoprene suit with a blue-water camo print, chest loading pad and reinforced knees.",
    specs: { Thickness: "5 mm", Lining: "Open cell", Pattern: "Bluewater camo", Pieces: "2" },
    art: "wetsuit",
    accent: "#2a7fc1",
    featured: true,
  },
  {
    slug: "riptide-3mm",
    name: "Riptide 3 mm Wetsuit",
    category: "wetsuits",
    price: 219,
    tagline: "Warm-water freedom of movement.",
    description: "Lightweight lined suit for warmer seas. Super-stretch neoprene that won't fight you on the dive.",
    specs: { Thickness: "3 mm", Lining: "Nylon / smooth skin", Pieces: "2" },
    art: "wetsuit",
    accent: "#5cb8e6",
  },
  {
    slug: "glide-carbon-fins",
    name: "Glide Carbon Fins",
    category: "fins",
    price: 399,
    tagline: "Long blades, long dives.",
    description: "Hand-laid carbon blades on comfortable full-foot pockets. More thrust with less effort on every kick.",
    specs: { Blade: "Carbon, 80 cm", Stiffness: "Medium", Pocket: "Full-foot rubber" },
    art: "fins",
    accent: "#1f6fb2",
    featured: true,
  },
  {
    slug: "current-fiberglass-fins",
    name: "Current Fiberglass Fins",
    category: "fins",
    price: 179,
    tagline: "The reliable all-rounder.",
    description: "Durable fiberglass blades with a forgiving flex, ideal for progressing divers.",
    specs: { Blade: "Fiberglass, 78 cm", Stiffness: "Soft-medium", Pocket: "Full-foot" },
    art: "fins",
    accent: "#4fb3e8",
  },
  {
    slug: "lowvol-mask",
    name: "LowVol Mask",
    category: "masks",
    price: 69,
    tagline: "Tiny volume, wide view.",
    description: "Ultra-low internal volume for easy equalization, with a wide-angle tempered glass lens.",
    specs: { Volume: "85 ml", Lens: "Tempered glass", Skirt: "Black silicone" },
    art: "mask",
    accent: "#0b3c6e",
  },
  {
    slug: "deep-edge-knife",
    name: "Deep Edge Knife",
    category: "accessories",
    price: 49,
    tagline: "Titanium blade, quick-release sheath.",
    description: "Corrosion-proof titanium blade with a line cutter and a sheath that mounts on belt, leg or float.",
    specs: { Blade: "Titanium, 10 cm", Sheath: "Quick-release", Edge: "Plain + line cutter" },
    art: "knife",
    accent: "#8fd3f4",
  },
  {
    slug: "surface-float-pro",
    name: "Surface Float Pro",
    category: "accessories",
    price: 89,
    tagline: "Be seen. Stay safe.",
    description: "High-visibility inflatable float with dive flag, 20 m float line and gear tie-down points.",
    specs: { Volume: "11 L", Line: "20 m", Flag: "Included" },
    art: "float",
    accent: "#4fb3e8",
  },
  {
    slug: "grip-gloves-2mm",
    name: "Grip Gloves 2 mm",
    category: "accessories",
    price: 29,
    tagline: "Kevlar palms for loading and grip.",
    description: "Neoprene gloves with Kevlar-reinforced palms that protect your hands when loading bands.",
    specs: { Thickness: "2 mm", Palm: "Kevlar-reinforced", Sizes: "S–XL" },
    art: "gloves",
    accent: "#2a7fc1",
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" }).format(value);
}
