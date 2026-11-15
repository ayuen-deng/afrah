import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function DashboardPlaceholder({
  params,
}: {
  params: { slug: string[] };
}) {
  const path = `/dashboard/${params.slug.join("/")}`;

  return (
    <main className="min-h-screen bg-page px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Card>
          <div className="text-[24px] font-semibold text-gray-900">
            Dashboard shell
          </div>
          <div className="mt-2 text-sm text-gray-600">
            This route exists so STEP 1 auth redirects work. Full dashboard UI
            for <span className="font-mono">{path}</span> will be built in later
            steps.
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link href="/login">
              <Button>Go to Login</Button>
            </Link>
            <Link href="/">
              <Button variant="secondary">Back Home</Button>
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}

