import { CallOutcome, LeadStatus, LeadType, LostReason, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Deterministic PRNG so re-seeding gives the same numbers.
let state = 42;
const rand = () => ((state = (state * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);
const pick = <T>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)];

/** Date `daysAgo` days before today at the given local time. */
function at(daysAgo: number, h = 9, m = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(h, m, 0, 0);
  return d;
}

// Sample rows from the original mock: [daysAgo, made, connected, unanswered].
const recentDays: [number, number, number, number][] = [
  [6, 44, 29, 15], [5, 44, 26, 18], [4, 52, 32, 20], [3, 50, 32, 18],
  [2, 44, 29, 15], [1, 44, 26, 18], [0, 44, 29, 15],
];

const firstNames = ["Chidi", "Ngozi", "Femi", "Bola", "Ifeoma", "Segun", "Zainab", "Emeka", "Yemi", "Halima", "Obinna", "Funke"];
const lastNames = ["Okeke", "Balogun", "Adeyemi", "Musa", "Eze", "Ogunleye", "Nwosu", "Bello", "Afolabi", "Danjuma"];
const companies = ["Ltd", "Ventures", "Global", "Enterprises", "Hub", "Logistics"];
const owners = ["You", "Sarah", "Tolu"];
// Weighted towards the early pipeline, roughly 12% won.
const fillerStatuses: LeadStatus[] = [
  "NEW", "NEW", "CONTACTED", "CONTACTED", "CONNECTED", "INTERESTED", "INTERESTED",
  "FOLLOW_UP", "FOLLOW_UP", "QUALIFIED", "PROPOSAL", "WON", "WON", "LOST", "LOST", "LOST",
];

async function main() {
  await prisma.call.deleteMany();
  await prisma.task.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.lead.deleteMany();

  // Background leads spread over the last ~45 days (gives the KPIs a previous period).
  const filler = [];
  for (let i = 0; i < 60; i++) {
    const business = rand() < 0.35;
    const first = pick(firstNames);
    const last = pick(lastNames);
    const status = pick(fillerStatuses);
    filler.push({
      name: business ? `${last} ${pick(companies)}` : `${first} ${last}`,
      phone: `+234 80${Math.floor(rand() * 10)} ${String(Math.floor(rand() * 1000)).padStart(3, "0")} ${String(Math.floor(rand() * 10000)).padStart(4, "0")}`,
      type: business ? LeadType.BUSINESS : LeadType.INDIVIDUAL,
      status,
      lostReason: status === LeadStatus.LOST ? pick(Object.values(LostReason)) : null,
      ownerName: pick(owners),
      createdAt: at(7 + Math.floor(rand() * 38), 8 + Math.floor(rand() * 9)),
    });
  }
  await prisma.lead.createMany({ data: filler });
  const fillerIds = (await prisma.lead.findMany({ select: { id: true } })).map((l) => l.id);

  // The five leads shown in the mock, newest first.
  const named = [
    { name: "Tunde Adebayo", phone: "+234 803 123 4567", type: LeadType.INDIVIDUAL, status: LeadStatus.INTERESTED, ownerName: "You", nextAction: "Call again", nextActionAt: at(-2), call: at(0, 10, 12), outcome: CallOutcome.CONNECTED },
    { name: "Flourish Ltd", phone: "+234 802 987 6543", type: LeadType.BUSINESS, status: LeadStatus.FOLLOW_UP, ownerName: "You", nextAction: "Send details", nextActionAt: at(-1), call: at(1, 16, 20), outcome: CallOutcome.CONNECTED },
    { name: "Kemi Ibrahim", phone: "+234 816 222 3344", type: LeadType.INDIVIDUAL, status: LeadStatus.LOST, lostReason: LostReason.NOT_INTERESTED, ownerName: "Sarah", call: at(1, 11, 5), outcome: CallOutcome.NOT_INTERESTED },
    { name: "Ben Okafor", phone: "+234 809 444 2211", type: LeadType.BUSINESS, status: LeadStatus.CONNECTED, ownerName: "You", nextAction: "Call again", nextActionAt: at(-1), call: at(2, 9, 30), outcome: CallOutcome.CONNECTED },
    { name: "Amaka Akintola", phone: "+234 818 765 4321", type: LeadType.INDIVIDUAL, status: LeadStatus.WON, ownerName: "Tolu", call: at(3, 15, 45), outcome: CallOutcome.CONNECTED },
  ];
  for (const [i, { call, outcome, ...lead }] of named.entries()) {
    await prisma.lead.create({
      data: { ...lead, createdAt: at(5 - i, 8), calls: { create: { outcome, calledAt: call } } },
    });
  }

  // Calls: the mock's last 7 days, plus quieter background days for earlier in the month/previous period.
  const calls: { leadId: string; outcome: CallOutcome; calledAt: Date }[] = [];
  const addDay = (daysAgo: number, connected: number, unanswered: number) => {
    for (let i = 0; i < connected; i++) {
      const r = rand();
      const outcome = r < 0.1 ? CallOutcome.NOT_INTERESTED : r < 0.18 ? CallOutcome.OTHER : CallOutcome.CONNECTED;
      calls.push({ leadId: pick(fillerIds), outcome, calledAt: at(daysAgo, 8 + Math.floor(rand() * 9), Math.floor(rand() * 60)) });
    }
    for (let i = 0; i < unanswered; i++) {
      calls.push({ leadId: pick(fillerIds), outcome: CallOutcome.NO_ANSWER, calledAt: at(daysAgo, 8 + Math.floor(rand() * 9), Math.floor(rand() * 60)) });
    }
  };
  // The named-lead calls above already account for one connected call on some days; close enough for sample data.
  for (const [daysAgo, , connected, unanswered] of recentDays) addDay(daysAgo, connected, unanswered);
  for (let daysAgo = 7; daysAgo < 45; daysAgo++) {
    const made = 25 + Math.floor(rand() * 20);
    const connected = Math.round(made * (0.45 + rand() * 0.15));
    addDay(daysAgo, connected, made - connected);
  }
  await prisma.call.createMany({ data: calls });

  await prisma.task.createMany({
    data: [
      { title: "Send proposal to Okeke Global", subtitle: "Pricing for 20 seats", dueAt: at(1, 15, 0) },
      { title: "Call Tunde Adebayo", subtitle: "Follow up on product interest", dueAt: at(0, 10, 0) },
      { title: "Call Flourish Ltd", subtitle: "Discuss onboarding", dueAt: at(0, 11, 30) },
      { title: "Follow up with Kemi", subtitle: "Share product details", dueAt: at(-1, 10, 0) },
      { title: "Call Ben Okafor", subtitle: "Check decision", dueAt: at(-1, 12, 0) },
      { title: "Update lead notes", subtitle: "Log call outcomes", dueAt: at(-1, 16, 0) },
    ],
  });

  // Contacts: people the team knows. Mix of not-yet-reached-out, one linked to an
  // existing lead (Tunde Adebayo), and a duplicate pair sharing a phone number.
  const tunde = await prisma.lead.findFirst({ where: { name: "Tunde Adebayo" } });
  const contactSeed = [
    {
      name: "Adaeze Okonkwo",
      phone: "+234 803 555 0192",
      email: "adaeze.okonkwo@zenithlogistics.ng",
      company: "Zenith Logistics",
      type: LeadType.BUSINESS,
      notes: "Met at the Lagos tech meetup. Runs a 40-person ops team, interested in bulk pricing.",
      createdAt: at(12, 14, 20),
    },
    {
      name: "Chuka Eneh",
      phone: "+234 806 444 7754",
      email: null,
      company: null,
      type: LeadType.INDIVIDUAL,
      notes: "Ex-colleague of Sarah's. Runs a small coaching business, no email on file yet.",
      createdAt: at(9, 9, 5),
    },
    {
      name: "Fatima Bello",
      phone: "+234 809 321 8877",
      email: "fatima@belloweaves.com",
      company: "Bello Weaves",
      type: LeadType.BUSINESS,
      notes: null,
      createdAt: at(8, 16, 45),
    },
    {
      name: "Ifeanyi Ubah",
      phone: "+234 802 118 4403",
      email: "ifeanyi.ubah@gmail.com",
      company: null,
      type: LeadType.INDIVIDUAL,
      notes: "Referred by Amaka (closed customer). Budget unlikely before Q3.",
      createdAt: at(5, 11, 30),
    },
    {
      name: "Adaeze Okonkwo",
      phone: "+234 803 555 0192",
      email: null,
      company: "Zenith Logistics Ltd",
      type: LeadType.BUSINESS,
      notes: "Added again from a conference list — likely the same person as the other Adaeze.",
      createdAt: at(2, 10, 10),
    },
    {
      name: "Tunde Adebayo",
      phone: "+234 803 123 4567",
      email: "tunde.adebayo@flourish.co",
      company: "Flourish Ltd",
      type: LeadType.INDIVIDUAL,
      notes: "Already in the pipeline as a lead.",
      createdAt: at(6, 8, 55),
    },
  ];

  for (const c of contactSeed) {
    await prisma.contact.create({
      data: { ...c, leadId: c.name === "Tunde Adebayo" ? tunde?.id ?? null : null },
    });
  }

  console.log(
    `Seeded ${filler.length + named.length} leads, ${calls.length + named.length} calls, 6 tasks, ${contactSeed.length} contacts.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
