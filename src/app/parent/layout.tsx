import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("PARENT");
  return <AppShell user={user}>{children}</AppShell>;
}
