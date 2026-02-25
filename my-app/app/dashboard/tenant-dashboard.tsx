"use client";

import {
  HomeIcon,
  PlusIcon,
  CardStackIcon,
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
  agent?: {
    name: string;
    email: string;
  };
}

interface Ticket {
  id: string;
  title: string;
  status: "OPEN" | "IN_PROGRESS" | "DONE" | "CLOSED";
  createdAt: string;
}

interface Invoice {
  id: string;
  amount: number;
  billingMonth: string;
  status: "PENDING" | "PAID" | "OVERDUE";
}

export function TenantDashboardContent({ user }: { user: User }) {
  // ✅ 使用 React Query hooks
  const { data: properties = [], isLoading: propertiesLoading } = useProperties();
  const { data: tickets = [], isLoading: ticketsLoading } = useTickets();
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();

  // 获取租户的房产（第一个）
  const property = properties.length > 0 ? properties[0] : null;

  // 综合加载状态
  const isLoading = propertiesLoading || ticketsLoading || invoicesLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <ReloadIcon className="animate-spin h-8 w-8 text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Welcome, {user.name}!</h1>
        <p className="text-gray-500 mt-1">Here&apos;s your rental overview.</p>
      </div>

      {/* Property Card */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Your Property</p>
            {property ? (
              <>
                <h2 className="text-xl font-bold text-gray-800">{property.title}</h2>
                <p className="text-gray-500 mt-1">{property.address}</p>
                <div className="flex items-center gap-4 mt-4">
                  <div>
                    <p className="text-xs text-gray-500">Monthly Rent</p>
                    <p className="text-lg font-bold text-emerald-600">
                      ${Number(property.rent).toLocaleString()}
                    </p>
                  </div>
                  {property.agent && (
                    <>
                      <div className="w-px h-10 bg-gray-200"></div>
                      <div>
                        <p className="text-xs text-gray-500">Agent</p>
                        <p className="text-sm font-medium text-gray-800">{property.agent.name}</p>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <p className="text-gray-500">No property assigned yet.</p>
            )}
          </div>
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
            <HomeIcon className="w-12 h-12 text-white" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <a href="/dashboard/tickets" className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow text-left group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
              <PlusIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Submit Maintenance Ticket</p>
              <p className="text-sm text-gray-500">Report an issue with your property</p>
            </div>
          </div>
        </a>

        <a href="/dashboard/invoices" className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow text-left group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
              <CardStackIcon className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Pay Rent</p>
              <p className="text-sm text-gray-500">Make your monthly payment</p>
            </div>
          </div>
        </a>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Tickets */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">My Tickets</h2>
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
                  status={ticket.status.toLowerCase()}
                  date={new Date(ticket.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                />
              ))
            )}
          </div>
        </div>

        {/* My Invoices */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Recent Invoices</h2>
            <a href="/dashboard/invoices" className="text-sm text-emerald-600 hover:text-emerald-700">View all</a>
          </div>
          <div className="space-y-3">
            {invoices.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">No invoices yet</p>
            ) : (
              invoices.slice(0, 3).map((invoice) => (
                <InvoiceItem
                  key={invoice.id}
                  id={invoice.id}
                  month={new Date(invoice.billingMonth).toLocaleDateString("en-US", { year: "numeric", month: "long" })}
                  amount={`$${Number(invoice.amount).toLocaleString()}`}
                  status={invoice.status.toLowerCase()}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TicketItem({ title, status, date }: { title: string; status: string; date: string }) {
  const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
    open: { bg: "bg-blue-100", text: "text-blue-700", label: "Open" },
    in_progress: { bg: "bg-amber-100", text: "text-amber-700", label: "In Progress" },
    done: { bg: "bg-green-100", text: "text-green-700", label: "Done" },
    closed: { bg: "bg-gray-100", text: "text-gray-700", label: "Closed" },
  };

  const s = statusStyles[status] || statusStyles.open;

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
      <div>
        <p className="text-sm font-medium text-gray-800">{title}</p>
        <p className="text-xs text-gray-500">{date}</p>
      </div>
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${s.bg} ${s.text}`}>
        {s.label}
      </span>
    </div>
  );
}

function InvoiceItem({ id, month, amount, status }: { id: string; month: string; amount: string; status: string }) {
  const isPaid = status === "paid";

  const handlePayClick = async () => {
    try {
      const res = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: id }),
      });

      const data = await res.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error("Payment error:", error);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
      <div>
        <p className="text-sm font-medium text-gray-800">{month}</p>
        <p className="text-lg font-bold text-gray-800">{amount}</p>
      </div>
      {isPaid ? (
        <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
          ✓ Paid
        </span>
      ) : (
        <button
          onClick={handlePayClick}
          className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors"
        >
          Pay Now
        </button>
      )}
    </div>
  );
}
