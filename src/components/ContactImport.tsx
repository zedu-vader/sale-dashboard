"use client";

import { useState } from "react";

type Contact = {
  name: string;
  email: string;
  company: string;
  valid: boolean;
  error: string;
};

export default function ContactImport() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");

  function handleFileUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setMessage("Please upload a CSV file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const text = String(reader.result || "");
      const lines = text.trim().split(/\r?\n/);

      if (lines.length < 2) {
        setMessage("The CSV file contains no contact records.");
        setContacts([]);
        return;
      }

      const headers = lines[0]
        .split(",")
        .map((header) => header.trim().toLowerCase());

      const nameIndex = headers.indexOf("name");
      const emailIndex = headers.indexOf("email");
      const companyIndex = headers.indexOf("company");

      if (nameIndex === -1 || emailIndex === -1) {
        setMessage(
          "Your CSV must contain Name and Email columns."
        );
        setContacts([]);
        return;
      }

      const seenEmails = new Set<string>();

      const parsedContacts = lines.slice(1).map((line) => {
        const values = line.split(",").map((value) => value.trim());

        const name = values[nameIndex] || "";
        const email = values[emailIndex] || "";
        const company =
          companyIndex >= 0 ? values[companyIndex] || "" : "";

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
          name,
          email,
          company,
          valid: !error,
          error,
        };
      });

      setContacts(parsedContacts);
      setFileName(file.name);
      setMessage("CSV processed successfully.");
    };

    reader.onerror = () => {
      setMessage("Unable to read the selected file.");
    };

    reader.readAsText(file);
  }

  const validCount = contacts.filter((c) => c.valid).length;
  const invalidCount = contacts.length - validCount;

  function importContacts() {
    const validContacts = contacts.filter((c) => c.valid);

    if (validContacts.length === 0) {
      setMessage("There are no valid contacts to import.");
      return;
    }

    setMessage(
      `${validContacts.length} valid contacts are ready. ` +
      "Connect the import action to the CRM backend to save them."
    );
  }

  function downloadErrors() {
    const invalidContacts = contacts.filter((c) => !c.valid);

    if (invalidContacts.length === 0) {
      setMessage("There are no errors to download.");
      return;
    }

    const escapeCsv = (value: string) =>
      `"${value.replace(/"/g, '""')}"`;

    const rows = [
      ["Name", "Email", "Company", "Error"],
      ...invalidContacts.map((c) => [
        c.name,
        c.email,
        c.company,
        c.error,
      ]),
    ];

    const csv = rows
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" })
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = "contact-import-errors.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <section
      style={{
        maxWidth: 1050,
        margin: "40px auto",
        padding: 24,
        color: "#e8eaf0",
        background: "#11141c",
        borderRadius: 16,
      }}
    >
      <h1>Import Contacts</h1>

      <p style={{ color: "#a0a6b5" }}>
        Upload a CSV file to preview and validate your contacts.
      </p>

      <div
        style={{
          border: "1px dashed #596579",
          borderRadius: 12,
          padding: 28,
          margin: "24px 0",
          textAlign: "center",
        }}
      >
        <p>Choose a CSV file from your computer</p>

        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileUpload}
        />

        <p style={{ fontSize: 13 }}>
          Required columns: Name, Email. Company is optional.
        </p>
      </div>

      {fileName && <p>Selected file: {fileName}</p>}

      {message && (
        <p role="status" aria-live="polite">
          {message}
        </p>
      )}

      {contacts.length > 0 && (
        <>
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              margin: "24px 0",
            }}
          >
            <Summary label="Total records" value={contacts.length} />
            <Summary label="Valid records" value={validCount} />
            <Summary label="Invalid records" value={invalidCount} />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead>
                <tr>
                  {["Name", "Email", "Company", "Status"].map(
                    (heading) => (
                      <th
                        key={heading}
                        style={{
                          padding: 12,
                          borderBottom: "1px solid #303747",
                        }}
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {contacts.map((contact, index) => (
                  <tr key={`${contact.email}-${index}`}>
                    <td style={cellStyle}>{contact.name || "—"}</td>
                    <td style={cellStyle}>{contact.email || "—"}</td>
                    <td style={cellStyle}>{contact.company || "—"}</td>
                    <td
                      style={{
                        ...cellStyle,
                        color: contact.valid ? "#4ade80" : "#f87171",
                      }}
                    >
                      {contact.valid ? "Valid" : contact.error}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 24,
            }}
          >
            <button onClick={importContacts}>
              Import valid contacts
            </button>

            <button
              onClick={downloadErrors}
              style={{ background: "#303747" }}
            >
              Download error report
            </button>
          </div>
        </>
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
    <div
      style={{
        flex: "1 1 150px",
        padding: 18,
        background: "#1b2130",
        borderRadius: 10,
      }}
    >
      <p style={{ color: "#a0a6b5", margin: 0 }}>{label}</p>
      <strong style={{ fontSize: 28 }}>{value}</strong>
    </div>
  );
}

const cellStyle: React.CSSProperties = {
  padding: 12,
  borderBottom: "1px solid #303747",
};