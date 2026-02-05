import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';

export default function Layout() {
    return (
        <div className="min-h-screen bg-[#020617] text-slate-200">
            <Navigation />
            
            {/* 
                Adjust layout for:
                Desktop: ml-64 (Sidebar width)
                Mobile: pb-24 (Bottom Nav height + spacing)
            */}
            <main className="md:ml-64 min-h-screen p-4 md:p-8 pb-24 md:pb-8 transition-all duration-300">
                <div className="max-w-7xl mx-auto w-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}