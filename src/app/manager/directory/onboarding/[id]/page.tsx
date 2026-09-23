import { requireUser } from "@/lib/dal";
import { OnboardingReview } from "@/components/onboarding-review";

export default async function ManagerOnboardingReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireUser("MANAGER");
  const { id } = await params;
  return (
    <OnboardingReview actor={actor} id={id} basePath="/manager/directory" />
  );
}
