"use client";

import { useState } from "react";
import Papa from "papaparse";

type Contact = {
  id: string;
  name: string;
  email: string;
  company: string;
  valid: boolean;
  error: string;
  excluded: boolean;
};

type CsvRow = {
  name?: string;
  email?: string;
  company?: string;
};

export default function ContactImport() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  function handleFileUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setMessage("Please upload a CSV file.");
      return;
    }

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header) => header.trim().toLowerCase(),
      transform: (value) => value.trim(),

      complete: (result) => {
        const headers = result.meta.fields ?? [];

        if (
          !headers.includes("name") ||
          !headers.includes("email")
        ) {
          setContacts([]);
          setFileName("");
          setMessage(
            "Your CSV must contain Name and Email columns."
          );
          return;
        }

        if (result.data.length === 0) {
          setContacts([]);
          setFileName("");
          setMessage("The CSV file contains no contact records.");
          return;
        }

        const seenEmails = new Set<string>();

        const parsedContacts: Contact[] = result.data.map(
          (row, index) => {
            const name = row.name?.trim() ?? "";
            const email = row.email?.trim() ?? "";
            const company = row.company?.trim() ?? "";
            const normalizedEmail = email.toLowerCase();

            let error = "";

            if (!name) {
              error = "Name is required";
            } else if (
              !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
            ) {
              error = "Invalid email address";
            } else if (seenEmails.has(normalizedEmail)) {
              error = "Duplicate email address";
            }

            if (normalizedEmail) {
              seenEmails.add(normalizedEmail);
            }

            return {
              id: `${index}-${normalizedEmail}`,
              name,
              email,
              company,
              valid: !error,
              error,
              excluded: false,
            };
          }
        );

        setContacts(parsedContacts);
        setFileName(file.name);
        setIsConfirming(false);

        const errorCount = result.errors.length;

        setMessage(
          errorCount > 0
            ? `CSV processed with ${errorCount} parsing warning(s). Review the records below.`
            : "CSV processed successfully. Review your contacts below."
        );
      },

      error: () => {
        setContacts([]);
        setFileName("");
        setMessage("Unable to read the selected CSV file.");
      },
    });
  }

  function updateContact(
    id: string,
    field: "name" | "email" | "company",
    value: string
  ) {
    setContacts((current) => {
      const updated = current.map((contact) =>
        contact.id === id
          ? { ...contact, [field]: value }
          : contact
      );

      const seenEmails = new Set<string>();

      return updated.map((contact) => {
        const normalizedEmail = contact.email.trim().toLowerCase();

        let error = "";

        if (!contact.name.trim()) {
          error = "Name is required";
        } else if (
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            contact.email.trim()
          )
        ) {
          error = "Invalid email address";
        } else if (seenEmails.has(normalizedEmail)) {
          error = "Duplicate email address";
        }

        if (normalizedEmail) {
          seenEmails.add(normalizedEmail);
        }

        return {
          ...contact,
          valid: !error,
          error,
        };
      });
    });

    setMessage("Contact updated. Review its validation status.");
  }

  function toggleExcluded(id: string) {
    setContacts((current) =>
      current.map((contact) =>
        contact.id === id
          ? { ...contact, excluded: !contact.excluded }
          : contact
      )
    );
  }

  const includedContacts = contacts.filter(
    (contact) => !contact.excluded
  );

  const validCount = includedContacts.filter(
    (contact) => contact.valid
  ).length;

  const invalidCount = includedContacts.length - validCount;

  const excludedCount = contacts.length - includedContacts.length;

  function importContacts() {
    if (validCount === 0) {
      setMessage("There are no valid contacts ready to import.");
      return;
    }

    setIsConfirming(true);
  }

  function confirmImport() {
    const readyCount = includedContacts.filter(
      (contact) => contact.valid
    ).length;

    setMessage(
      `${readyCount} contacts passed validation. Confirmation is complete, but saving them requires the CRM backend integration.`
    );

    setIsConfirming(false);
  }

  function downloadErrors() {
    const invalidContacts = contacts.filter(
      (contact) => !contact.valid && !contact.excluded
    );

    if (invalidContacts.length === 0) {
      setMessage("There are no errors to download.");
      return;
    }

    const rows = invalidContacts.map((contact) => ({
      Name: contact.name,
      Email: contact.email,
      Company: contact.company,
      Error: contact.error,
    }));

    const csv = Papa.unparse(rows);

    const url = URL.createObjectURL(
      new Blob(["\uFEFF", csv], {
        type: "text/csv;charset=utf-8;",
      })
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = "contact-import-errors.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    setMessage("Error report downloaded successfully.");
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <header>
        <h1 className="text-h1 max-sm:text-h1-sm">
          Import Contacts
        </h1>

        <p className="mt-2 text-body text-ink-muted">
          Upload, validate, and review contacts before importing
          them into your CRM.
        </p>
      </header>

      <div className="rounded-xl border border-line bg-surface p-6 shadow-card">
        <h2 className="text-lg font-semibold text-ink">
          Upload CSV
        </h2>

        <p className="mt-1 text-sm text-ink-muted">
          Required columns: Name and Email. Company is optional.
        </p>

        <div className="mt-5 rounded-lg border border-dashed border-line p-6">
          <label
            htmlFor="contact-csv"
            className="block text-sm font-medium text-ink"
          >
            Choose a CSV file
          </label>

          <input
            id="contact-csv"
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileUpload}
            className="mt-3 block w-full text-sm text-ink-muted file:mr-4 file:rounded-lg file:border-0 file:bg-brand-soft file:px-4 file:py-2 file:font-medium file:text-ink"
          />
        </div>

        {fileName && (
          <p className="mt-3 text-sm text-ink-muted">
            Selected file: {fileName}
          </p>
        )}

        {message && (
          <p
            role="status"
            aria-live="polite"
            className="mt-4 rounded-lg bg-brand-soft p-3 text-sm text-ink"
          >
            {message}
          </p>
        )}
      </div>

      {contacts.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Summary label="Total records" value={contacts.length} />
            <Summary label="Valid records" value={validCount} />
            <Summary label="Invalid records" value={invalidCount} />
            <Summary label="Excluded records" value={excludedCount} />
          </div>

          <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
            <div className="border-b border-line p-5">
              <h2 className="text-lg font-semibold text-ink">
                Review contacts
              </h2>

              <p className="mt-1 text-sm text-ink-muted">
                Correct invalid details or exclude records you do not
                want to import.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-surface-muted">
                  <tr>
                    {[
                      "Name",
                      "Email",
                      "Company",
                      "Status",
                      "Action",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="border-b border-line px-4 py-3 font-medium text-ink-muted"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {contacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className={
                        contact.excluded
                          ? "opacity-50"
                          : "hover:bg-surface-muted"
                      }
                    >
                      <td className="border-b border-line p-3">
                        <input
                          aria-label={`Name for ${contact.email || "contact"}`}
                          value={contact.name}
                          disabled={contact.excluded}
                          onChange={(event) =>
                            updateContact(
                              contact.id,
                              "name",
                              event.target.value
                            )
                          }
                          className="w-40 rounded-md border border-line bg-surface px-2 py-1 text-ink"
                        />
                      </td>

                      <td className="border-b border-line p-3">
                        <input
                          aria-label={`Email for ${contact.name || "contact"}`}
                          value={contact.email}
                          disabled={contact.excluded}
                          onChange={(event) =>
                            updateContact(
                              contact.id,
                              "email",
                              event.target.value
                            )
                          }
                          className="w-52 rounded-md border border-line bg-surface px-2 py-1 text-ink"
                        />
                      </td>

                      <td className="border-b border-line p-3">
                        <input
                          aria-label={`Company for ${contact.name || "contact"}`}
                          value={contact.company}
                          disabled={contact.excluded}
                          onChange={(event) =>
                            updateContact(
                              contact.id,
                              "company",
                              event.target.value
                            )
                          }
                          className="w-40 rounded-md border border-line bg-surface px-2 py-1 text-ink"
                        />
                      </td>

                      <td className="border-b border-line p-3">
                        <span
                          className={
                            contact.valid
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {contact.excluded
                            ? "Excluded"
                            : contact.valid
                              ? "Valid"
                              : contact.error}
                        </span>
                      </td>

                      <td className="border-b border-line p-3">
                        <button
                          type="button"
                          onClick={() => toggleExcluded(contact.id)}
                          className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-muted"
                        >
                          {contact.excluded ? "Include" : "Exclude"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-3 p-5">
              <button
                type="button"
                onClick={importContacts}
                disabled={validCount === 0}
                className="rounded-lg bg-brand px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Review import
              </button>

              <button
                type="button"
                onClick={downloadErrors}
                disabled={invalidCount === 0}
                className="rounded-lg border border-line px-4 py-2 font-medium text-ink hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Download error report
              </button>
            </div>
          </div>
        </>
      )}

      {isConfirming && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="import-confirmation-title"
          className="rounded-xl border border-line bg-surface p-6 shadow-card"
        >
          <h2
            id="import-confirmation-title"
            className="text-lg font-semibold text-ink"
          >
            Confirm contact import
          </h2>

          <p className="mt-2 text-sm text-ink-muted">
            {validCount} valid contacts are ready.{" "}
            {invalidCount} invalid contacts will be skipped, and{" "}
            {excludedCount} excluded contacts will not be included.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={confirmImport}
              className="rounded-lg bg-brand px-4 py-2 font-medium text-white"
            >
              Confirm
            </button>

            <button
              type="button"
              onClick={() => setIsConfirming(false)}
              className="rounded-lg border border-line px-4 py-2 font-medium text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function Summary({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-card">
      <p className="text-sm text-ink-muted">{label}</p>
      <strong className="mt-2 block text-2xl font-semibold text-ink">
        {value}
      </strong>
    </div>
  );
}