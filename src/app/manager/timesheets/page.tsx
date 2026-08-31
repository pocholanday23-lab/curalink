import { redirect } from "next/navigation";

export default function LegacyManagerTimesheetsRedirect() {
  redirect("/manager/directory");
}
