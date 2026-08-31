import { redirect } from "next/navigation";

export default function LegacyPayrollRedirect() {
  redirect("/admin/reports/payroll");
}
