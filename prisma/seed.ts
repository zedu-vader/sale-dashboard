import { CallOutcome, CallConnectionStatus, LegacyCallOutcome, LeadStatus, LeadType, LostReason, PrismaClient } from "@prisma/client";

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
    { name: "Tunde Adebayo", phone: "+234 803 123 4567", type: LeadType.INDIVIDUAL, status: LeadStatus.INTERESTED, ownerName: "You", nextAction: "Call again", nextActionAt: at(-2), call: at(0, 10, 12), legacyOutcome: LegacyCallOutcome.CONNECTED },
    { name: "Flourish Ltd", phone: "+234 802 987 6543", type: LeadType.BUSINESS, status: LeadStatus.FOLLOW_UP, ownerName: "You", nextAction: "Send details", nextActionAt: at(-1), call: at(1, 16, 20), legacyOutcome: LegacyCallOutcome.CONNECTED },
    { name: "Kemi Ibrahim", phone: "+234 816 222 3344", type: LeadType.INDIVIDUAL, status: LeadStatus.LOST, lostReason: LostReason.NOT_INTERESTED, ownerName: "Sarah", call: at(1, 11, 5), legacyOutcome: LegacyCallOutcome.NOT_INTERESTED },
    { name: "Ben Okafor", phone: "+234 809 444 2211", type: LeadType.BUSINESS, status: LeadStatus.CONNECTED, ownerName: "You", nextAction: "Call again", nextActionAt: at(-1), call: at(2, 9, 30), legacyOutcome: LegacyCallOutcome.CONNECTED },
    { name: "Amaka Akintola", phone: "+234 818 765 4321", type: LeadType.INDIVIDUAL, status: LeadStatus.WON, ownerName: "Tolu", call: at(3, 15, 45), legacyOutcome: LegacyCallOutcome.CONNECTED },
  ];
  for (const [i, { call, legacyOutcome, ...lead }] of named.entries()) {
    await prisma.lead.create({
      data: { ...lead, createdAt: at(5 - i, 8), calls: { create: {
        calledAt: call,
        legacyOutcome,
        connectionStatus: CallConnectionStatus.CONNECTED,
        outcome: legacyOutcome === LegacyCallOutcome.NOT_INTERESTED ? CallOutcome.NOT_INTERESTED : CallOutcome.OTHER,
      } } },
    });
  }

  // Calls: the mock's last 7 days, plus quieter background days for earlier in the month/previous period.
  const calls: { leadId: string; outcome: CallOutcome; legacyOutcome: LegacyCallOutcome; connectionStatus: CallConnectionStatus; calledAt: Date }[] = [];
  const addDay = (daysAgo: number, connected: number, unanswered: number) => {
    for (let i = 0; i < connected; i++) {
      const r = rand();
      const legacyOutcome = r < 0.1 ? LegacyCallOutcome.NOT_INTERESTED : r < 0.18 ? LegacyCallOutcome.OTHER : LegacyCallOutcome.CONNECTED;
      const outcome = legacyOutcome === LegacyCallOutcome.NOT_INTERESTED ? CallOutcome.NOT_INTERESTED : CallOutcome.OTHER;
      calls.push({ leadId: pick(fillerIds), outcome, legacyOutcome, connectionStatus: CallConnectionStatus.CONNECTED, calledAt: at(daysAgo, 8 + Math.floor(rand() * 9), Math.floor(rand() * 60)) });
    }
    for (let i = 0; i < unanswered; i++) {
      calls.push({ leadId: pick(fillerIds), outcome: CallOutcome.NOT_APPLICABLE, legacyOutcome: LegacyCallOutcome.NO_ANSWER, connectionStatus: CallConnectionStatus.NOT_CONNECTED, calledAt: at(daysAgo, 8 + Math.floor(rand() * 9), Math.floor(rand() * 60)) });
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

  console.log(`Seeded ${filler.length + named.length} leads, ${calls.length + named.length} calls, 6 tasks.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
