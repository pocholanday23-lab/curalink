import { requireUser } from "@/lib/dal";
import { OnboardingReview } from "@/components/onboarding-review";

export default async function AdminOnboardingReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireUser("ADMIN");
  const { id } = await params;
  return (
    <OnboardingReview actor={actor} id={id} basePath="/admin/employees" />
  );
}
