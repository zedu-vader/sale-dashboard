"use client";

// Contacts list (Figma "Zedu - Sales" · Contacts - List): type tabs with counts, filter chips,
// sortable columns and CT-#### codes.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpDown, Check, ChevronDown, Download, Plus, Users } from "lucide-react";
import {
  Avatar,
  Button,
  Card,
  Dropdown,
  FilterChip,
  Menu,
  MenuItem,
  MenuLabel,
  Modal,
  Search,
  StatusPill,
  Table,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
} from "@/components/zedu";
import { fetchContacts } from "./api";
import { ContactDialog } from "./ContactDialog";
import { TYPE_LABEL, createdLabel, initials, matchesQuery, stageLabel, type Contact } from "./data";

type Bucket = "all" | "individual" | "business" | "duplicates";
type Sort = "name-asc" | "name-desc" | "newest" | "oldest";
type LinkFilter = "" | "linked" | "unlinked";
type CreatedFilter = "" | "7" | "30" | "90";

const SORT_LABEL: Record<Sort, string> = {
  "name-asc": "Name A–Z",
  "name-desc": "Name Z–A",
  newest: "Newest first",
  oldest: "Oldest first",
};

const CREATED_LABEL: Record<Exclude<CreatedFilter, "">, string> = {
  "7": "Last 7 days",
  "30": "Last 30 days",
  "90": "Last 90 days",
};

