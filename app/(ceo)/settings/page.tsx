import { cookies } from "next/headers";

import { CeoSettingsPage } from "@/components/ceo/SettingsPage";
import { SuperAdminSettingsPage } from "@/components/super-admin/SuperAdminSettingsPage";

export default function CeoSettingsRoute() {
  const role = cookies().get("role")?.value;
  if (role === "super_admin") {
    return <SuperAdminSettingsPage />;
  }
  return <CeoSettingsPage />;
}
