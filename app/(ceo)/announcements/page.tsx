import { cookies } from "next/headers";

import { CeoAnnouncementsPage } from "@/components/ceo/AnnouncementsPage";
import { StaffAnnouncementsPage } from "@/components/staff/StaffAnnouncementsPage";

export default function CeoAnnouncementsRoute() {
  const role = cookies().get("role")?.value;
  if (role === "internal_staff") {
    return <StaffAnnouncementsPage />;
  }
  return <CeoAnnouncementsPage />;
}
