"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { Button, Card, Search, StatusPill, Tabs, Table, TableCell, TableHead, TableRow, Person } from "@/components/zedu";
import { fetchContacts } from "./api";
import { ContactDialog } from "./ContactDialog";
import { TYPE_LABEL, createdLabel, initials, matchesQuery, stageLabel, type Contact } from "./data";

type Bucket = "all" | "pipeline" | "not-contacted";

const TAB_OPTIONS = [
  { value: "all", label: "All contacts" },
  { value: "pipeline", label: "In pipeline" },
  { value: "not-contacted", label: "Not contacted yet" },
] as const;

export function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [bucket, setBucket] = useState<Bucket>("all");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchContacts()
      .then(setContacts)
      .catch((e: Error) => setLoadError(e.message));
  }, []);

  const counts = useMemo(
    () => ({
      all: contacts?.length ?? 0,
      pipeline: contacts?.filter((c) => c.lead).length ?? 0,
      "not-contacted": contacts?.filter((c) => !c.lead).length ?? 0,
    }),
    [contacts],
  );

  const rows = useMemo(() => {
    return (contacts ?? [])
      .filter((c) => (bucket === "all" ? true : bucket === "pipeline" ? !!c.lead : !c.lead))
      .filter((c) => matchesQuery(c, query));
  }, [contacts, bucket, query]);

  return (
    <div className="zedu">
      <div className="flex flex-wrap items-center gap-4 px-6 pt-6 pb-5 max-sm:px-4">
        <div className="flex min-w-0 flex-1 basis-60 flex-col gap-1">
          <h1 className="flex items-baseline gap-2 text-z-page">
            <span className="text-z-fg">Contacts</span>
            <span className="font-normal text-z-fg-placeholder">{counts.all}</span>
          </h1>
          <p className="text-z-small font-normal text-z-fg-muted">
            People and businesses the team knows — including ones you haven&apos;t reached out to yet.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" icon={<Plus aria-hidden />} onClick={() => setAdding(true)}>
            Add contact
          </Button>
        </div>
      </div>

      <div className="px-6 max-sm:px-4">
        <Tabs
          label="Filter contacts"
          value={bucket}
          onChange={setBucket}
          options={TAB_OPTIONS.map((t) => ({ ...t, count: counts[t.value] }))}
        />
      </div>

      <div className="p-6 max-sm:p-4">
        <Card bleed>
          <div className="flex flex-wrap items-center gap-3 p-5 pb-4">
            <Search
              variant="sunken"
              placeholder="Search name, phone or email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full max-w-80"
            />
            <p className="text-z-caption text-z-fg-muted">
              {contacts === null ? "" : `${rows.length} of ${counts.all} shown`}
            </p>
          </div>

          {rows.length > 0 && (
            <Table>
              <thead>
                <tr>
                  <TableHead>Contact</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Pipeline</TableHead>
                  <TableHead>Created</TableHead>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/contacts/${c.id}`)}
                  >
                    <TableCell type="primary">
                      <span className="flex items-center gap-2">
                        <Link href={`/contacts/${c.id}`} className="z-focus rounded-z-xs">
                          <Person name={c.name} initials={initials(c.name)} />
                        </Link>
                        {c.duplicates.length > 0 && (
                          <span
                            title={`Possible duplicate of ${c.duplicates.map((d) => d.name).join(", ")}`}
                            className="inline-flex h-[22px] items-center whitespace-nowrap rounded-full bg-z-danger-subtle px-2 text-z-caption font-medium text-z-fg-danger"
                          >
                            Duplicate
                          </span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-z-mono">{c.phone}</TableCell>
                    <TableCell className="max-w-48 truncate">{c.email ?? <span className="text-z-fg-placeholder">—</span>}</TableCell>
                    <TableCell className="max-w-40 truncate">{c.company ?? <span className="text-z-fg-placeholder">—</span>}</TableCell>
                    <TableCell>{c.type ? TYPE_LABEL[c.type] : <span className="text-z-fg-placeholder">—</span>}</TableCell>
                    <TableCell>
                      {c.lead ? (
                        <StatusPill stage={stageLabel(c.lead.status)} />
                      ) : (
                        <span className="text-z-fg-muted">Not contacted</span>
                      )}
                    </TableCell>
                    <TableCell>{createdLabel(c.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          )}

          {contacts === null && !loadError && (
            <p className="m-0 py-10 text-center text-z-small text-z-fg-muted">Loading contacts…</p>
          )}
          {loadError && (
            <p role="alert" className="m-0 py-10 text-center text-z-small text-z-fg-danger">
              Couldn&apos;t load contacts: {loadError}
            </p>
          )}
          {contacts !== null && rows.length === 0 && !loadError && (
            <div className="flex flex-col items-center px-4 py-12 text-center">
              <span className="mb-3 grid size-14 place-items-center rounded-full bg-z-accent-subtle text-z-fg-accent">
                <Users aria-hidden className="size-6" />
              </span>
              <h3 className="m-0 text-z-card">No contacts {query ? "match your search" : "here yet"}</h3>
              <p className="m-0 mt-1 text-z-small text-z-fg-muted">
                {query ? "Try a different name, phone number or email." : "Add the people and businesses your team knows."}
              </p>
              {!query && (
                <div className="mt-4">
                  <Button icon={<Plus aria-hidden />} onClick={() => setAdding(true)}>
                    Add contact
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      <ContactDialog
        open={adding}
        onClose={() => setAdding(false)}
        // Re-fetch rather than prepend so duplicate badges stay in sync.
        onSaved={() => fetchContacts().then(setContacts).catch(() => undefined)}
      />
    </div>
  );
}
