"use client";

import { useState, useEffect } from "react";
import {
  PersonIcon,
  PlusIcon,
  EnvelopeClosedIcon,
  Cross2Icon,
  CheckCircledIcon,
  ClockIcon,
  CrossCircledIcon,
  ReloadIcon,
  CopyIcon,
} from "@radix-ui/react-icons";
import { useProperties } from "@/app/hooks/use-properties";
import { useCreateInvitation } from "@/app/hooks/use-invitations";

export default function TenantsPage() {
  const { data: properties = [], isLoading: propertiesLoading } = useProperties();
  const createInvitation = useCreateInvitation();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const [inviteForm, setInviteForm] = useState({
    email: "",
    propertyId: "",
  });

  // 获取用户信息
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (data?.user) {
          setUserRole(data.user.role);
          setUserId(data.user.id);
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };
    fetchUser();
  }, []);

  // 发送邀请
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setInviteUrl(null);

    if (!inviteForm.email || !inviteForm.propertyId) {
      setError("Please fill in all fields");
      return;
    }

    if (!userId) {
      setError("User not authenticated");
      return;
    }

    try {
      const result = await createInvitation.mutateAsync({
        email: inviteForm.email,
        agentId: userId,
        propertyId: inviteForm.propertyId,
      });

      setSuccessMessage(`Invitation sent to ${inviteForm.email}!`);
      setInviteUrl(result.inviteUrl);
      setInviteForm({ email: "", propertyId: "" });
      
      // 3秒后关闭 modal
      setTimeout(() => {
        setShowInviteModal(false);
        setSuccessMessage(null);
        setInviteUrl(null);
      }, 5000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send invitation";
      setError(errorMessage);
    }
  };

  // 复制邀请链接
  const copyInviteUrl = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      alert("Invite link copied to clipboard!");
    }
  };

  // 获取已租用的房产（有租户的）
  const rentedProperties = properties.filter((p) => p.tenant);
  // 获取空置的房产（没有租户的）
  const vacantProperties = properties.filter((p) => !p.tenant);

  if (userRole !== "AGENT") {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Only agents can access this page</p>
      </div>
    );
  }

  if (propertiesLoading) {
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
          <h1 className="text-3xl font-bold text-gray-800">Tenants</h1>
          <p className="text-gray-500 mt-1">Manage your tenants and send invitations</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
        >
          <EnvelopeClosedIcon className="w-5 h-5" />
          Invite Tenant
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <PersonIcon className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Active Tenants</p>
              <p className="text-2xl font-bold text-gray-800">{rentedProperties.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <PersonIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Vacant Properties</p>
              <p className="text-2xl font-bold text-gray-800">{vacantProperties.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <PersonIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Properties</p>
              <p className="text-2xl font-bold text-gray-800">{properties.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tenants List */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Current Tenants</h2>
        </div>

        {rentedProperties.length === 0 ? (
          <div className="p-12 text-center">
            <PersonIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No tenants yet</h3>
            <p className="text-gray-500 mb-6">Invite tenants to your properties</p>
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
            >
              <EnvelopeClosedIcon className="w-5 h-5" />
              Send Invitation
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {rentedProperties.map((property) => (
              <div key={property.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <PersonIcon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{property.tenant?.name}</h3>
                      <p className="text-sm text-gray-500">{property.tenant?.email}</p>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Property:</span> {property.title}
                        </p>
                        <p className="text-sm text-gray-600">{property.address}</p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Rent:</span> ${property.rent}/month
                        </p>
                      </div>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">Invite Tenant</h2>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setError(null);
                  setSuccessMessage(null);
                  setInviteUrl(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Cross2Icon className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSendInvite} className="p-6 space-y-4">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                    <CheckCircledIcon className="w-5 h-5" />
                    {successMessage}
                  </div>
                  {inviteUrl && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">Invitation Link:</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={inviteUrl}
                          readOnly
                          className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                        />
                        <button
                          type="button"
                          onClick={copyInviteUrl}
                          className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                        >
                          <CopyIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tenant Email
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="tenant@example.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property
                </label>
                <select
                  value={inviteForm.propertyId}
                  onChange={(e) => setInviteForm({ ...inviteForm, propertyId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  required
                >
                  <option value="">Select a property</option>
                  {vacantProperties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.title} - {property.address}
                    </option>
                  ))}
                </select>
                {vacantProperties.length === 0 && (
                  <p className="mt-2 text-sm text-amber-600">
                    All properties are currently rented. Add a new property first.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setError(null);
                    setSuccessMessage(null);
                    setInviteUrl(null);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createInvitation.isPending || vacantProperties.length === 0}
                  className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {createInvitation.isPending ? (
                    <>
                      <ReloadIcon className="animate-spin w-5 h-5" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <EnvelopeClosedIcon className="w-5 h-5" />
                      Send Invitation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
