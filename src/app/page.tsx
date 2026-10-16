import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { parseRange } from "@/lib/range";
import { SignInButton } from "@/components/AuthButtons";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { AppShell } from "@/components/shell/AppShell";
import { Card, Logo } from "@/components/zedu";

export const dynamic = "force-dynamic";

type Props = { searchParams: { range?: string | string[] } };

export default async function Home({ searchParams }: Props) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <main className="zedu grid min-h-screen place-items-center bg-z-app px-4 py-6">
        <Card className="w-full max-w-[400px] items-start !gap-3 !p-8 max-sm:!p-6">
          <Logo />
          <h1 className="mt-4 text-z-page text-z-fg">Sale dashboard</h1>
          <p className="mb-2 text-z-small text-z-fg-muted">Sign in to see your calls, leads and follow-ups.</p>
          <SignInButton />
        </Card>
      </main>
    );
  }

  const data = await getDashboardData(parseRange(searchParams.range));
  const name = session.user.name ?? session.user.email ?? "there";

  return (
    <AppShell
      user={{ name, email: session.user.email, image: session.user.image }}
      openTaskCount={data.openTaskCount}
      unread={data.overdueCount > 0}
    >
      <Dashboard data={data} firstName={name.split(/\s+/)[0]} />
    </AppShell>
  );
}
