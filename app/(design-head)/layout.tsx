import type { Metadata } from "next";
import { cookies } from "next/headers";

import { DesignerShell } from "@/components/layouts/DesignerShell";
import { DesignHeadShell } from "@/components/layouts/DesignHeadShell";
import { TechnicianShell } from "@/components/layouts/TechnicianShell";

export const metadata: Metadata = {
  title: "Afrah Media — Design Head",
};

export default function DesignHeadLayout({ children }: { children: React.ReactNode }) {
  const role = cookies().get("role")?.value;
  if (role === "designer") {
    return <DesignerShell>{children}</DesignerShell>;
  }
  if (role === "technician") {
    return <TechnicianShell>{children}</TechnicianShell>;
  }
  return <DesignHeadShell>{children}</DesignHeadShell>;
}
