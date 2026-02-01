
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
// import { useAuth } from '../context/AuthContext'; // Unused
import { Plus, Trash2, ShieldAlert, Loader2 } from 'lucide-react';
// import CategoryConfigModal from '../components/finance/CategoryConfigModal'; // Unused
// Assuming we replace the simple placeholder with this full implementation

interface AllowedUser {
    email: string;
    created_at: string;
}

const Config = () => {
    // const { user } = useAuth(); // Unused
    const [allowedUsers, setAllowedUsers] = useState<AllowedUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newEmail, setNewEmail] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        fetchAllowedUsers();
    }, []);

    const fetchAllowedUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('allowed_users')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;
            setAllowedUsers(data || []);
        } catch (error) {
            console.error("Error fetching allowed users:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail) return;

        setIsAdding(true);
        try {
            const { error } = await supabase
                .from('allowed_users')
                .insert([{ email: newEmail }]);

            if (error) throw error;

            setNewEmail('');
            fetchAllowedUsers();
        } catch (error) {
            console.error("Error adding user:", error);
            alert("Erro ao adicionar usuário via API. Verifique permissões.");
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveUser = async (email: string) => {
        if (!confirm(`Remover acesso de ${email}?`)) return;

        try {
            const { error } = await supabase
                .from('allowed_users')
                .delete()
                .eq('email', email);

            if (error) throw error;
            fetchAllowedUsers();
        } catch (error) {
            console.error("Error removing user:", error);
            alert("Erro ao remover usuário.");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Configurações</h2>
                <p className="text-gray-500">Gerencie as configurações do sistema.</p>
            </div>

            {/* Access Control Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                        <ShieldAlert size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800">Controle de Acesso (Whitelist)</h3>
                        <p className="text-sm text-gray-500">Gerencie os e-mails permitidos para acessar o sistema.</p>
                    </div>
                </div>

                <div className="p-6">
                    {/* Add Form */}
                    <form onSubmit={handleAddUser} className="flex gap-3 mb-6">
                        <input
                            type="email"
                            placeholder="novo.usuario@email.com"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#442685] focus:border-transparent outline-none transition-all"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            required
                        />
                        <button
                            type="submit"
                            disabled={isAdding}
                            className="bg-[#442685] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#361e6b] transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isAdding ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                            Adicionar
                        </button>
                    </form>

                    {/* List */}
                    {isLoading ? (
                        <div className="text-center py-4 text-gray-400">Carregando permissões...</div>
                    ) : (
                        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                            {allowedUsers.length === 0 ? (
                                <div className="p-4 text-center text-gray-400">Nenhum usuário na lista (Sistema aberto?)</div>
                            ) : (
                                allowedUsers.map((u) => (
                                    <div key={u.email} className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 uppercase">
                                                {u.email.substring(0, 2)}
                                            </div>
                                            <span className="text-sm text-gray-700 font-medium">{u.email}</span>
                                        </div>
                                        {/* Protect current user from deleting themselves ideally, but standard CRUD for now */}
                                        <button
                                            onClick={() => handleRemoveUser(u.email)}
                                            className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                            title="Remover acesso"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Placeholder for other configs */}
            {/* <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4">Outras Configurações</h3>
                <p className="text-sm text-gray-500">Módulo de Categorias já está integrado no Financeiro.</p>
            </div> */}
        </div>
    );
};

export default Config;
