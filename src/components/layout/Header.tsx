
import React from 'react';
import { Bell, Search, Menu } from 'lucide-react';

interface HeaderProps {
    onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    return (
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/50 fixed top-0 right-0 left-0 md:left-64 z-10 px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all duration-300">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors scale-100 active:scale-95"
                >
                    <Menu size={24} />
                </button>
                {/* Optional: Breadcrumbs or dynamic page title could go here */}
                <h1 className="text-lg font-semibold text-gray-800 tracking-tight">Overview</h1>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
                <div className="hidden sm:flex items-center relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="h-10 pl-10 pr-4 rounded-full bg-gray-100/50 border border-transparent focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-500/10 w-64 text-sm transition-all outline-none placeholder:text-gray-400"
                    />
                </div>

                <div className="h-8 w-px bg-gray-200 mx-1 hidden sm:block"></div>

                <button className="relative p-2.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-full transition-all hover:scale-105 active:scale-95">
                    <Bell size={20} />
                    <span className="absolute top-2.5 right-2 a w-2 h-2 bg-red-500 rounded-full border border-white ring-2 ring-white"></span>
                </button>
            </div>
        </header>
    );
};

export default Header;
