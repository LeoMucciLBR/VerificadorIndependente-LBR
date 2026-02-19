import { getProjectSettings } from "@/app/actions/settings";
import { SettingsShell } from "./SettingsShell";

export default async function SettingsPage() {
  const settings = await getProjectSettings();

  return (
    <div className="h-full">
      <SettingsShell initialSettings={settings} />
    </div>
  );
}
