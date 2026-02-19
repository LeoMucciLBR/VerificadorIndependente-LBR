import prisma from "@/lib/prisma";
import EditUserClient from "./EditUserClient";
import { notFound } from "next/navigation";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = BigInt(id);
  
  const [user, allProjects] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        user_projects: {
            include: { projects: true }
        }
      }
    }),
    prisma.projects.findMany({
        select: { id: true, nome: true, codigo: true },
        where: { ativo: true }
    })
  ]);

  if (!user) {
    notFound();
  }

  return (
    <EditUserClient user={user} allProjects={allProjects} />
  );
}
