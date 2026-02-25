"use client";

import { useEffect, useState } from "react";
import {
  CalendarIcon,
  CheckCircledIcon,
  Cross2Icon,
  CrossCircledIcon,
  PlusIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import { useInspections, useCreateInspection, useUpdateInspection } from "@/app/hooks/use-inspections";
import { useProperties } from "@/app/hooks/use-properties";

interface Inspection {
  id: string;
  propertyId: string;
  tenantId: string;
  scheduledDate: string | null;
  availableDates: string[];
  status: "PENDING_SCHEDULE" | "SCHEDULED" | "COMPLETED" | "CANCELLED";
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
  property: {
    id: string;
    title: string;
    address: string;
  };
  tenant?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
}

interface Property {
  id: string;
  title: string;
  address: string;
  tenantId: string | null;
  tenant: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export default function InspectionsPage() {
  // ✅ 使用 React Query
  const { data: inspections = [], isLoading: inspectionsLoading } = useInspections();
  const { data: properties = [], isLoading: propertiesLoading } = useProperties();
  const createInspection = useCreateInspection();
  const updateInspection = useUpdateInspection();
  
  // UI state
  const loading = inspectionsLoading || propertiesLoading;
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // 创建查房表单
  const [createForm, setCreateForm] = useState({
    propertyId: "",
    availableDates: ["", "", ""],
    notes: "",
  });

  // 租户选择时间
  const [selectedDate, setSelectedDate] = useState<string>("");

  // 获取用户角色
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (data?.user?.role) {
          setUserRole(data.user.role);
        }
      } catch (err) {
        console.error("Failed to fetch user role:", err);
      }
    };
    fetchUserRole();
  }, []);

  // ✅ 数据由 React Query 自动获取，不需要手动 fetch 函数

  // 中介：创建查房
  const handleCreateInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading("create");
    setError(null);

    try {
      // 过滤掉空日期
      const validDates = createForm.availableDates.filter((date) => date.trim() !== "");

      if (validDates.length === 0) {
        throw new Error("Please provide at least one available date");
      }

      const res = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: createForm.propertyId,
          availableDates: validDates,
          notes: createForm.notes || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      // ✅ React Query 自动刷新列表
      setShowCreateModal(false);
      setCreateForm({ propertyId: "", availableDates: ["", "", ""], notes: "" });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create inspection";
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  // 租户：选择查房时间
  const handleScheduleInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInspection) return;

    setActionLoading("schedule");
    setError(null);

    try {
      const res = await fetch(`/api/inspections/${selectedInspection.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "schedule",
          selectedDate,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      // ✅ React Query 自动刷新列表
      setShowScheduleModal(false);
      setSelectedInspection(null);
      setSelectedDate("");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to schedule inspection";
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  // 中介：标记完成
  const handleCompleteInspection = async (inspectionId: string) => {
    setActionLoading(inspectionId);
    setError(null);

    try {
      const res = await fetch(`/api/inspections/${inspectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      // ✅ React Query 自动刷新
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to complete inspection";
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  // 取消查房
  const handleCancelInspection = async (inspectionId: string) => {
    if (!confirm("Are you sure you want to cancel this inspection?")) return;

    setActionLoading(inspectionId);
    setError(null);

    try {
      const res = await fetch(`/api/inspections/${inspectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      // ✅ React Query 自动刷新
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to cancel inspection";
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING_SCHEDULE: "bg-yellow-100 text-yellow-800",
      SCHEDULED: "bg-blue-100 text-blue-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-gray-100 text-gray-800",
    };

    const labels = {
      PENDING_SCHEDULE: "Pending Schedule",
      SCHEDULED: "Scheduled",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ReloadIcon className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Inspections</h1>
          <p className="text-gray-600 mt-1">Manage property inspections</p>
        </div>

        {userRole === "AGENT" && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Schedule Inspection
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CrossCircledIcon className="w-5 h-5" />
            {error}
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <Cross2Icon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Inspections List */}
      {inspections.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <CalendarIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No inspections yet</h3>
          <p className="text-gray-500">
            {userRole === "AGENT"
              ? "Schedule an inspection to get started"
              : "Wait for your agent to schedule an inspection"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {inspections.map((inspection) => (
            <div
              key={inspection.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    {inspection.property.title}
                  </h3>
                  <p className="text-sm text-gray-600">{inspection.property.address}</p>
                  {inspection.tenant && userRole === "AGENT" && (
                    <p className="text-sm text-gray-600 mt-1">
                      Tenant: {inspection.tenant.name} ({inspection.tenant.email})
                    </p>
                  )}
                </div>
                {getStatusBadge(inspection.status)}
              </div>

              {/* Dates */}
              <div className="mb-4">
                {inspection.status === "PENDING_SCHEDULE" && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Available Dates:</p>
                    <div className="flex flex-wrap gap-2">
                      {inspection.availableDates.map((date, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm"
                        >
                          {new Date(date).toLocaleDateString("en-AU", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {inspection.scheduledDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CalendarIcon className="w-4 h-4" />
                    <span className="font-medium">Scheduled:</span>
                    <span>
                      {new Date(inspection.scheduledDate).toLocaleDateString("en-AU", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}

                {inspection.completedAt && (
                  <div className="flex items-center gap-2 text-sm text-green-700 mt-2">
                    <CheckCircledIcon className="w-4 h-4" />
                    <span>
                      Completed on{" "}
                      {new Date(inspection.completedAt).toLocaleDateString("en-AU")}
                    </span>
                  </div>
                )}
              </div>

              {/* Notes */}
              {inspection.notes && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{inspection.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {/* Tenant: Schedule */}
                {userRole === "TENANT" && inspection.status === "PENDING_SCHEDULE" && (
                  <button
                    onClick={() => {
                      setSelectedInspection(inspection);
                      setShowScheduleModal(true);
                    }}
                    disabled={actionLoading === inspection.id}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
                  >
                    {actionLoading === inspection.id ? "Loading..." : "Choose Date"}
                  </button>
                )}

                {/* Agent: Mark Complete */}
                {userRole === "AGENT" && inspection.status === "SCHEDULED" && (
                  <button
                    onClick={() => handleCompleteInspection(inspection.id)}
                    disabled={actionLoading === inspection.id}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-green-300 transition-colors"
                  >
                    {actionLoading === inspection.id ? "Loading..." : "Mark Complete"}
                  </button>
                )}

                {/* Cancel */}
                {inspection.status !== "COMPLETED" && inspection.status !== "CANCELLED" && (
                  <button
                    onClick={() => handleCancelInspection(inspection.id)}
                    disabled={actionLoading === inspection.id}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Inspection Modal (Agent) */}
      {showCreateModal && userRole === "AGENT" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Schedule Inspection</h2>

            <form onSubmit={handleCreateInspection}>
              {/* Property Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property *
                </label>
                <select
                  required
                  value={createForm.propertyId}
                  onChange={(e) => setCreateForm({ ...createForm, propertyId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-gray-900"
                >
                  <option value="">Select a property</option>
                  {properties
                    .filter((p) => p.tenantId) // Only show properties with tenants
                    .map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.title} - {property.address}
                        {property.tenant && ` (${property.tenant.name})`}
                      </option>
                    ))}
                </select>
              </div>

              {/* Available Dates */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Dates * (at least one)
                </label>
                {createForm.availableDates.map((date, idx) => (
                  <input
                    key={idx}
                    type="datetime-local"
                    value={date}
                    onChange={(e) => {
                      const newDates = [...createForm.availableDates];
                      newDates[idx] = e.target.value;
                      setCreateForm({ ...createForm, availableDates: newDates });
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-gray-900 mb-2"
                  />
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setCreateForm({
                      ...createForm,
                      availableDates: [...createForm.availableDates, ""],
                    })
                  }
                  className="text-sm text-emerald-600 hover:text-emerald-700"
                >
                  + Add another date
                </button>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  rows={3}
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none text-gray-900"
                  placeholder="Any additional information for the tenant..."
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={actionLoading === "create"}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:bg-emerald-300 font-medium transition-colors"
                >
                  {actionLoading === "create" ? "Creating..." : "Create Inspection"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateForm({ propertyId: "", availableDates: ["", "", ""], notes: "" });
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Modal (Tenant) */}
      {showScheduleModal && selectedInspection && userRole === "TENANT" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Choose Inspection Date</h2>

            <form onSubmit={handleScheduleInspection}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select a date *
                </label>
                <select
                  required
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-gray-900"
                >
                  <option value="">Select a date</option>
                  {selectedInspection.availableDates.map((date, idx) => (
                    <option key={idx} value={date}>
                      {new Date(date).toLocaleDateString("en-AU", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={actionLoading === "schedule"}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:bg-emerald-300 font-medium transition-colors"
                >
                  {actionLoading === "schedule" ? "Confirming..." : "Confirm"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowScheduleModal(false);
                    setSelectedInspection(null);
                    setSelectedDate("");
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
