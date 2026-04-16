"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import { UserRole, UserPermission } from "@/types";
import { usersApi, warehousesApi } from "@/lib/api";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: any; // User to edit (if provided, modal is in edit mode)
}

const roleLabels: Record<UserRole, string> = {
  [UserRole.CONSUMER]: "მომხმარებელი",
  [UserRole.OPERATIONS]: "ოპერაციები",
  [UserRole.DELIVERY]: "მიტანა",
  [UserRole.ADMIN]: "ადმინისტრატორი",
};

const permissionLabels: Record<UserPermission, string> = {
  [UserPermission.VIEW_PRODUCTS]: "პროდუქტების ნახვა",
  [UserPermission.CREATE_PRODUCTS]: "პროდუქტების შექმნა",
  [UserPermission.EDIT_PRODUCTS]: "პროდუქტების რედაქტირება",
  [UserPermission.DELETE_PRODUCTS]: "პროდუქტების წაშლა",
  [UserPermission.VIEW_INVENTORY]: "მარაგის ნახვა",
  [UserPermission.MANAGE_INVENTORY]: "მარაგის მენეჯმენტი",
  [UserPermission.RECEIVE_INVENTORY]: "მარაგის მიღება",
  [UserPermission.DISPATCH_INVENTORY]: "მარაგის გაცემა",
  [UserPermission.VIEW_WAREHOUSES]: "საწყობების ნახვა",
  [UserPermission.MANAGE_WAREHOUSES]: "საწყობების მენეჯმენტი",
  [UserPermission.VIEW_USERS]: "მომხმარებლების ნახვა",
  [UserPermission.CREATE_USERS]: "მომხმარებლების შექმნა",
  [UserPermission.EDIT_USERS]: "მომხმარებლების რედაქტირება",
  [UserPermission.DELETE_USERS]: "მომხმარებლების წაშლა",
  [UserPermission.VIEW_ORDERS]: "შეკვეთების ნახვა",
  [UserPermission.MANAGE_ORDERS]: "შეკვეთების მენეჯმენტი",
  [UserPermission.VIEW_REPORTS]: "რეპორტების ნახვა",
  [UserPermission.ADMIN_ACCESS]: "ადმინისტრატორის წვდომა",
};

export default function CreateUserModal({
  isOpen,
  onClose,
  onSuccess,
  user,
}: CreateUserModalProps) {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const isEditMode = !!user;
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formData, setFormData] = useState({
    role: UserRole.CONSUMER,
    phoneNumber: "",
    email: "",
    fullName: "",
    warehouseId: "",
    status: "active" as "active" | "inactive" | "suspended",
    permissions: [] as UserPermission[],
  });

  useEffect(() => {
    if (isOpen) {
      // Load warehouses
      warehousesApi
        .getAll({ active: true })
        .then((response) => {
          const warehouses = response.data || [];
          setWarehouses(warehouses);
        })
        .catch((err) => {
          console.error("Failed to load warehouses:", err);
        });

      // Load user data if in edit mode
      if (user) {
        setFormData({
          role: user.role || UserRole.CONSUMER,
          phoneNumber: user.phoneNumber || "",
          email: user.email || "",
          fullName: user.fullName || "",
          warehouseId: user.warehouseId || (user.warehouse?.id || ""),
          status: user.status || "active",
          permissions: user.permissions || [],
        });
        setNewPassword("");
        setConfirmPassword("");
      } else {
        // Reset form for create mode
        setFormData({
          role: UserRole.CONSUMER,
          phoneNumber: "",
          email: "",
          fullName: "",
          warehouseId: "",
          status: "active",
          permissions: [],
        });
        setNewPassword("");
        setConfirmPassword("");
      }
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditMode && newPassword.trim()) {
        if (newPassword !== confirmPassword) {
          alert("პაროლები არ ემთხვევა.");
          setLoading(false);
          return;
        }
        if (newPassword.trim().length < 8) {
          alert("პაროლი მინიმუმ 8 სიმბოლო უნდა იყოს.");
          setLoading(false);
          return;
        }
      }

      const userData: any = {
        role: formData.role,
        phoneNumber: formData.phoneNumber,
        status: formData.status,
      };

      if (formData.email) {
        userData.email = formData.email;
      }

      if (formData.fullName) {
        userData.fullName = formData.fullName;
      }

      if (formData.warehouseId) {
        userData.warehouseId = formData.warehouseId;
      }

      if (formData.permissions.length > 0) {
        userData.permissions = formData.permissions;
      }

      if (isEditMode && newPassword.trim()) {
        userData.password = newPassword.trim();
      }

      if (isEditMode && user?.id) {
        await usersApi.update(user.id, userData);
      } else {
        await usersApi.create(userData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} user:`, error);
      alert(`შეცდომა მომხმარებლის ${isEditMode ? 'განახლებისას' : 'შექმნისას'}`);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permission: UserPermission) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const allPermissions = Object.values(UserPermission);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-2xl p-5 lg:p-10 max-h-[90vh] overflow-y-auto"
    >
      <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">
        {isEditMode ? "მომხმარებლის რედაქტირება" : "ახალი მომხმარებლის დამატება"}
      </h4>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Role */}
        <div>
          <Label>როლი *</Label>
          <select
            value={formData.role}
            onChange={(e) =>
              setFormData({ ...formData, role: e.target.value as UserRole })
            }
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            {Object.entries(roleLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Phone Number */}
        <div>
          <Label>ტელეფონი *</Label>
          <input
            type="tel"
            placeholder="+995555123456"
            value={formData.phoneNumber}
            onChange={(e) =>
              setFormData({ ...formData, phoneNumber: e.target.value })
            }
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Email */}
        <div>
          <Label>ელფოსტა</Label>
          <input
            type="email"
            placeholder="user@example.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Full Name */}
        <div>
          <Label>სრული სახელი</Label>
          <input
            type="text"
            placeholder="გიორგი ბერიძე"
            value={formData.fullName}
            onChange={(e) =>
              setFormData({ ...formData, fullName: e.target.value })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {isEditMode && (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-900/40">
            <p className="mb-3 text-sm font-medium text-gray-800 dark:text-white/90">
              პაროლის შეცვლა
            </p>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              დატოვეთ ცარიელი, თუ პაროლის განახლება არ გსურთ.
            </p>
            <div className="space-y-4">
              <div>
                <Label>ახალი პაროლი</Label>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="მინიმუმ 8 სიმბოლო"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <Label>გაიმეორეთ პაროლი</Label>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="გაიმეორეთ ახალი პაროლი"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Warehouse */}
        <div>
          <Label>საწყობი</Label>
          <select
            value={formData.warehouseId}
            onChange={(e) =>
              setFormData({ ...formData, warehouseId: e.target.value })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="">-- აირჩიეთ საწყობი --</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name} - {warehouse.city}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <Label>სტატუსი *</Label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as "active" | "inactive" | "suspended",
              })
            }
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="active">აქტიური</option>
            <option value="inactive">არააქტიური</option>
            <option value="suspended">დაბლოკილი</option>
          </select>
        </div>

        {/* Permissions */}
        <div>
          <Label>უფლებები</Label>
          <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-gray-300 bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
            <div className="space-y-2">
              {allPermissions.map((permission) => (
                <label
                  key={permission}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(permission)}
                    onChange={() => togglePermission(permission)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {permissionLabels[permission]}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            გაუქმება
          </Button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "იტვირთება..." : isEditMode ? "განახლება" : "დამატება"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
