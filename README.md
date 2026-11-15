Afrah Media — Uganda's Digital Billboard Network ERP system.

Tech: Next.js 14 (App Router, TypeScript) + Tailwind CSS + Inter + Lucide + Recharts + Mapbox GL JS + Framer Motion + dnd-kit + canvas-confetti + react-hook-form + Zod + date-fns.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Mock data is in `lib/mockData.ts` and reusable UI components are in `components/ui`.

Role-based routing is enforced by `middleware.ts` using a `role` cookie (e.g. `customer`, `finance`, `ceo`).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

This repo includes `vercel.json` for a Next.js deployment.
