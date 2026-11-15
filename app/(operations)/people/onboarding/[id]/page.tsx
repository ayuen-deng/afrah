import { OnboardingDetailPage } from "@/components/operations/OnboardingDetailPage";

export default function OnboardingDetailRoute({ params }: { params: { id: string } }) {
  return <OnboardingDetailPage onboardingId={params.id} />;
}
