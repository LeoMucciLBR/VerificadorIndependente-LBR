import RelatoriosView from "@/components/relatorios/RelatoriosView";

export default async function RelatorioPage({ params }: { params: Promise<{ project: string }> }) {
  const { project } = await params;
  return (
    <div className="flex-1 p-8">
      <RelatoriosView projectSlug={project} />
    </div>
  );
}