export function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [bucket, setBucket] = useState<Bucket>("all");
  const [company, setCompany] = useState("");
  const [linkFilter, setLinkFilter] = useState<LinkFilter>("");
  const [created, setCreated] = useState<CreatedFilter>("");
  const [sort, setSort] = useState<Sort>("name-asc");
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchContacts()
      .then(setContacts)
      .catch((e: Error) => setLoadError(e.message));
  }, []);

  const counts = useMemo(
    () => ({
      all: contacts?.length ?? 0,
      individual: contacts?.filter((c) => c.type === "INDIVIDUAL").length ?? 0,
      business: contacts?.filter((c) => c.type === "BUSINESS").length ?? 0,
      duplicates: contacts?.filter((c) => c.duplicates.length > 0).length ?? 0,
    }),
    [contacts],
  );

  const companies = useMemo(
    () => [...new Set((contacts ?? []).map((c) => c.company).filter((c): c is string => !!c))].sort((a, b) => a.localeCompare(b)),
    [contacts],
  );

  const rows = useMemo(() => {
    const cutoff = created ? Date.now() - Number(created) * 86_400_000 : 0;
    return (contacts ?? [])
      .filter((c) =>
        bucket === "all" ? true : bucket === "duplicates" ? c.duplicates.length > 0 : c.type === bucket.toUpperCase(),
      )
      .filter((c) => matchesQuery(c, query))
      .filter((c) => !company || c.company === company)
      .filter((c) => (linkFilter === "linked" ? !!c.lead : linkFilter === "unlinked" ? !c.lead : true))
      .filter((c) => !cutoff || +new Date(c.createdAt) >= cutoff)
      .sort((a, b) => {
        if (sort === "name-asc") return a.name.localeCompare(b.name);
        if (sort === "name-desc") return b.name.localeCompare(a.name);
        if (sort === "newest") return +new Date(b.createdAt) - +new Date(a.createdAt);
        return +new Date(a.createdAt) - +new Date(b.createdAt);
      });
  }, [contacts, bucket, query, company, linkFilter, created, sort]);

  const nameSort = sort === "name-asc" ? "asc" : sort === "name-desc" ? "desc" : "none";

  return (
    <div className="zedu">
      {/* Page header */}
      <div className="flex flex-wrap items-center gap-4 px-6 pt-6 pb-5 max-sm:px-4">
        <div className="flex min-w-0 flex-1 basis-60 flex-col gap-1">
          <h1 className="flex items-baseline gap-2 text-z-page">
            <span className="text-z-fg">Contacts</span>
            <span className="font-normal text-z-fg-placeholder">{counts.all}</span>
          </h1>
          <p className="max-w-2xl text-z-small font-normal text-z-fg-muted">
            The people and businesses your team talks to. Each person has one contact record that leads, calls and tasks
            link to.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={<Download aria-hidden />} onClick={() => setImporting(true)}>
            Import CSV
          </Button>
          <Button variant="primary" icon={<Plus aria-hidden />} onClick={() => setAdding(true)}>
            Add contact
          </Button>
        </div>
      </div>

      {/* Type tabs */}
      <div className="px-6 max-sm:px-4">
        <Tabs
          label="Filter contacts"
          value={bucket}
          onChange={setBucket}
          options={[
            { value: "all", label: "All", count: counts.all },
            { value: "individual", label: "Individuals", count: counts.individual },
            { value: "business", label: "Businesses", count: counts.business },
            { value: "duplicates", label: "Possible duplicates", count: counts.duplicates },
          ]}
        />
      </div>

      {/* Table */}
      <div className="p-6 max-sm:p-4">
        <Card bleed>
          <div className="flex flex-wrap items-center gap-2 p-5 pb-4">
            <Search
              variant="sunken"
              placeholder="Search name, phone or email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full max-w-80"
            />
            <Dropdown
              trigger={(p) =>
                company ? (
                  <FilterChip
                    label={`Company: ${company}`}
                    active
                    onClear={() => setCompany("")}
                    onClick={p.onClick}
                    aria-haspopup={p["aria-haspopup"]}
                    aria-expanded={p["aria-expanded"]}
                  />
                ) : (
                  <FilterChip label="Company" onClick={p.onClick} aria-haspopup={p["aria-haspopup"]} aria-expanded={p["aria-expanded"]} />
                )
              }
            >
              <Menu label="Filter by company" className="max-h-72 w-64 overflow-y-auto">
                <MenuLabel>Company</MenuLabel>
                {companies.length === 0 && <MenuItem disabled>No companies yet</MenuItem>}
                {companies.map((c) => (
                  <MenuItem key={c} icon={company === c ? <Check /> : undefined} onSelect={() => setCompany(c)}>
                    <span className="truncate">{c}</span>
                  </MenuItem>
                ))}
                {company && (
                  <>
                    <MenuItem onSelect={() => setCompany("")}>Any company</MenuItem>
                  </>
                )}
              </Menu>
            </Dropdown>
            <Dropdown
              trigger={(p) =>
                linkFilter ? (
                  <FilterChip
                    label={`Linked lead: ${linkFilter === "linked" ? "Linked" : "Not linked"}`}
                    active
                    onClear={() => setLinkFilter("")}
                    onClick={p.onClick}
                    aria-haspopup={p["aria-haspopup"]}
                    aria-expanded={p["aria-expanded"]}
                  />
                ) : (
                  <FilterChip label="Linked lead" onClick={p.onClick} aria-haspopup={p["aria-haspopup"]} aria-expanded={p["aria-expanded"]} />
                )
              }
            >
              <Menu label="Filter by pipeline link">
                <MenuLabel>Linked lead</MenuLabel>
                <MenuItem onSelect={() => setLinkFilter("linked")}>Linked</MenuItem>
                <MenuItem onSelect={() => setLinkFilter("unlinked")}>Not linked</MenuItem>
                {linkFilter && <MenuItem onSelect={() => setLinkFilter("")}>Any</MenuItem>}
              </Menu>
            </Dropdown>
            <Dropdown
              trigger={(p) =>
                created ? (
                  <FilterChip
                    label={`Created: ${CREATED_LABEL[created]}`}
                    active
                    onClear={() => setCreated("")}
                    onClick={p.onClick}
                    aria-haspopup={p["aria-haspopup"]}
                    aria-expanded={p["aria-expanded"]}
                  />
                ) : (
                  <FilterChip label="Created" onClick={p.onClick} aria-haspopup={p["aria-haspopup"]} aria-expanded={p["aria-expanded"]} />
                )
              }
            >
              <Menu label="Filter by creation date">
                <MenuLabel>Created</MenuLabel>
                {(Object.keys(CREATED_LABEL) as Exclude<CreatedFilter, "">[]).map((key) => (
                  <MenuItem key={key} onSelect={() => setCreated(key)}>
                    {CREATED_LABEL[key]}
                  </MenuItem>
                ))}
                {created && <MenuItem onSelect={() => setCreated("")}>Any time</MenuItem>}
              </Menu>
            </Dropdown>
            <div className="ml-auto">
              <Dropdown
                align="end"
                trigger={(p) => (
                  <Button variant="secondary" size="sm" icon={<ArrowUpDown aria-hidden />} {...p}>
                    Sort: {SORT_LABEL[sort]}
                    <ChevronDown aria-hidden className="size-3.5 text-z-icon" />
                  </Button>
                )}
              >
                <Menu label="Sort contacts">
                  <MenuLabel>Sort by</MenuLabel>
                  {(Object.keys(SORT_LABEL) as Sort[]).map((key) => (
                    <MenuItem key={key} onSelect={() => setSort(key)}>
                      {SORT_LABEL[key]}
                    </MenuItem>
                  ))}
                </Menu>
              </Dropdown>
            </div>
          </div>

          {rows.length > 0 && (
            <Table>
              <thead>
                <tr>
                  <TableHead
                    sort={nameSort}
                    onSort={() => setSort(nameSort === "asc" ? "name-desc" : "name-asc")}
                  >
                    Contact
                  </TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Linked lead</TableHead>
                  <TableHead>Last interaction</TableHead>
                  <TableHead>Created</TableHead>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => router.push(`/contacts/${c.id}`)}>
                    <TableCell type="primary">
                      <span className="flex items-center gap-2.5">
                        <Avatar size={24} initials={initials(c.name)} />
                        <span className="flex min-w-0 flex-col">
                          <Link href={`/contacts/${c.id}`} className="z-focus rounded-z-xs truncate hover:underline">
                            {c.name}
                          </Link>
                          <span className="text-z-caption font-normal text-z-fg-muted">
                            {c.code}
                            {c.type ? ` · ${TYPE_LABEL[c.type]}` : ""}
                          </span>
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-z-mono">{c.phone}</TableCell>
                    <TableCell className="max-w-52 truncate">
                      {c.email ?? <span className="text-z-fg-placeholder">—</span>}
                    </TableCell>
                    <TableCell className="max-w-44 truncate">
                      {c.company ?? <span className="text-z-fg-placeholder">—</span>}
                    </TableCell>
                    <TableCell>
                      {c.lead ? (
                        <StatusPill stage={stageLabel(c.lead.status)} />
                      ) : (
                        <span className="text-z-fg-placeholder">—</span>
                      )}
                    </TableCell>
                    <TableCell>{c.lastInteraction ?? <span className="text-z-fg-placeholder">—</span>}</TableCell>
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
              <h3 className="m-0 text-z-card">
                {bucket === "duplicates" && !query ? "No possible duplicates" : `No contacts ${query ? "match your search" : "here yet"}`}
              </h3>
              <p className="m-0 mt-1 max-w-sm text-z-small text-z-fg-muted">
                {bucket === "duplicates" && !query
                  ? "No two contacts share a phone number or email right now."
                  : query
                    ? "Try a different name, phone number or email."
                    : "Add the people and businesses your team knows."}
              </p>
              {!query && bucket !== "duplicates" && (
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

      <Modal
        open={importing}
        onClose={() => setImporting(false)}
        width={440}
        title="Import contacts"
        description="Add many contacts at once from a spreadsheet."
        footer={
          <Button variant="secondary" onClick={() => setImporting(false)}>
            Got it
          </Button>
        }
      >
        <p className="m-0 text-z-small text-z-fg-secondary">
          CSV import isn&apos;t available yet — it&apos;s on the roadmap. For now, add contacts one at a time with{" "}
          <span className="font-medium text-z-fg">Add contact</span>.
        </p>
      </Modal>
    </div>
  );
}
