"use client";

// Possible duplicates tab (Figma 16853:477416) and the Merge 2 contacts dialog (16855:478098).

import { CircleAlert, GitMerge } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { dismissDuplicate, mergeContacts } from "@/app/contacts/actions";
import { MERGE_FIELDS, type DuplicatePair, type DuplicateRecord, type MergeChoice, type MergeField } from "@/lib/contactTypes";
import { LEAD_TYPES, initialsOf } from "@/lib/status";
import { Alert, Avatar, Button, Modal, cx } from "@/components/zedu";

export function DuplicatesList({ pairs }: { pairs: DuplicatePair[] }) {
  const [merging, setMerging] = useState<DuplicatePair | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();
  const visible = pairs.filter((p) => !hidden.has(p.key));

  // Server data replaced the list: forget optimistic hides.
  useEffect(() => setHidden(new Set()), [pairs]);

  const dismiss = (pair: DuplicatePair) => {
    setHidden((h) => new Set(h).add(pair.key));
    startTransition(async () => {
      try {
        await dismissDuplicate(pair.a.id, pair.b.id);
      } catch {
        setHidden((h) => {
          const next = new Set(h);
          next.delete(pair.key);
          return next;
        });
      }
    });
  };

  if (!visible.length) {
    return (
      <div className="flex flex-col items-center gap-1 rounded-z-xl border border-z-line bg-z-surface px-6 py-16 text-center shadow-z-sm">
        <p className="text-z-small font-medium text-z-fg">No possible duplicates</p>
        <p className="text-z-caption text-z-fg-muted">Contacts with the same phone number, email, or name at the same company show up here.</p>
      </div>
    );
  }

  return (
    <>
      <p className="text-z-small text-z-fg-secondary">
        {visible.length} {visible.length === 1 ? "pair matches" : "pairs match"} the duplicate rules: same phone number, same email, or same
        name at the same company. Nothing is merged automatically — review each pair.
      </p>
      <ul className="flex flex-col gap-3">
        {visible.map((pair) => (
          <li key={pair.key}>
            <DuplicatePairCard pair={pair} onDismiss={() => dismiss(pair)} onMerge={() => setMerging(pair)} />
          </li>
        ))}
      </ul>
      <MergeModal pair={merging} onClose={() => setMerging(null)} />
    </>
  );
}

function DuplicatePairCard({ pair, onDismiss, onMerge }: { pair: DuplicatePair; onDismiss: () => void; onMerge: () => void }) {
  return (
    <article aria-label={`${pair.a.name} and ${pair.b.name}`} className="overflow-hidden rounded-z-xl border border-z-line bg-z-surface shadow-z-sm">
      <header className="flex flex-wrap items-center gap-2 border-b border-z-line bg-z-warning-subtle py-2 pl-4 pr-2">
        <CircleAlert aria-hidden className="size-4 shrink-0 text-z-fg-warning" />
        <p className="min-w-0 flex-1 text-z-small font-medium text-z-fg-warning">{pair.label}</p>
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          Not a duplicate
        </Button>
        <Button variant="secondary" size="sm" icon={<GitMerge aria-hidden />} onClick={onMerge}>
          Review and merge
        </Button>
      </header>
      <div className="grid grid-cols-2 max-md:grid-cols-1">
        <RecordSummary record={pair.a} />
        <RecordSummary record={pair.b} className="border-l border-z-line max-md:border-l-0 max-md:border-t" />
      </div>
    </article>
  );
}

