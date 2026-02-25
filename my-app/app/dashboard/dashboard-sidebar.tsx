"use client";

import { Sidebar } from "@/components/sidebar";
import {
  DashboardIcon,
  HomeIcon,
  PersonIcon,
  ChatBubbleIcon,
  EnvelopeClosedIcon,
  PlusIcon,
  CardStackIcon,
  CalendarIcon,
} from "@radix-ui/react-icons";

interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  role?: string;
}

// Agent navigation
const agentNavItems = [
  { icon: DashboardIcon, label: "Dashboard", href: "/dashboard" },
  { icon: HomeIcon, label: "Properties", href: "/dashboard/properties" },
  { icon: PersonIcon, label: "Tenants", href: "/dashboard/tenants" },
  { icon: ChatBubbleIcon, label: "Tickets", href: "/dashboard/tickets" },
  { icon: CalendarIcon, label: "Inspections", href: "/dashboard/inspections" },
  { icon: EnvelopeClosedIcon, label: "Invoices", href: "/dashboard/invoices" },
];

const agentActionItems = [
  { icon: PersonIcon, label: "Invite Tenant", href: "/dashboard/tenants" },
  { icon: PlusIcon, label: "Add Property", href: "/dashboard/properties" },
];

// Tenant navigation
const tenantNavItems = [
  { icon: DashboardIcon, label: "Dashboard", href: "/dashboard" },
  { icon: HomeIcon, label: "My Property", href: "#" },
  { icon: ChatBubbleIcon, label: "My Tickets", href: "/dashboard/tickets" },
  { icon: CalendarIcon, label: "Inspections", href: "/dashboard/inspections" },
  { icon: EnvelopeClosedIcon, label: "My Invoices", href: "/dashboard/invoices" },
];

const tenantActionItems = [
  { icon: PlusIcon, label: "Submit Ticket", href: "/dashboard/tickets" },
  { icon: CardStackIcon, label: "Pay Rent", href: "/dashboard/invoices" },
];

export function DashboardSidebar({ user }: { user: User }) {
  const isAgent = user.role === "AGENT";

  return (
    <Sidebar
      user={{
        id: user.id || "",
        name: user.name,
        email: user.email,
        role: user.role || "TENANT",
      }}
      navItems={isAgent ? agentNavItems : tenantNavItems}
      actionItems={isAgent ? agentActionItems : tenantActionItems}
      portalName={isAgent ? "Agent Portal" : "Tenant Portal"}
      portalColor={isAgent ? "emerald" : "blue"}
    />
  );
}

