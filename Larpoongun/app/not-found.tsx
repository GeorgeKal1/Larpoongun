import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page">
      <div className="container empty-state">
        <h1>Lost at sea</h1>
        <p>We couldn&apos;t find that page.</p>
        <Link href="/shop" className="btn btn-lg">
          Back to the shop
        </Link>
      </div>
    </div>
  );
}
