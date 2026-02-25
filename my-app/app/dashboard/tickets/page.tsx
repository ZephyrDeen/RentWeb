"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChatBubbleIcon,
  PlusIcon,
  ReloadIcon,
  Cross2Icon,
  CheckIcon,
  ExclamationTriangleIcon,
  TimerIcon,
  RocketIcon,
  CheckCircledIcon,
  CrossCircledIcon,
} from "@radix-ui/react-icons";
import {
  useTickets,
  useCreateTicket,
  useUpdateTicketStatus,
  useTicketReplies,
  useCreateReply,
} from "@/app/hooks/use-tickets";

interface Ticket {
  id: string;
  title: string;
  description: string;
  isUrgent: boolean;
  status: "OPEN" | "IN_PROGRESS" | "DONE" | "CLOSED";
  createdAt: string;
  property: {
    id: string;
    title: string;
    address: string;
  };
}

interface TicketReply {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
}

export default function TicketsPage() {
  const router = useRouter();

  // ✅ 使用 React Query hooks
  const { data: tickets = [], isLoading, error: queryError, refetch } = useTickets();
  const createTicketMutation = useCreateTicket();
  const updateStatusMutation = useUpdateTicketStatus();

  const [userRole, setUserRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modal state for creating ticket (Tenant)
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    isUrgent: false,
  });

  // Ticket details modal with replies
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyContent, setReplyContent] = useState("");

  // ✅ React Query for replies
  const { data: replies = [], isLoading: repliesLoading } = useTicketReplies(selectedTicket?.id || "");
  const createReplyMutation = useCreateReply(selectedTicket?.id || "");

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

  // Handle React Query errors
  useEffect(() => {
    if (queryError) {
      setError(queryError.message || "Failed to load tickets");
    }
  }, [queryError]);

  // ✅ Create ticket using React Query mutation
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await createTicketMutation.mutateAsync(formData);
      setShowAddModal(false);
      setFormData({ title: "", description: "", isUrgent: false });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create ticket";
      setError(errorMessage);
    }
  };

  // ✅ Open ticket details modal (replies auto-fetched by React Query)
  const handleViewDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowDetailsModal(true);
  };

  // ✅ Post a reply using React Query mutation
  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyContent.trim()) return;

    try {
      await createReplyMutation.mutateAsync(replyContent);
      setReplyContent("");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to post reply";
      setError(errorMessage);
    }
  };

  // ✅ Update ticket status using React Query mutation
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: newStatus });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update ticket";
      setError(errorMessage);
    }
  };

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    OPEN: { bg: "bg-blue-100", text: "text-blue-700", label: "Open" },
    IN_PROGRESS: { bg: "bg-amber-100", text: "text-amber-700", label: "In Progress" },
    DONE: { bg: "bg-green-100", text: "text-green-700", label: "Done" },
    CLOSED: { bg: "bg-gray-100", text: "text-gray-700", label: "Closed" },
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
            {userRole === "AGENT" ? "Maintenance Tickets" : "My Tickets"}
          </h1>
          <p className="text-gray-500 mt-1">
            {userRole === "AGENT"
              ? "Manage maintenance requests from tenants"
              : "Submit and track maintenance requests"}
          </p>
        </div>
        {userRole === "TENANT" && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            New Ticket
          </button>
        )}
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <TimerIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-500 text-xs">Open</p>
              <p className="text-xl font-bold text-gray-800">
                {tickets.filter((t) => t.status === "OPEN").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <RocketIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-gray-500 text-xs">In Progress</p>
              <p className="text-xl font-bold text-gray-800">
                {tickets.filter((t) => t.status === "IN_PROGRESS").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircledIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-gray-500 text-xs">Done</p>
              <p className="text-xl font-bold text-gray-800">
                {tickets.filter((t) => t.status === "DONE").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <CrossCircledIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-gray-500 text-xs">Closed</p>
              <p className="text-xl font-bold text-gray-800">
                {tickets.filter((t) => t.status === "CLOSED").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
          {error}
        </div>
      )}

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <ChatBubbleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No tickets yet</h2>
          <p className="text-gray-500 mb-6">
            {userRole === "TENANT"
              ? "Submit a ticket when you need maintenance help"
              : "No maintenance requests from tenants"}
          </p>
          {userRole === "TENANT" && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Submit Ticket
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => {
            const status = statusColors[ticket.status];
            return (
              <div
                key={ticket.id}
                className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  {/* Ticket Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {ticket.isUrgent && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                          <ExclamationTriangleIcon className="w-3 h-3" />
                          Urgent
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">{ticket.title}</h3>
                    <p className="text-gray-500 text-sm mb-3">{ticket.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>{ticket.property.title}</span>
                      <span>•</span>
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                    <button
                      onClick={() => handleViewDetails(ticket)}
                      className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      View Details & Replies →
                    </button>
                  </div>

                  {/* Agent Actions */}
                  {userRole === "AGENT" && ticket.status !== "CLOSED" && (
                    <div className="flex gap-2 ml-4">
                      {ticket.status === "OPEN" && (
                        <button
                          onClick={() => handleUpdateStatus(ticket.id, "IN_PROGRESS")}
                          className="px-3 py-2 text-sm bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition-colors"
                        >
                          Start
                        </button>
                      )}
                      {ticket.status === "IN_PROGRESS" && (
                        <button
                          onClick={() => handleUpdateStatus(ticket.id, "DONE")}
                          className="flex items-center gap-1 px-3 py-2 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors"
                        >
                          <CheckIcon className="w-4 h-4" />
                          Done
                        </button>
                      )}
                      {ticket.status === "DONE" && (
                        <button
                          onClick={() => handleUpdateStatus(ticket.id, "CLOSED")}
                          className="px-3 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          Close
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Ticket Modal (Tenant) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">New Ticket</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Cross2Icon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-gray-900 placeholder:text-gray-400"
                  placeholder="e.g. Leaky faucet in bathroom"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none text-gray-900 placeholder:text-gray-400"
                  placeholder="Describe the issue in detail..."
                />
              </div>

              {/* Urgent */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isUrgent"
                  checked={formData.isUrgent}
                  onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500"
                />
                <label htmlFor="isUrgent" className="flex items-center gap-2 text-sm text-gray-700">
                  <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                  Mark as urgent
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTicketMutation.isPending}
                  className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {createTicketMutation.isPending ? (
                    <>
                      <ReloadIcon className="animate-spin w-5 h-5" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-5 h-5" />
                      Submit Ticket
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Details Modal with Replies */}
      {showDetailsModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{selectedTicket.title}</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedTicket.property.title}</p>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedTicket(null);
                  setReplyContent("");
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Cross2Icon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Original Ticket */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  {selectedTicket.isUrgent && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                      <ExclamationTriangleIcon className="w-3 h-3" />
                      Urgent
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(selectedTicket.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-700">{selectedTicket.description}</p>
              </div>

              {/* Replies Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Replies ({replies.length})
                </h3>

                {repliesLoading ? (
                  <div className="flex justify-center py-8">
                    <ReloadIcon className="w-6 h-6 animate-spin text-emerald-500" />
                  </div>
                ) : replies.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ChatBubbleIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No replies yet. Be the first to reply!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {replies.map((reply) => (
                      <div
                        key={reply.id}
                        className={`rounded-xl p-4 ${reply.user.role === "AGENT"
                          ? "bg-blue-50 border border-blue-100"
                          : "bg-green-50 border border-green-100"
                          }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${reply.user.role === "AGENT"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                            }`}>
                            {reply.user.role === "AGENT" ? "Agent" : "Tenant"}
                          </span>
                          <span className="text-sm font-medium text-gray-700">
                            {reply.user.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(reply.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Reply Form - Fixed at bottom */}
            {selectedTicket.status !== "CLOSED" && (
              <div className="border-t border-gray-100 p-6 bg-gray-50">
                <form onSubmit={handlePostReply} className="space-y-3">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Type your reply..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none text-gray-900 placeholder:text-gray-400"
                    disabled={createReplyMutation.isPending}
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={createReplyMutation.isPending || !replyContent.trim()}
                      className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      {createReplyMutation.isPending ? (
                        <>
                          <ReloadIcon className="animate-spin w-4 h-4" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <ChatBubbleIcon className="w-4 h-4" />
                          Post Reply
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {selectedTicket.status === "CLOSED" && (
              <div className="border-t border-gray-100 p-6 bg-gray-50 text-center text-gray-500">
                This ticket is closed. No more replies can be added.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

