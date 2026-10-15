import { notFound } from "next/navigation";
import { CallsPage } from "@/components/calls/CallsPage";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { previewCallers, previewCalls, previewLeads } from "@/data/calls-preview";

export const dynamic = "force-static";
export const metadata = { title: "Calls UI preview" };

export default function CallsPreviewRoute() {
  if (process.env.NODE_ENV !== "development") notFound();

  return <DashboardShell user={{ name: "Local preview" }} openTaskCount={0} unread={false} active="Calls" previewMode>
    <div className="zedu px-6 pb-6 pt-4 max-sm:px-4">
      <CallsPage leads={previewLeads} callers={previewCallers} callerName="Alex Morgan (sample)" previewMode previewData={previewCalls} />
    </div>
  </DashboardShell>;
}
