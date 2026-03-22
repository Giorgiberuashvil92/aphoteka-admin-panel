"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { User } from "@/types";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { usersApi } from "@/lib/api";
import CreateUserModal from "@/components/users/CreateUserModal";

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await usersApi.getById(userId);
      // Backend might return User directly or { data: User }
      const userData = (response as any).data || response;
      setUser(userData);
      setIsModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "შეცდომა მონაცემების ჩატვირთვისას");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    router.push("/users");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="მომხმარებლის რედაქტირება" />
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">იტვირთება...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="მომხმარებლის რედაქტირება" />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => router.push("/users")}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              დაბრუნება
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="მომხმარებლის რედაქტირება" />
      
      <CreateUserModal
        isOpen={isModalOpen}
        onClose={() => router.push("/users")}
        onSuccess={handleSuccess}
        user={user}
      />
    </div>
  );
}
