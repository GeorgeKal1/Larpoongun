# Larpoongun

An e-commerce web application for spearfishing and marine gear, built with Next.js, TypeScript, and Tailwind CSS.

## Overview

The platform features a product catalog, interactive cart, mock/demo checkout flows, customer account management, and a dedicated admin interface for tracking store orders.

## Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Payments & Orders:** Stripe API integration & demo payment support

## Project Structure

```text
Larpoongun/
├── app/                  # App Router pages and API routes
│   ├── account/          # User profile and order history
│   ├── admin/            # Dashboard and order oversight
│   ├── api/              # Internal endpoints (auth, orders, stripe webhook)
│   ├── checkout/         # Cart and payment screens
│   ├── products/         # Dynamic product pages
│   └── shop/             # Product catalog
├── components/           # UI elements and layout modules
│   └── admin/            # Back-office UI components
├── lib/                  # Utilities, auth helpers, and types
├── public/               # Static assets
└── scripts/              # Order listing scripts

Running Locally

    Clone the repository:
    Bash

    git clone [https://github.com/GeorgeKal1/Larpoongun.git](https://github.com/GeorgeKal1/Larpoongun.git)
    cd Larpoongun/Larpoongun

    Install dependencies:
    Bash

    npm install

    Start the development server:
    Bash

    npm run dev

Open http://localhost:3000 in your browser.
