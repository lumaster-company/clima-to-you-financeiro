
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, Receipt, Users, FileText, Settings, PieChart, LogOut, X, Briefcase, BarChart2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const { user, signOut } = useAuth();
    const [logo, setLogo] = React.useState<string | null>(() => localStorage.getItem('app_logo'));
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setLogo(base64String);
                localStorage.setItem('app_logo', base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const navItems = [
        { icon: <LayoutDashboard size={18} />, label: 'Visão Geral', path: '/dashboard' },
        { icon: <Wallet size={18} />, label: 'Lançamentos', path: '/lancamentos' },
        { icon: <Receipt size={18} />, label: 'Custos Fixos', path: '/custos' },
        { icon: <Briefcase size={18} />, label: 'Obras', path: '/projetos' },
        { icon: <BarChart2 size={18} />, label: 'Gestão de Projetos', path: '/gestao-projetos' },
        { icon: <Users size={18} />, label: 'Equipe', path: '/equipe' },
        { icon: <FileText size={18} />, label: 'Contratos', path: '/contratos' },
        { icon: <Settings size={18} />, label: 'Configurações', path: '/config' },
    ];

    return (
        <>
            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={onClose}
                />
            )}

            <aside className={`
                w-64 bg-[#442685] border-r border-white/10 h-screen fixed left-0 top-0 flex flex-col z-30 shadow-xl transition-all duration-300 font-sans
                md:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Logo Area */}
                <div className="h-20 flex items-center justify-between px-6 border-b border-gray-200 bg-white relative">
                    <div
                        className="flex items-center gap-3 w-full cursor-pointer group"
                        onClick={() => fileInputRef.current?.click()}
                        title="Clique para alterar o logo"
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleLogoUpload}
                            className="hidden"
                            accept="image/*"
                        />
                        {logo ? (
                            <img src={logo} alt="Clima To You Logo" className="h-10 w-auto object-contain max-w-[40px] rounded-sm" />
                        ) : (
                            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors shrink-0">
                                <PieChart className="w-5 h-5 text-gray-400" />
                            </div>
                        )}
                        <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-[#442685] font-bold text-lg leading-tight tracking-tight truncate">Clima To You</span>
                            {!logo && <span className="text-[10px] text-gray-500 font-normal truncate">Clique p/ Logo</span>}
                        </div>
                    </div>

                    {/* Close Button for Mobile */}
                    <button
                        onClick={onClose}
                        className="md:hidden text-gray-400 hover:text-[#442685] transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto pt-4">
                    <div className="px-3 mb-2 text-xs font-semibold text-white/50 uppercase tracking-wider">Menu Principal</div>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => window.innerWidth < 768 && onClose()}
                            className={({ isActive }) => `
                                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                                ${isActive
                                    ? 'bg-[#DD3728] text-white shadow-lg font-bold'
                                    : 'text-white/70 hover:bg-white/10 hover:text-white'}
                            `}
                        >
                            {({ isActive }) => (
                                <>
                                    <span className={isActive ? 'text-white' : 'text-white/70 group-hover:text-white transition-colors'}>
                                        {item.icon}
                                    </span>
                                    {item.label}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-white/10 bg-[#442685]">
                    <button
                        onClick={signOut}
                        className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-white/5 transition-colors group"
                        title="Sair"
                    >
                        <div className="w-9 h-9 rounded-full bg-[#DD3728] flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-white/10 overflow-hidden shrink-0">
                            {user?.user_metadata?.avatar_url ? (
                                <img src={user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover" />
                            ) : (
                                user?.email?.substring(0, 2).toUpperCase() || 'US'
                            )}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-medium text-white group-hover:text-[#DD3728] transition-colors truncate">
                                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário'}
                            </p>
                            <p className="text-xs text-white/40 truncate">{user?.email}</p>
                        </div>
                        <LogOut size={16} className="text-white/40 group-hover:text-[#DD3728] transition-colors shrink-0" />
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
