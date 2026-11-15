import { OffboardingDetailPage } from "@/components/operations/OffboardingDetailPage";

export default function OffboardingDetailRoute({ params }: { params: { id: string } }) {
  return <OffboardingDetailPage offboardingId={params.id} />;
}
