import { EmployeeProfilePage } from "@/components/operations/EmployeeProfilePage";

export default function EmployeeProfileRoute({ params }: { params: { id: string } }) {
  return <EmployeeProfilePage employeeId={params.id} />;
}
