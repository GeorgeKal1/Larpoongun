# LarpoonGun

Demo e-shop for spearfishing gear: Next.js 16 (App Router), React 19, TypeScript, SQLite, Stripe (test mode). Runs locally.

```bash
npm install
cp .env.example .env.local   # then fill in ADMIN_USERNAME / ADMIN_PASSWORD (and optionally Stripe)
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint    # type-check
npm run orders  # list every order in the database (npm run orders paid to filter)
```

Open the site at **http://localhost:3000**. `127.0.0.1` and `192.168.x.x` / `10.x.x.x` addresses are also allowed (see `allowedDevOrigins` in `next.config.ts`). Any other hostname gets the page without its JavaScript in dev mode, so the dive and the cart won't work.

## Accounts & saved carts

- `/account` has **Sign in** and **Register** modes (`/account?mode=register` opens on Register).
- Passwords are hashed with scrypt. Sessions are random tokens in an `httpOnly` cookie; only a SHA-256 of the token is stored.
- Signed out, the cart lives in the browser (`localStorage`). When you sign in or register, those items are added to the account's saved cart. After that, every change is saved to the database, so the cart comes back on the next sign-in.
- The database is `data/larpoongun.db` (SQLite, created on first request; set `DATABASE_PATH` to move it). Delete the file to start fresh. Schema changes are applied automatically by numbered migrations in `lib/server/db.ts`.

## Payments & orders

Checkout needs an account. It creates an **order** (saved with its items, prices, totals and delivery address) and then sends the customer to pay:

- **Demo mode** (default, no setup): a built-in payment page where you choose *Pay* or *Simulate a declined card*. Nothing is charged.
- **Stripe test mode**: copy `.env.example` to `.env.local`, set `STRIPE_SECRET_KEY=sk_test_…` from [your Stripe test dashboard](https://dashboard.stripe.com/test/apikeys), and restart `npm run dev`. Customers pay on Stripe's hosted Checkout page (test card `4242 4242 4242 4242`, any future date, any CVC). Only `sk_test_` keys are accepted.

When the payment succeeds the order becomes `paid` and the bought items leave the saved cart. Orders move `pending → paid | failed | cancelled`. Prices and totals are always calculated on the server from `lib/products.ts`, so a modified browser can't change what is charged.

For Stripe, the order is confirmed when the customer returns to `/orders/<id>`, by asking Stripe directly. Optionally also run the [Stripe CLI](https://docs.stripe.com/stripe-cli) for webhooks (covers customers who close the tab before returning):

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

and put the `whsec_…` secret it prints in `STRIPE_WEBHOOK_SECRET`.

Customers see their orders at `/account/orders`. To see **all** orders, run `npm run orders`.

## Admin area (`/admin`)

Open **http://localhost:3000/admin** and sign in with the `ADMIN_USERNAME` / `ADMIN_PASSWORD` from your `.env.local`. If those aren't set, the admin area stays locked.

- **Orders**: revenue and order counts, plus every order from every customer. Search by order id, email or name, and filter by payment status or fulfilment.
- **Order page**: change payment status and fulfilment (unfulfilled → shipped → delivered / returned), edit items and quantities (totals are recalculated), change the customer's delivery details, add an internal note, or delete the order. Every change is recorded in the order's **history** with who made it.
- **Payments**: every payment attempt with provider, reference, status and amount, plus totals per provider.

Editing an order changes the shop's records only. It never charges or refunds a card, so do refunds in the Stripe dashboard.

Admin sessions use their own `httpOnly`, `SameSite=Strict` cookie and last 8 hours. After 5 wrong passwords, login is locked for 15 minutes. Admin pages are marked `noindex`.

## Publishing to GitHub

The repository contains no secrets or customer data:

- `.env.local` (admin login, Stripe keys) and `data/` (the SQLite database) are in `.gitignore`. Only `.env.example`, which has empty values, is committed.
- Anyone cloning the repo creates their own `.env.local`; until they do, `/admin` is locked.
- If you ever deploy this somewhere public, use a long random `ADMIN_PASSWORD`. A short one is only reasonable on your own machine.

### API

| Route | Method | What |
| --- | --- | --- |
| `/api/auth/register` | POST `{ name, email, password }` | Create account and sign in |
| `/api/auth/login` | POST `{ email, password }` | Sign in |
| `/api/auth/logout` | POST `{}` | Sign out |
| `/api/auth/me` | GET | Current user or `null` |
| `/api/cart` | GET | Saved cart |
| `/api/cart` | PUT `{ lines }` | Replace saved cart |
| `/api/cart` | POST `{ lines }` | Add lines to saved cart |
| `/api/orders` | POST `{ lines, name, address, city, postcode }` | Create order, returns `redirectUrl` to pay |
| `/api/orders/:id/demo-pay` | POST `{ outcome: "approve" \| "decline" }` | Demo payment (demo mode only) |
| `/api/webhooks/stripe` | POST | Stripe webhook (needs `STRIPE_WEBHOOK_SECRET`) |
| `/api/admin/login` | POST `{ username, password }` | Admin sign in |
| `/api/admin/logout` | POST `{}` | Admin sign out |
| `/api/admin/orders/:id` | PATCH (any of `status`, `fulfillment`, `name`, `email`, `address`, `city`, `postcode`, `admin_note`, `items`) | Edit an order (admin) |
| `/api/admin/orders/:id` | DELETE `{ confirm: "<order id>" }` | Delete an order (admin) |

Mutating routes accept JSON only and reject cross-origin requests.

## Structure

| Path | What |
| --- | --- |
| `app/page.tsx` | Home: the dive. Product zones layered over the ocean scene |
| `components/OceanScene.tsx` | Scroll-driven parallax ocean, depth-based fish, falling spear, target fish, depth gauge |
| `components/Fish.tsx` | SVG sea creatures (reef, tuna, grouper, angler, jelly) |
| `components/AccountView.tsx` | Sign in / register form and profile |
| `lib/auth.tsx` | Client auth state (`useAuth`) |
| `lib/cart.tsx` | Cart state (`useCart`), stored in the browser or the database |
| `lib/server/*` | Database, password hashing, sessions, cart, orders, payments (server only) |
| `lib/pricing.ts` | Shipping rules and cents formatting, shared by browser and server |
| `app/checkout`, `app/pay/[id]`, `app/orders/[id]`, `app/account/orders` | Checkout, demo payment page, order confirmation, order history |
| `app/admin/*`, `components/admin/*` | Admin login, orders dashboard, order editor, payments |
| `lib/server/admin-auth.ts`, `lib/server/admin-orders.ts` | Admin sessions and login lockout; order listing, stats and edits |
| `scripts/list-orders.mjs` | `npm run orders`: prints all orders |
| `lib/products.ts` | Product catalog (edit here to add products) |
| `app/api/*` | Backend routes |
| `app/globals.css` | All styles; palette tokens are at the top |

## Tuning the dive

In `components/OceanScene.tsx`:

- `FISH`: each fish's depth window (`from`/`to` as scroll fraction 0–1), size, colour, direction and speed.
- `WATER`: water colour stops by depth.
- `MAX_DEPTH`: metres shown on the gauge at the bottom of the page.
- `HIT_AT`: scroll fraction at which the spear strikes the fish.
