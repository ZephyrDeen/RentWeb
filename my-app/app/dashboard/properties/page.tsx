"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  HomeIcon,
  PlusIcon,
  TrashIcon,
  PersonIcon,
  ReloadIcon,
  Cross2Icon,
} from "@radix-ui/react-icons";
import { useProperties, useCreateProperty, useDeleteProperty } from "@/app/hooks/use-properties";

interface Property {
  id: string;
  title: string;
  address: string;
  rent: number;
  tenant: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export default function PropertiesPage() {
  const router = useRouter();

  // ✅ 使用 React Query hooks
  const { data: properties = [], isLoading, error: queryError } = useProperties();
  const createPropertyMutation = useCreateProperty();
  const deletePropertyMutation = useDeleteProperty();

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    address: "",
    rent: "",
  });

  // ✅ Add property using React Query
  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await createPropertyMutation.mutateAsync({
        title: formData.title,
        address: formData.address,
        rent: parseFloat(formData.rent),
      });
      setShowAddModal(false);
      setFormData({ title: "", address: "", rent: "" });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add property";
      setError(errorMessage);
    }
  };

  // ✅ Delete property using React Query
  const handleDeleteProperty = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await deletePropertyMutation.mutateAsync(id);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete property";
      setError(errorMessage);
    }
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
          <h1 className="text-3xl font-bold text-gray-800">Properties</h1>
          <p className="text-gray-500 mt-1">Manage your rental properties</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Property
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
          {error}
        </div>
      )}

      {/* Properties Grid */}
      {properties.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <HomeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No properties yet</h2>
          <p className="text-gray-500 mb-6">Add your first property to get started</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Add Property
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div
              key={property.id}
              className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              {/* Property Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <HomeIcon className="w-6 h-6 text-emerald-600" />
                </div>
                <button
                  onClick={() => handleDeleteProperty(property.id, property.title)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete property"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Property Info */}
              <h3 className="text-lg font-semibold text-gray-800 mb-1">{property.title}</h3>
              <p className="text-gray-500 text-sm mb-4">{property.address}</p>

              {/* Rent */}
              <div className="flex items-center justify-between py-3 border-t border-gray-100">
                <span className="text-gray-500 text-sm">Monthly Rent</span>
                <span className="text-lg font-bold text-emerald-600">
                  ${Number(property.rent).toLocaleString()}
                </span>
              </div>

              {/* Tenant Status */}
              <div className="flex items-center justify-between py-3 border-t border-gray-100">
                <span className="text-gray-500 text-sm">Tenant</span>
                {property.tenant ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <PersonIcon className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-800">
                      {property.tenant.name}
                    </span>
                  </div>
                ) : (
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                    Vacant
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Property Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">Add Property</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Cross2Icon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddProperty} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. Sunset Apartment 101"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. 123 Main Street, City"
                />
              </div>

              {/* Rent */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Rent ($)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.rent}
                  onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. 1500"
                />
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
                  disabled={createPropertyMutation.isPending}
                  className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {createPropertyMutation.isPending ? (
                    <>
                      <ReloadIcon className="animate-spin w-5 h-5" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-5 h-5" />
                      Add Property
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

