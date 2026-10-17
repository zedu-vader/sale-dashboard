"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Users } from "lucide-react";

import {
  Button,
  Card,
  Search,
  StatusPill,
  Tabs,
  Table,
  TableCell,
  TableHead,
  TableRow,
  Person,
} from "@/components/zedu";

import { fetchContacts } from "./api";
import { ContactDialog } from "./ContactDialog";
import ContactImport from "./ContactImport";

import {
  TYPE_LABEL,
  createdLabel,
  initials,
  matchesQuery,
  stageLabel,
  type Contact,
} from "./data";

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
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchContacts()
      .then((data) => {
        setContacts(data);
        setLoadError("");
      })
      .catch((error: Error) => {
        setLoadError(error.message);
      });
  }, []);

  const refreshContacts = async () => {
    try {
      const data = await fetchContacts();
      setContacts(data);
      setLoadError("");
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to refresh contacts.",
      );
    }
  };

  const counts = useMemo(
    () => ({
      all: contacts?.length ?? 0,
      pipeline: contacts?.filter((contact) => contact.lead).length ?? 0,
      "not-contacted":
        contacts?.filter((contact) => !contact.lead).length ?? 0,
    }),
    [contacts],
  );

  const rows = useMemo(() => {
    return (contacts ?? [])
      .filter((contact) =>
        bucket === "all"
          ? true
          : bucket === "pipeline"
            ? Boolean(contact.lead)
            : !contact.lead,
      )
      .filter((contact) => matchesQuery(contact, query));
  }, [contacts, bucket, query]);

  return (
    <div className="zedu">
      {/* Page heading and actions */}
      <div className="flex flex-wrap items-center gap-4 px-6 pb-5 pt-6 max-sm:px-4">
        <div className="flex min-w-0 flex-1 basis-60 flex-col gap-1">
          <h1 className="flex items-baseline gap-2 text-z-page">
            <span className="text-z-fg">Contacts</span>
            <span className="font-normal text-z-fg-placeholder">
              {counts.all}
            </span>
          </h1>

          <p className="text-z-small font-normal text-z-fg-muted">
            People and businesses the team knows — including ones you
            haven&apos;t reached out to yet.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setImporting(true)}>
            Import CSV
          </Button>

          <Button
            variant="primary"
            icon={<Plus aria-hidden />}
            onClick={() => setAdding(true)}
          >
            Add contact
          </Button>
        </div>
      </div>

      {/* Contact filters */}
      <div className="px-6 max-sm:px-4">
        <Tabs
          label="Filter contacts"
          value={bucket}
          onChange={setBucket}
          options={TAB_OPTIONS.map((tab) => ({
            ...tab,
            count: counts[tab.value],
          }))}
        />
      </div>

      {/* Contacts table */}
      <div className="p-6 max-sm:p-4">
        <Card bleed>
          <div className="flex flex-wrap items-center gap-3 p-5 pb-4">
            <Search
              variant="sunken"
              placeholder="Search name, phone or email"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full max-w-80"
            />

            <p className="text-z-caption text-z-fg-muted">
              {contacts === null
                ? ""
                : `${rows.length} of ${counts.all} shown`}
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
                {rows.map((contact) => (
                  <TableRow
                    key={contact.id}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(`/contacts/${contact.id}`)
                    }
                  >
                    <TableCell type="primary">
                      <span className="flex items-center gap-2">
                        <Link
                          href={`/contacts/${contact.id}`}
                          className="z-focus rounded-z-xs"
                        >
                          <Person
                            name={contact.name}
                            initials={initials(contact.name)}
                          />
                        </Link>

                        {contact.duplicates.length > 0 && (
                          <span
                            title={`Possible duplicate of ${contact.duplicates
                              .map((duplicate) => duplicate.name)
                              .join(", ")}`}
                            className="inline-flex h-[22px] items-center whitespace-nowrap rounded-full bg-z-danger-subtle px-2 text-z-caption font-medium text-z-fg-danger"
                          >
                            Duplicate
                          </span>
                        )}
                      </span>
                    </TableCell>

                    <TableCell className="font-mono text-z-mono">
                      {contact.phone}
                    </TableCell>

                    <TableCell className="max-w-48 truncate">
                      {contact.email ?? (
                        <span className="text-z-fg-placeholder">—</span>
                      )}
                    </TableCell>

                    <TableCell className="max-w-40 truncate">
                      {contact.company ?? (
                        <span className="text-z-fg-placeholder">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {contact.type ? (
                        TYPE_LABEL[contact.type]
                      ) : (
                        <span className="text-z-fg-placeholder">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {contact.lead ? (
                        <StatusPill
                          stage={stageLabel(contact.lead.status)}
                        />
                      ) : (
                        <span className="text-z-fg-muted">
                          Not contacted
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      {createdLabel(contact.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          )}

          {contacts === null && !loadError && (
            <p className="m-0 py-10 text-center text-z-small text-z-fg-muted">
              Loading contacts…
            </p>
          )}

          {loadError && (
            <p
              role="alert"
              className="m-0 py-10 text-center text-z-small text-z-fg-danger"
            >
              Couldn&apos;t load contacts: {loadError}
            </p>
          )}

          {contacts !== null && rows.length === 0 && !loadError && (
            <div className="flex flex-col items-center px-4 py-12 text-center">
              <span className="mb-3 grid size-14 place-items-center rounded-full bg-z-accent-subtle text-z-fg-accent">
                <Users aria-hidden className="size-6" />
              </span>

              <h3 className="m-0 text-z-card">
                No contacts {query ? "match your search" : "here yet"}
              </h3>

              <p className="m-0 mt-1 text-z-small text-z-fg-muted">
                {query
                  ? "Try a different name, phone number or email."
                  : "Add the people and businesses your team knows."}
              </p>

              {!query && (
                <div className="mt-4">
                  <Button
                    icon={<Plus aria-hidden />}
                    onClick={() => setAdding(true)}
                  >
                    Add contact
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Add contact dialog */}
      <ContactDialog
        open={adding}
        onClose={() => setAdding(false)}
        onSaved={() => {
          void refreshContacts();
        }}
      />

      {/* CSV contact importer */}
      {importing && (
        <ContactImport
          onClose={() => setImporting(false)}
          onImported={() => {
            void refreshContacts();
          }}
        />
      )}
    </div>
  );
}
