import PageHeader from "@/components/console/PageHeader";
import { requireUser } from "@/lib/auth";
import EmployeeForm from "../EmployeeForm";
import { createEmployee } from "../actions";

export default async function NewEmployeePage() {
  await requireUser("admin");
  return (<><PageHeader title="Create employee" description="Their sign-in details are emailed to them when email is connected; otherwise share the temporary password shown after saving." /><EmployeeForm action={createEmployee} /></>);
}
