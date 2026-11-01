import PageHeader from "@/components/console/PageHeader";
import { requireUser } from "@/lib/auth";
import EmployeeForm from "../EmployeeForm";
import { createEmployee } from "../actions";
import { googleConfigured } from "@/lib/google-auth";

export default async function NewEmployeePage() {
  await requireUser("admin");
  const google = googleConfigured();
  return (<><PageHeader title="Create employee" description={google ? "They sign in with the Google account that owns this email: no PIN or invitation needed. Use their Gmail or Google Workspace address." : "Their sign-in details are emailed to them when email is connected; otherwise share the temporary PIN shown after saving."} /><EmployeeForm action={createEmployee} google={google} /></>);
}
