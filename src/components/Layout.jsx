import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';

export default function Layout() {
    return (
        <div className="min-h-screen bg-[#020617] flex flex-col">
            <Navigation />
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
                <Outlet />
            </main>
        </div>
    );
}
