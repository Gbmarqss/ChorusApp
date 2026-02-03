import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false }) {
    const { user, loading } = useAuth();

    // Show loading spinner while checking auth
    if (loading) {
        return (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#020617]">
                <div className="text-center">
                    <div className="inline-block w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-white">Verificando autenticação...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Check admin requirement
    if (requireAdmin && user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return children ? children : <Outlet />;
}
