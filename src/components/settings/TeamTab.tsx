"use client";

import { Check, MailPlus, RotateCw, Shield, Trash2, UserCheck, UserMinus, UserPlus, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AccessRequestsCard } from "@/components/invites/AccessRequestsCard";
import { InviteModal } from "@/components/invites/InviteModal";
import { InviteTable } from "@/components/invites/InviteTable";
import {
  Button,
  Card,
  IconButton,
  Person,
  Select,
  StatusPill,
  Table,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/zedu";
import { apiFetch } from "@/lib/auth/client";
import { InvitationsSkeleton, TeamMembersSkeleton } from "./SettingsSkeleton";
import type { AccessRequestDTO, InviteDTO } from "@/lib/invites";
import type { TeamMemberDetail } from "@/lib/settings";

type TeamTabProps = {
  currentUserId: string;
  currentUserRole: "ADMIN" | "MEMBER";
};

export function TeamTab({ currentUserId, currentUserRole }: TeamTabProps) {
  const [members, setMembers] = useState<TeamMemberDetail[] | null>(null);
  const [invites, setInvites] = useState<InviteDTO[] | null>(null);
  const [requests, setRequests] = useState<AccessRequestDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmailPrefill, setInviteEmailPrefill] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [membersRes, invitesRes, requestsRes] = await Promise.all([
        apiFetch("/api/settings/team"),
        apiFetch("/api/invites"),
        apiFetch("/api/access-requests"),
      ]);

      if (membersRes.ok) {
        setMembers(await membersRes.json());
      }
      if (invitesRes.ok) {
        setInvites(await invitesRes.json());
      }
      if (requestsRes.ok) {
        setRequests(await requestsRes.json());
      }
    } catch {
      setNotice({ type: "error", text: "Failed to load team data. Please refresh." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUserRole === "ADMIN") {
      loadData();
    }
  }, [currentUserRole, loadData]);

  if (currentUserRole !== "ADMIN") {
    return (
      <Card title="Team Directory" icon={<Users aria-hidden />}>
        <div className="flex flex-col gap-2 py-4 text-center">
          <p className="text-z-body text-z-fg font-medium">Restricted Access</p>
          <p className="text-z-small text-z-fg-muted">
            Only administrators have permission to manage team members, roles, and invitation tokens.
          </p>
        </div>
      </Card>
    );
  }

  async function handleToggleStatus(member: TeamMemberDetail) {
    const isCurrentlyDisabled = member.disabledAt !== null;
    const actionLabel = isCurrentlyDisabled ? "reactivate" : "deactivate";

    if (!isCurrentlyDisabled && member.me) {
      setNotice({ type: "error", text: "You cannot deactivate your own administrator account." });
      return;
    }

    if (
      !confirm(
        `Are you sure you want to ${actionLabel} ${member.name}'s account? ${
          isCurrentlyDisabled ? "They will regain access to log in." : "They will immediately lose access to log in."
        }`,
      )
    ) {
      return;
    }

    setBusyId(member.id);
    setNotice(null);
    try {
      const res = await apiFetch(`/api/settings/team/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled: !isCurrentlyDisabled }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice({ type: "error", text: data.error ?? `Failed to ${actionLabel} account.` });
      } else {
        setNotice({
          type: "success",
          text: `Account for ${member.name} has been ${isCurrentlyDisabled ? "reactivated" : "deactivated"}.`,
        });
        await loadData();
      }
    } catch {
      setNotice({ type: "error", text: "Network error occurred." });
    } finally {
      setBusyId(null);
    }
  }

  async function handleRoleChange(member: TeamMemberDetail, newRole: "ADMIN" | "MEMBER") {
    if (member.role === newRole) return;
    setBusyId(member.id);
    setNotice(null);
    try {
      const res = await apiFetch(`/api/settings/team/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice({ type: "error", text: data.error ?? "Failed to update role." });
      } else {
        setNotice({ type: "success", text: `Updated ${member.name}'s role to ${newRole === "ADMIN" ? "Admin" : "Member"}.` });
        await loadData();
      }
    } catch {
      setNotice({ type: "error", text: "Network error occurred." });
    } finally {
      setBusyId(null);
    }
  }

  // Invite actions
  async function actInvite(id: string, run: () => Promise<Response>, ok: string) {
    setBusyId(id);
    setNotice(null);
    try {
      const res = await run();
      if (!res.ok) setNotice({ type: "error", text: (await res.json().catch(() => ({}))).error ?? "Action failed." });
      else {
        setNotice({ type: "success", text: ok });
        await loadData();
      }
    } finally {
      setBusyId(null);
    }
  }

  const resendInvite = (i: InviteDTO) =>
    actInvite(i.id, () => apiFetch(`/api/invites/${i.id}/resend`, { method: "POST" }), `Invite re-sent to ${i.email}.`);
  const revokeInvite = (i: InviteDTO) =>
    actInvite(i.id, () => apiFetch(`/api/invites/${i.id}`, { method: "DELETE" }), "Invite revoked.");
  const dismissRequest = (r: AccessRequestDTO) =>
    actInvite(r.id, () => apiFetch(`/api/access-requests/${r.id}`, { method: "DELETE" }), "Request dismissed.");
  async function copyInvite(i: InviteDTO, what: "code" | "link") {
    if (!i.token) return;
    const text = what === "code" ? i.token : `${window.location.origin}/setup?token=${encodeURIComponent(i.token)}`;
    try {
      await navigator.clipboard.writeText(text);
      setNotice({ type: "success", text: what === "code" ? "Setup code copied." : "Invite link copied." });
    } catch {
      setNotice({ type: "error", text: "Couldn't copy. Copy it manually instead." });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {notice && (
        <p
          role="status"
          className={`rounded-z-md px-3.5 py-2.5 text-z-small ${
            notice.type === "success"
              ? "bg-z-status-success/10 text-z-fg-success"
              : "bg-z-status-danger/10 text-z-fg-danger"
          }`}
        >
          {notice.text}
        </p>
      )}

      {/* Team Members Table */}
      <Card
        bleed
        title="Team Members"
        icon={<Users aria-hidden />}
        action={
          <Button
            size="sm"
            icon={<UserPlus aria-hidden />}
            onClick={() => {
              setInviteEmailPrefill("");
              setInviteModalOpen(true);
            }}
          >
            Invite member
          </Button>
        }
      >
        {loading && !members ? (
          <TeamMembersSkeleton />
        ) : members && members.length > 0 ? (
          <Table>
            <thead>
              <tr>
                <TableHead>Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned Leads</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const isDisabled = m.disabledAt !== null;
                const busy = busyId === m.id;
                return (
                  <TableRow key={m.id} className={isDisabled ? "opacity-60 bg-z-sunken/40" : undefined}>
                    <TableCell type="primary">
                      <div className="flex items-center gap-2">
                        <Person name={m.name} initials={m.initials} />
                        {m.me && (
                          <span className="rounded-z-xs bg-z-sunken px-1.5 py-0.5 text-[11px] font-medium text-z-fg-muted">
                            You
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{m.email ?? "—"}</TableCell>
                    <TableCell>
                      {m.me ? (
                        <span className="text-z-small font-medium text-z-fg">
                          {m.role === "ADMIN" ? "Admin" : "Member"}
                        </span>
                      ) : (
                        <select
                          disabled={busy || isDisabled}
                          value={m.role}
                          onChange={(e) => handleRoleChange(m, e.target.value as "ADMIN" | "MEMBER")}
                          className="h-8 rounded-z-sm border border-z-line bg-z-surface px-2 text-z-small text-z-fg transition hover:border-z-line-hover focus:outline-none focus:ring-1 focus:ring-z-focus"
                        >
                          <option value="MEMBER">Member</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      )}
                    </TableCell>
                    <TableCell>{m.leadCount}</TableCell>
                    <TableCell>
                      {isDisabled ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-z-status-danger/10 px-2.5 py-0.5 text-z-caption font-medium text-z-fg-danger">
                          Deactivated
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-z-status-success/10 px-2.5 py-0.5 text-z-caption font-medium text-z-fg-success">
                          Active
                        </span>
                      )}
                    </TableCell>
                    <TableCell type="actions">
                      {!m.me && (
                        <Button
                          size="sm"
                          variant={isDisabled ? "secondary" : "danger"}
                          disabled={busy}
                          onClick={() => handleToggleStatus(m)}
                        >
                          {isDisabled ? "Reactivate" : "Deactivate"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </tbody>
          </Table>
        ) : (
          <div className="p-6 text-z-small text-z-fg-muted">No team members found.</div>
        )}
      </Card>

      {/* Access Requests */}
      {requests.length > 0 && (
        <AccessRequestsCard
          requests={requests}
          onInvite={(r) => {
            setInviteEmailPrefill(r.email);
            setInviteModalOpen(true);
          }}
          onDismiss={dismissRequest}
        />
      )}

      <Card bleed title="Pending & Past Invitations" icon={<MailPlus aria-hidden />}>
        {invites === null ? (
          <InvitationsSkeleton />
        ) : invites.length === 0 ? (
          <p className="p-6 text-z-small text-z-fg-muted">No invitations sent yet.</p>
        ) : (
          <InviteTable invites={invites} busyId={busyId} onResend={resendInvite} onCopy={copyInvite} onRevoke={revokeInvite} />
        )}
      </Card>

      {/* Invite Modal */}
      <InviteModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onCreated={() => loadData()}
        initialEmail={inviteEmailPrefill}
      />
    </div>
  );
}
