import prisma from "@/lib/prisma";
import EditProjectClient from "./EditProjectClient";
import { notFound } from "next/navigation";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await prisma.projects.findUnique({
    where: { id: BigInt(id) }
  });

  if (!project) {
    notFound();
  }

  return (
    <EditProjectClient project={project} />
  );
}
