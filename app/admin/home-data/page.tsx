import { ProjectSettingsForm } from "@/components/settings/projects/ProjectSettingsForm";

export default function AdminHomeDataPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black p-8">
      <div className="max-w-7xl mx-auto">
        <ProjectSettingsForm />
      </div>
    </div>
  );
}
