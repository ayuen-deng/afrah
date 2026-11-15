import { cookies } from "next/headers";

import { AssetsPage } from "@/components/operations/AssetsPage";
import { StaffAssetsPage } from "@/components/staff/StaffAssetsPage";

export default function AssetsRoute() {
  const role = cookies().get("role")?.value;
  if (role === "internal_staff") {
    return <StaffAssetsPage />;
  }
  return <AssetsPage />;
}