function RecordSummary({ record: r, className }: { record: DuplicateRecord; className?: string }) {
  return (
    <div className={cx("flex min-w-0 items-start gap-3 p-4", className)}>
      <Avatar size={32} initials={initialsOf(r.name)} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="flex items-center gap-2">
          <Link href={`/contacts/${r.id}`} className="z-focus truncate rounded-z-xs text-z-small font-medium text-z-fg hover:underline">
            {r.name}
          </Link>
          <span className="shrink-0 font-mono text-z-mono text-z-fg-muted">{r.code}</span>
        </p>
        <p className="truncate text-z-small text-z-fg-secondary">{[r.phone, r.email].filter(Boolean).join(" · ")}</p>
        <p className="truncate text-z-small text-z-fg-secondary">{r.company ?? LEAD_TYPES[r.type].label}</p>
        <p className="truncate pt-1 text-z-caption text-z-fg-muted">{r.summary}</p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------------------------- */

const FIELDS = Object.keys(MERGE_FIELDS) as MergeField[];

const fieldValue = (r: DuplicateRecord, f: MergeField) => (f === "type" ? LEAD_TYPES[r.type].label : r[f]) || null;

/** Keep the surviving record's value unless it's empty and the other one isn't. */
function defaultChoice(keep: DuplicateRecord, merge: DuplicateRecord): MergeChoice {
  return Object.fromEntries(FIELDS.map((f) => [f, !fieldValue(keep, f) && fieldValue(merge, f) ? "merge" : "keep"])) as MergeChoice;
}

function MergeModal({ pair, onClose }: { pair: DuplicatePair | null; onClose: () => void }) {
  const [choice, setChoice] = useState<MergeChoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!pair) return;
    setChoice(defaultChoice(pair.a, pair.b));
    setError(null);
  }, [pair]);

  if (!pair || !choice) return null;
  const { a: keep, b: merge } = pair;

  const save = () =>
    startTransition(async () => {
      try {
        const res = await mergeContacts(keep.id, merge.id, choice);
        if (res.ok) onClose();
        else setError(res.error);
      } catch {
        setError("Couldn't merge these contacts. Check your connection and try again.");
      }
    });

  return (
    <Modal
      open
      onClose={onClose}
      width={680}
      title="Merge 2 contacts"
      description="Choose which value to keep for each field."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button icon={<GitMerge aria-hidden />} onClick={save} disabled={pending} aria-busy={pending}>
            Merge contacts
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <Alert tone="danger" title={error} />}
        <div className="overflow-x-auto rounded-z-lg border border-z-line">
          <table className="w-full min-w-[560px] table-fixed border-collapse text-z-small">
            <colgroup>
              <col className="w-[130px]" />
              <col />
              <col />
            </colgroup>
            <thead className="bg-z-subtle">
              <tr className="border-b border-z-line text-left">
                <th scope="col" className="h-9 px-3 z-overline font-medium text-z-fg-muted">
                  Field
                </th>
                <th scope="col" className="h-9 truncate px-3 z-overline font-medium text-z-fg-muted">
                  Keep · {keep.code} ({keep.name})
                </th>
                <th scope="col" className="h-9 truncate px-3 z-overline font-medium text-z-fg-muted">
                  Merge in · {merge.code} ({merge.name})
                </th>
              </tr>
            </thead>
            <tbody>
              {FIELDS.map((f) => {
                const kv = fieldValue(keep, f);
                const mv = fieldValue(merge, f);
                const same = (kv ?? "").toLowerCase() === (mv ?? "").toLowerCase();
                return (
                  <tr key={f} className="border-b border-z-line last:border-b-0">
                    <th scope="row" className="px-3 py-2.5 text-left font-normal text-z-fg-muted">
                      {MERGE_FIELDS[f]}
                    </th>
                    {same ? (
                      <>
                        <td className="bg-z-selected px-3 py-2.5 font-medium text-z-fg">{kv ?? <Empty />}</td>
                        <td className="px-3 py-2.5 text-z-fg-muted">Same value</td>
                      </>
                    ) : (
                      (["keep", "merge"] as const).map((side) => {
                        const value = side === "keep" ? kv : mv;
                        const on = choice[f] === side;
                        return (
                          <td key={side} className={cx("p-0", on && "bg-z-selected")}>
                            <label className="flex min-h-10 cursor-pointer items-center gap-2.5 px-3 py-2">
                              <input
                                type="radio"
                                name={`merge-${f}`}
                                checked={on}
                                onChange={() => setChoice({ ...choice, [f]: side })}
                                className="z-focus size-4 shrink-0 accent-z-accent"
                              />
                              <span className={cx("min-w-0 flex-1 truncate", on ? "font-medium text-z-fg" : "text-z-fg-secondary")}>
                                {value ?? <Empty />}
                              </span>
                            </label>
                          </td>
                        );
                      })
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Alert tone="info" title="What happens when you merge">
          {merge.code} is folded into {keep.code}. Its calls, tasks, notes and any lead move across, the change is recorded in the activity
          history, and links to {merge.code} open {keep.code}. Merging can&apos;t be undone.
        </Alert>
      </div>
    </Modal>
  );
}

function Empty() {
  return <span className="font-normal text-z-fg-placeholder">— (empty)</span>;
}
