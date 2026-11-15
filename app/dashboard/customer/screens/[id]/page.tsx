import { notFound } from "next/navigation";

import { mockScreens } from "@/lib/mockData";
import { ScreenDetailClient } from "@/components/customer/ScreenDetailClient";

export default function ScreenDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const screen = mockScreens.find((s) => s.id === params.id);
  if (!screen) return notFound();

  return <ScreenDetailClient screen={screen} />;
}

