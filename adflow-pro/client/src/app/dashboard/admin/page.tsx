'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import Sidebar from '@/components/Sidebar';

export default function AdminDashboardPage() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(localStorage.getItem('role'));
  }, []);

  const normalizedRole = role ? role.toLowerCase() : '';

  return (
    <ProtectedRoute allowedRoles={['admin', 'Admin']}>
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar role={normalizedRole} />
        <div className="flex-1 p-8">
          <h1 className="text-3xl font-extrabold mb-8 text-gray-900 border-b pb-4">
            Admin Operations
          </h1>
          
          <AdminDashboard />
        </div>
      </div>
    </ProtectedRoute>
  );
}
