import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/dal";
import { Card } from "@/components/ui";
import { CuralinkLogo } from "@/components/curalink-logo";
import { ChangePasswordForm } from "./change-password-form";

export default async function ChangePasswordPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-4 flex justify-center">
          <span className="inline-flex items-center rounded-lg bg-white px-3 py-2 text-neutral-800 shadow-sm ring-1 ring-black/5">
            <CuralinkLogo className="h-9 w-9" />
          </span>
        </div>
        <h1 className="mb-2 text-center text-xl font-semibold tracking-tight text-white">
          Choose a new password
        </h1>
        <p className="mb-6 text-center text-sm text-white/70">
          {user.mustChangePassword
            ? "Your account uses a default password. Set your own before continuing."
            : "Update the password you use to sign in."}
        </p>
        <Card>
          <ChangePasswordForm />
        </Card>
      </div>
    </div>
  );
}
