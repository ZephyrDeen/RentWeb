"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  EnvelopeClosedIcon,
  ReloadIcon,
  CheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircledIcon,
  Cross2Icon,
} from "@radix-ui/react-icons";
import { useInvoices } from "@/app/hooks/use-invoices";

interface Invoice {
  id: string;
  amount: number;
  dueDate: string;
  billingMonth: string;
  status: "PENDING" | "PAID" | "OVERDUE";
  paidAt: string | null;
  property: {
    id: string;
    title: string;
    address: string;
  };
  tenant?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function InvoicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // ✅ 使用 React Query
  const { data: invoices = [], isLoading, error: queryError } = useInvoices();
  
  // UI state
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for payment success/cancel from URL params
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");

    if (success === "true") {
      setSuccessMessage("Payment successful! Your invoice has been paid.");
      // Clear URL params after showing message
      router.replace("/dashboard/invoices");
    }

    if (canceled === "true") {
      setError("Payment was canceled. You can try again when ready.");
      router.replace("/dashboard/invoices");
    }
  }, [searchParams, router]);

  // Get user role from session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        if (session?.user?.role) {
          setUserRole(session.user.role);
        }
      } catch (err) {
        console.error("Failed to get session:", err);
      }
    };
    checkSession();
  }, []);

  // State for payment processing
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);

  // Handle Stripe payment
  const handlePayWithStripe = async (invoiceId: string) => {
    setPayingInvoiceId(invoiceId);
    setError(null);

    try {
      const res = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      // Redirect to Stripe Checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to initiate payment";
      setError(errorMessage);
      setPayingInvoiceId(null);
    }
  };

  const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
    PENDING: {
      bg: "bg-amber-100",
      text: "text-amber-700",
      icon: <ClockIcon className="w-4 h-4" />,
      label: "Pending",
    },
    PAID: {
      bg: "bg-green-100",
      text: "text-green-700",
      icon: <CheckIcon className="w-4 h-4" />,
      label: "Paid",
    },
    OVERDUE: {
      bg: "bg-red-100",
      text: "text-red-700",
      icon: <ExclamationTriangleIcon className="w-4 h-4" />,
      label: "Overdue",
    },
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatMonth = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {userRole === "AGENT" ? "Invoices" : "My Invoices"}
          </h1>
          <p className="text-gray-500 mt-1">
            {userRole === "AGENT"
              ? "Manage rent invoices for your tenants"
              : "View and pay your rent invoices"}
          </p>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircledIcon className="w-5 h-5" />
            {successMessage}
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-500 hover:text-green-700"
          >
            <Cross2Icon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5" />
            {error}
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            <Cross2Icon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Pending</p>
              <p className="text-2xl font-bold text-gray-800">
                {invoices.filter((i) => i.status === "PENDING").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Paid</p>
              <p className="text-2xl font-bold text-gray-800">
                {invoices.filter((i) => i.status === "PAID").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Overdue</p>
              <p className="text-2xl font-bold text-gray-800">
                {invoices.filter((i) => i.status === "OVERDUE").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      {invoices.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <EnvelopeClosedIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No invoices yet</h2>
          <p className="text-gray-500">
            {userRole === "AGENT"
              ? "Create invoices for your tenants"
              : "You don't have any invoices yet"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Billing Period
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                {userRole === "AGENT" && (
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tenant
                  </th>
                )}
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((invoice) => {
                const status = statusConfig[invoice.status];
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">
                        {formatMonth(invoice.billingMonth)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-800">{invoice.property.title}</p>
                      <p className="text-xs text-gray-500">{invoice.property.address}</p>
                    </td>
                    {userRole === "AGENT" && (
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-800">{invoice.tenant?.name}</p>
                        <p className="text-xs text-gray-500">{invoice.tenant?.email}</p>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <p className="text-lg font-bold text-gray-800">
                        ${Number(invoice.amount).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{formatDate(invoice.dueDate)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${status.bg} ${status.text}`}
                      >
                        {status.icon}
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {invoice.status === "PENDING" && userRole === "TENANT" && (
                        <button
                          onClick={() => handlePayWithStripe(invoice.id)}
                          disabled={payingInvoiceId === invoice.id}
                          className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 rounded-lg transition-colors flex items-center gap-2 ml-auto"
                        >
                          {payingInvoiceId === invoice.id ? (
                            <>
                              <ReloadIcon className="animate-spin w-4 h-4" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 10h18v4H3v-4zm0-6h18v4H3V4zm0 12h18v4H3v-4z" />
                              </svg>
                              Pay with Stripe
                            </>
                          )}
                        </button>
                      )}
                      {invoice.status === "PAID" && (
                        <span className="text-sm text-gray-500">
                          Paid {invoice.paidAt && formatDate(invoice.paidAt)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


