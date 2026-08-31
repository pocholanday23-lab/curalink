import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/dal";

const ROLE_HOME: Record<string, string> = {
  EMPLOYEE: "/employee",
  MANAGER: "/manager/directory",
  ADMIN: "/admin",
};

export default async function Home() {
  const user = await getSessionUser();
  redirect(user ? ROLE_HOME[user.role] : "/login");
}
