import { Card } from "@/components/ui";
import { CuralinkLogo } from "@/components/curalink-logo";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ changed?: string }>;
}) {
  const { changed } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <span className="inline-flex items-center rounded-lg bg-white px-3 py-2 text-neutral-800 shadow-sm ring-1 ring-black/5">
            <CuralinkLogo className="h-10 w-10" />
          </span>
        </div>
        {changed && (
          <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
            Password updated. Please sign in with your new password.
          </p>
        )}
        <Card>
          <LoginForm />
        </Card>
      </div>
    </div>
  );
}
