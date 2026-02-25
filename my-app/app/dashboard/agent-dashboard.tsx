"use client";

import { ComponentType } from "react";
import {
  HomeIcon,
  PersonIcon,
  ChatBubbleIcon,
  StackIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import { useProperties } from "@/app/hooks/use-properties";
import { useTickets } from "@/app/hooks/use-tickets";
import { useInvoices } from "@/app/hooks/use-invoices";

interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  role?: string;
}

interface Property {
  id: string;
  title: string;
  address: string;
  rent: number;
  tenant?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface Ticket {
  id: string;
  title: string;
  status: "OPEN" | "IN_PROGRESS" | "DONE" | "CLOSED";
  isUrgent: boolean;
  createdAt: string;
  property: {
    id: string;
    title: string;
    address: string;
  };
}

interface Invoice {
  id: string;
  amount: number;
  status: "PENDING" | "PAID" | "OVERDUE";
}

export function AgentDashboardContent({ user }: { user: User }) {
  // ✅ 使用 React Query hooks
  const { data: properties = [], isLoading: propertiesLoading } = useProperties();
  const { data: tickets = [], isLoading: ticketsLoading } = useTickets();
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();

  // 综合加载状态
  const isLoading = propertiesLoading || ticketsLoading || invoicesLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <ReloadIcon className="animate-spin h-8 w-8 text-emerald-500" />
      </div>
    );
  }

  // Calculate stats
  const totalProperties = properties.length;
  const totalTenants = properties.filter(p => p.tenant).length;
  const openTickets = tickets.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS").length;
  const totalRevenue = invoices
    .filter(i => i.status === "PAID")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {user.name}! Here&apos;s your property overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Properties" value={totalProperties.toString()} icon={HomeIcon} color="blue" />
        <StatCard title="Tenants" value={totalTenants.toString()} icon={PersonIcon} color="green" />
        <StatCard title="Open Tickets" value={openTickets.toString()} icon={ChatBubbleIcon} color="orange" />
        <StatCard
          title="Revenue"
          value={totalRevenue > 0 ? `$${(totalRevenue / 1000).toFixed(1)}k` : "$0"}
          icon={StackIcon}
          color="purple"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Tickets */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Recent Tickets</h2>
            <a href="/dashboard/tickets" className="text-sm text-emerald-600 hover:text-emerald-700">View all</a>
          </div>
          <div className="space-y-3">
            {tickets.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">No tickets yet</p>
            ) : (
              tickets.slice(0, 3).map((ticket) => (
                <TicketItem
                  key={ticket.id}
                  title={ticket.title}
                  property={ticket.property.title}
                  status={ticket.status.toLowerCase()}
                  urgent={ticket.isUrgent}
                />
              ))
            )}
          </div>
        </div>

        {/* Properties Overview */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Properties</h2>
            <a href="/dashboard/properties" className="text-sm text-emerald-600 hover:text-emerald-700">View all</a>
          </div>
          <div className="space-y-3">
            {properties.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">No properties yet</p>
            ) : (
              properties.slice(0, 3).map((property) => (
                <PropertyItem
                  key={property.id}
                  title={property.title}
                  tenant={property.tenant?.name || null}
                  rent={`$${Number(property.rent).toLocaleString()}`}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string; icon: ComponentType<{ className?: string }>; color: string }) {
  const colors: Record<string, { iconBg: string; text: string }> = {
    blue: { iconBg: "bg-blue-100", text: "text-blue-600" },
    green: { iconBg: "bg-green-100", text: "text-green-600" },
    orange: { iconBg: "bg-orange-100", text: "text-orange-600" },
    purple: { iconBg: "bg-purple-100", text: "text-purple-600" },
  };

  const c = colors[color];

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${c.iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${c.text}`} />
        </div>
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );
}

function TicketItem({ title, property, status, urgent }: { title: string; property: string; status: string; urgent?: boolean }) {
  const statusStyles: Record<string, { bg: string; label: string }> = {
    open: { bg: "bg-blue-100 text-blue-700", label: "Open" },
    in_progress: { bg: "bg-amber-100 text-amber-700", label: "In Progress" },
    done: { bg: "bg-green-100 text-green-700", label: "Done" },
    closed: { bg: "bg-gray-100 text-gray-700", label: "Closed" },
  };

  const s = statusStyles[status] || statusStyles.open;

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
      <div className="flex items-center gap-3">
        {urgent && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
        <div>
          <p className="text-sm font-medium text-gray-800">{title}</p>
          <p className="text-xs text-gray-500">{property}</p>
        </div>
      </div>
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${s.bg}`}>
        {s.label}
      </span>
    </div>
  );
}

function PropertyItem({ title, tenant, rent }: { title: string; tenant: string | null; rent: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
      <div>
        <p className="text-sm font-medium text-gray-800">{title}</p>
        <p className="text-xs text-gray-500">
          {tenant ? `Tenant: ${tenant}` : <span className="text-amber-600">Vacant</span>}
        </p>
      </div>
      <span className="text-sm font-semibold text-emerald-600">{rent}/mo</span>
    </div>
  );
}
