import { auth } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { AgentDashboardContent } from "./agent-dashboard";
import { TenantDashboardContent } from "./tenant-dashboard";

export default async function Dashboard() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/");
  }

  const user = session.user;

  if (user.role === "AGENT") {
    return <AgentDashboardContent user={user} />;
  } else {
    return <TenantDashboardContent user={user} />;
  }
}
