
import React, { type ReactNode, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

interface AppShellProps {
    children?: ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
            <Header onMenuClick={() => setIsSidebarOpen(true)} />
            <main className="pt-16 md:ml-64 min-h-screen">
                <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                    {children || <Outlet />}
                </div>
            </main>
        </div>
    );
};

export default AppShell;
