import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DesignerTaskDetailPage } from "@/components/designer/DesignerTaskDetailPage";
import { TechnicianTaskDetailPage } from "@/components/technician/TechnicianTaskDetailPage";

export default function SharedTaskDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const role = cookies().get("role")?.value;
  if (role === "designer") {
    return <DesignerTaskDetailPage taskId={params.id} />;
  }
  if (role === "technician") {
    return <TechnicianTaskDetailPage taskId={params.id} />;
  }
  redirect("/tasks");
}
