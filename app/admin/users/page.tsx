import { getUsers } from "@/app/actions/users";
import { getInstitutions } from "@/app/actions/institutions";
import { UsersClient } from "./UsersClient";

export default async function UsersPage() {
  const [usersResult, institutionsResult] = await Promise.all([
    getUsers(),
    getInstitutions()
  ]);

  const users = usersResult.success ? (usersResult.data as any[]) : [];
  const institutions = institutionsResult.success ? (institutionsResult.data as any[]) : [];

  return <UsersClient initialUsers={users} institutions={institutions} />;
}
