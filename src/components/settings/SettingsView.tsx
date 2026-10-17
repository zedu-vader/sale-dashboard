"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageHeader, Tabs } from "@/components/zedu";
import { NotificationsTab } from "./NotificationsTab";
import { PipelineTab } from "./PipelineTab";
import { ProfileTab } from "./ProfileTab";
import { TeamTab } from "./TeamTab";

type SettingsTab = "profile" | "team" | "pipeline" | "notifications";

type SettingsViewProps = {
  user: {
    id: string;
    name: string;
    email?: string | null;
    role: "ADMIN" | "MEMBER";
    createdAt?: string;
  };
};

export function SettingsView({ user }: SettingsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab") as SettingsTab | null;
  const activeTab: SettingsTab =
    tabParam && ["profile", "team", "pipeline", "notifications"].includes(tabParam)
      ? tabParam
      : "profile";

  function handleTabChange(tab: SettingsTab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`);
  }

  const tabs = [
    { value: "profile" as const, label: "Profile & Security" },
    ...(user.role === "ADMIN"
      ? [{ value: "team" as const, label: "Team & Access" }]
      : []),
    { value: "pipeline" as const, label: "Sales & Pipeline" },
    { value: "notifications" as const, label: "Notifications & Schedule" },
  ];

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your profile, team access, sales pipeline stages, and workspace preferences."
      />
      <div className="flex flex-col gap-6 px-6 pb-10 pt-2 max-sm:px-4">
        <Tabs
          label="Settings sections"
          options={tabs}
          value={activeTab}
          onChange={handleTabChange}
        />

        <div className="pt-2">
          {activeTab === "profile" && <ProfileTab user={user} />}
          {activeTab === "team" && (
            <TeamTab currentUserId={user.id} currentUserRole={user.role} />
          )}
          {activeTab === "pipeline" && <PipelineTab />}
          {activeTab === "notifications" && <NotificationsTab />}
        </div>
      </div>
    </>
  );
}
