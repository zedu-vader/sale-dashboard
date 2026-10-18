"use client";

import { Check, KeyRound, LogOut, Shield, User } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button, Card, FieldLabel, Input } from "@/components/zedu";
import { apiFetch, signOut } from "@/lib/auth/client";

type ProfileTabProps = {
  user: {
    id: string;
    name: string;
    email?: string | null;
    role: "ADMIN" | "MEMBER";
    createdAt?: string;
  };
};

export function ProfileTab({ user }: ProfileTabProps) {
  // Name update state
  const [name, setName] = useState(user.name);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameNotice, setNameNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleUpdateProfile(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setNameNotice({ type: "error", text: "Name cannot be empty." });
      return;
    }
    setNameSaving(true);
    setNameNotice(null);
    try {
      const res = await apiFetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNameNotice({ type: "error", text: data.error ?? "Failed to update profile." });
      } else {
        setNameNotice({ type: "success", text: "Profile details updated successfully." });
      }
    } catch {
      setNameNotice({ type: "error", text: "Network error. Please try again." });
    } finally {
      setNameSaving(false);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordNotice(null);

    if (!currentPassword) {
      setPasswordNotice({ type: "error", text: "Current password is required." });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordNotice({ type: "error", text: "New password must be at least 8 characters long." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordNotice({ type: "error", text: "New passwords do not match." });
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await apiFetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordNotice({ type: "error", text: data.error ?? "Failed to update password." });
      } else {
        setPasswordNotice({ type: "success", text: "Password changed successfully." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPasswordNotice({ type: "error", text: "Network error. Please try again." });
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Details */}
        <Card title="Personal Information" icon={<User aria-hidden />}>
          <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="display-name" required>
                Full name
              </FieldLabel>
              <Input
                id="display-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Agnes Okafor"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="email-address">Email address</FieldLabel>
              <Input id="email-address" value={user.email ?? ""} disabled readOnly />
              <p className="text-z-caption text-z-fg-muted">
                Email is managed via your invitation account and cannot be changed directly.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="user-role">Role</FieldLabel>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-z-sm bg-z-sunken px-2.5 py-1 text-z-small font-medium text-z-fg">
                  <Shield className="size-3.5 text-z-icon" />
                  {user.role === "ADMIN" ? "Administrator" : "Sales Representative"}
                </span>
              </div>
            </div>

            {nameNotice && (
              <p
                role="status"
                className={`rounded-z-md px-3 py-2 text-z-small ${
                  nameNotice.type === "success"
                    ? "bg-z-status-success/10 text-z-fg-success"
                    : "bg-z-status-danger/10 text-z-fg-danger"
                }`}
              >
                {nameNotice.text}
              </p>
            )}

            <div className="pt-2">
              <Button type="submit" disabled={nameSaving}>
                {nameSaving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </Card>

        {/* Change Password */}
        <Card title="Password & Security" icon={<KeyRound aria-hidden />}>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="current-pw" required>
              Current password
            </FieldLabel>
            <Input
              id="current-pw"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="new-pw" required>
              New password
            </FieldLabel>
            <Input
              id="new-pw"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="confirm-pw" required>
              Confirm new password
            </FieldLabel>
            <Input
              id="confirm-pw"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
            />
          </div>

          {passwordNotice && (
            <p
              role="status"
              className={`rounded-z-md px-3 py-2 text-z-small ${
                passwordNotice.type === "success"
                  ? "bg-z-status-success/10 text-z-fg-success"
                  : "bg-z-status-danger/10 text-z-fg-danger"
              }`}
            >
              {passwordNotice.text}
            </p>
          )}

          <div className="pt-2">
            <Button type="submit" variant="secondary" disabled={passwordSaving}>
              {passwordSaving ? "Updating password..." : "Update password"}
            </Button>
          </div>
        </form>
      </Card>
      </div>

      {/* Active Session */}
      <Card title="Current Session" icon={<LogOut aria-hidden />}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-z-small font-medium text-z-fg">Signed in as {user.email}</span>
            <span className="text-z-caption text-z-fg-muted">
              Secure JWT authentication active on this device.
            </span>
          </div>
          <Button variant="danger" size="sm" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </Card>
    </div>
  );
}
