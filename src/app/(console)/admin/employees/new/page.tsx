import PageHeader from "@/components/console/PageHeader";
import { requireUser } from "@/lib/auth";
import EmployeeForm from "../EmployeeForm";
import { createEmployee } from "../actions";

export default async function NewEmployeePage() {
  await requireUser("admin");
  return (<><PageHeader title="Create employee" description="They sign in at /login with the email and temporary password you share." /><EmployeeForm action={createEmployee} /></>);
}
