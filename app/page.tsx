import Image from "next/image";
import Link from "next/link";

import { mockScreens } from "@/lib/mockData";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function Home() {
  const featuredScreens = mockScreens.slice(0, 4);

  return (
    <div className="min-h-screen bg-page">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
              <span className="text-base font-bold">A</span>
            </div>
            <span className="text-[18px] font-bold text-gray-900">
              Afrah Media
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-gray-600 md:flex">
            <a href="#how-it-works" className="hover:text-gray-900">
              How it Works
            </a>
            <a href="#featured-screens" className="hover:text-gray-900">
              Featured Screens
            </a>
            <a href="#testimonials" className="hover:text-gray-900">
              Testimonials
            </a>
            <a href="#footer" className="hover:text-gray-900">
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-primary hover:bg-blue-50"
            >
              Login
            </Link>
            <Link
              href="/dashboard/customer/screens"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Book a Screen
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-12 md:py-16">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <Badge variant="info" className="px-3 py-1">
                Kampala-first • UGX pricing • Instant quotes
              </Badge>
              <h1 className="mt-5 text-3xl font-semibold leading-tight text-gray-900 md:text-5xl">
                Book digital billboards across Kampala in minutes.
              </h1>
              <p className="mt-4 max-w-xl text-sm text-gray-600 md:text-base">
                Browse screens, calculate live quotes, pay via MTN MoMo / Airtel
                Money, upload creative, and track results — all inside Afrah
                Media’s ERP.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/dashboard/customer/screens"
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Browse Screens
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Sign in
                </Link>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { label: "Screens", value: `${mockScreens.length}` },
                  { label: "City", value: "Kampala" },
                  { label: "Avg Traffic", value: "1,700+" },
                  { label: "Uptime", value: "96%" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-card"
                  >
                    <div className="text-2xl font-bold text-gray-900">
                      {s.value}
                    </div>
                    <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-50 blur-2xl" />
              <Card className="overflow-hidden p-0">
                <div className="relative aspect-[16/10] w-full">
                  <Image
                    src={
                      featuredScreens[0]?.image ??
                      "https://picsum.photos/seed/hero/1200/800"
                    }
                    alt="Featured screen"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/55 via-slate-900/0 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="live" dot>
                        Live Network
                      </Badge>
                      <Badge variant="neutral">Instant Quote</Badge>
                      <Badge variant="neutral">UGX with VAT</Badge>
                    </div>
                    <div className="mt-3 text-lg font-semibold text-white">
                      {featuredScreens[0]?.name ?? "Kampala Road Screen"}
                    </div>
                    <div className="mt-1 text-sm text-slate-200">
                      {featuredScreens[0]?.location ??
                        "Kampala Road, CBD, Kampala"}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-12">
          <div className="text-[18px] font-semibold text-gray-800">
            How It Works
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                step: "Step 1",
                title: "Browse screens",
                desc: "Use map or grid view to compare locations, traffic, and pricing.",
              },
              {
                step: "Step 2",
                title: "Get quote & pay",
                desc: "Pick dates/times for a live price breakdown and confirm payment.",
              },
              {
                step: "Step 3",
                title: "Upload & go live",
                desc: "Submit creative for review and track plays and impressions.",
              },
            ].map((item) => (
              <Card key={item.step} className="p-6">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {item.step}
                </div>
                <div className="mt-2 text-lg font-semibold text-gray-800">
                  {item.title}
                </div>
                <div className="mt-2 text-sm text-gray-600">{item.desc}</div>
              </Card>
            ))}
          </div>
        </section>

        <section
          id="featured-screens"
          className="mx-auto max-w-6xl px-6 py-12"
        >
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-[18px] font-semibold text-gray-800">
                Featured Screens
              </div>
              <div className="mt-1 text-sm text-gray-600">
                Explore top-performing placements in Kampala.
              </div>
            </div>
            <Link
              href="/dashboard/customer/screens"
              className="hidden rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:inline-flex"
            >
              View all
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredScreens.map((s) => (
              <Link
                key={s.id}
                href={`/dashboard/customer/screens/${s.id}`}
                className="group"
              >
                <Card className="overflow-hidden p-0">
                  <div className="relative aspect-[16/10]">
                    <Image
                      src={s.image}
                      alt={s.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/55 via-slate-900/0 to-transparent" />
                    <div className="absolute left-3 top-3">
                      <Badge
                        variant={
                          s.status === "available"
                            ? "success"
                            : s.status === "booked"
                              ? "warning"
                              : "error"
                        }
                        dot
                        className="bg-white/90"
                      >
                        {String(s.status).toUpperCase()}
                      </Badge>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="text-sm font-semibold text-white">
                        {s.name}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-200">
                        {s.location}
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-gray-900">
                        UGX {s.price_per_hour.toLocaleString("en-US")}
                        <span className="ml-1 text-xs font-medium text-gray-500">
                          /hour
                        </span>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2 py-1 text-xs font-medium",
                          s.location_type === "cbd" &&
                            "bg-blue-50 text-blue-700",
                          s.location_type === "suburban" &&
                            "bg-green-50 text-green-700",
                          s.location_type === "outskirts" &&
                            "bg-amber-50 text-amber-700",
                        )}
                      >
                        {String(s.location_type).toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      {s.size} • {s.resolution}
                    </div>
                    <div className="mt-4 inline-flex text-sm font-medium text-primary">
                      View Details
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section id="testimonials" className="mx-auto max-w-6xl px-6 py-12">
          <div className="text-[18px] font-semibold text-gray-800">
            Testimonials
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                name: "Grace Atuhaire",
                company: "Café Javas",
                quote:
                  "The quote breakdown is super clear. We launched fast and saw great foot-traffic lift.",
              },
              {
                name: "Robert Ssemakula",
                company: "Pearl Dairy Ltd",
                quote:
                  "Payments and approvals feel instant. It’s the cleanest billboard booking workflow we’ve used.",
              },
              {
                name: "Sarah Nakato",
                company: "Personal",
                quote:
                  "Uploading creative and getting it reviewed was smooth. Loved the modern dashboard look.",
              },
            ].map((t) => (
              <Card key={t.name} className="p-6">
                <div className="text-sm text-gray-700">“{t.quote}”</div>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                    {t.name
                      .split(" ")
                      .slice(0, 2)
                      .map((p) => p[0])
                      .join("")}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900">
                      {t.name}
                    </div>
                    <div className="text-xs text-gray-500">{t.company}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <footer id="footer" className="border-t border-gray-200 bg-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
                  <span className="text-base font-bold">A</span>
                </div>
                <div className="text-[18px] font-bold text-gray-900">
                  Afrah Media
                </div>
              </div>
              <div className="mt-3 max-w-lg text-sm text-gray-600">
                Uganda’s Digital Billboard Network — book screens, manage
                campaigns, and track performance with a modern ERP experience.
              </div>
              <div className="mt-6 text-sm text-gray-600">
                Kampala, Uganda •{" "}
                <a
                  className="text-primary hover:underline"
                  href="mailto:hello@afrahmedia.ug"
                >
                  hello@afrahmedia.ug
                </a>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Links
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <Link className="block text-gray-700 hover:text-gray-900" href="/login">
                  Login
                </Link>
                <Link className="block text-gray-700 hover:text-gray-900" href="/signup">
                  Sign up
                </Link>
                <Link
                  className="block text-gray-700 hover:text-gray-900"
                  href="/dashboard/customer/screens"
                >
                  Browse Screens
                </Link>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Company
              </div>
              <div className="mt-3 space-y-2 text-sm text-gray-700">
                <div>Pricing includes VAT</div>
                <div>Support: Mon–Fri, 8AM–6PM</div>
                <div className="text-gray-500">
                  © {new Date().getFullYear()} Afrah Media
                </div>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
