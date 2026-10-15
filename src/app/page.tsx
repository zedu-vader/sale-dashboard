import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { parseRange } from "@/lib/range";
import { SignInButton } from "@/components/AuthButtons";
import { Dashboard } from "@/components/data/Dashboard";
import { AppShell } from "@/components/shell/AppShell";
import { Logo } from "@/components/shell/Sidebar";

export const dynamic = "force-dynamic";

type Props = { searchParams: { range?: string | string[] } };

export default async function Home({ searchParams }: Props) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <main className="grid min-h-screen place-items-center px-4 py-6">
        <div className="card flex w-full max-w-[400px] flex-col items-start gap-3 !p-8 max-sm:!p-6">
          <Logo />
          <h1 className="mt-4 text-h1 max-sm:text-h1-sm">Sale dashboard</h1>
          <p className="mb-2 text-body text-ink-muted">Sign in to see your calls, leads and follow-ups.</p>
          <SignInButton />
        </div>
      </main>
    );
  }

  const data = await getDashboardData(parseRange(searchParams.range));
  const name = session.user.name ?? session.user.email ?? "there";

  return (
    <AppShell
      user={{ name, email: session.user.email, image: session.user.image }}
      range={{ key: data.range.key, period: data.range.period }}
      newLeadCount={data.newLeadCount}
      target={data.target}
    >
      <Dashboard data={data} firstName={name.split(/\s+/)[0]} />
    </AppShell>
  );
}
