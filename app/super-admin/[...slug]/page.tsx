import { redirect } from "next/navigation";

export default function SuperAdminFallback() {
  redirect("/super-admin");
}
