import { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Search, Briefcase, TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';

const GestaoProjetos = () => {
    const { projects, filteredTransactions } = useFinance();
    const [searchTerm, setSearchTerm] = useState('');

    const projectStats = useMemo(() => {
        return projects.map(project => {
            const projectTransactions = filteredTransactions.filter(t => t.projectId === project.id && t.status === 'paid');
            
            const totalEntradas = projectTransactions
                .filter(t => t.type === 'income')
                .reduce((acc, curr) => acc + curr.amount, 0);

            const totalSaidas = projectTransactions
                .filter(t => t.type === 'expense')
                .reduce((acc, curr) => acc + curr.amount, 0);

            const lucroLiquido = totalEntradas - totalSaidas;
            const margem = totalEntradas > 0 ? (lucroLiquido / totalEntradas) * 100 : 0;

            return {
                ...project,
                totalEntradas,
                totalSaidas,
                lucroLiquido,
                margem
            };
        }).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [projects, filteredTransactions, searchTerm]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-[#442685]">Gestão de Projetos</h2>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar projetos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#442685]/20 focus:border-[#442685] outline-none text-sm transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 p-4">
                    {projectStats.map((stats) => (
                        <div key={stats.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-[#442685]/10 text-[#442685] rounded-lg">
                                    <Briefcase size={24} />
                                </div>
                                <h3 className="font-bold text-gray-800 text-lg flex-1 truncate">{stats.name}</h3>
                                <div className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 ${
                                    stats.margem > 0 ? 'bg-green-100 text-green-700' : 
                                    stats.margem < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                    <Percent size={14} />
                                    {stats.margem.toFixed(2)}%
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-green-50/50 p-3 rounded-lg border border-green-100">
                                    <div className="flex items-center gap-1 text-green-600 mb-1">
                                        <TrendingUp size={16} />
                                        <span className="text-xs font-semibold uppercase tracking-wider">Entradas</span>
                                    </div>
                                    <div className="font-bold text-green-700 text-sm">
                                        {formatCurrency(stats.totalEntradas)}
                                    </div>
                                </div>

                                <div className="bg-red-50/50 p-3 rounded-lg border border-red-100">
                                    <div className="flex items-center gap-1 text-red-600 mb-1">
                                        <TrendingDown size={16} />
                                        <span className="text-xs font-semibold uppercase tracking-wider">Saídas</span>
                                    </div>
                                    <div className="font-bold text-red-700 text-sm">
                                        {formatCurrency(stats.totalSaidas)}
                                    </div>
                                </div>

                                <div className={`p-3 rounded-lg border ${
                                    stats.lucroLiquido > 0 ? 'bg-blue-50/50 border-blue-100' : 
                                    stats.lucroLiquido < 0 ? 'bg-orange-50/50 border-orange-100' : 'bg-gray-50/50 border-gray-100'
                                }`}>
                                    <div className={`flex items-center gap-1 mb-1 ${
                                        stats.lucroLiquido > 0 ? 'text-blue-600' : 
                                        stats.lucroLiquido < 0 ? 'text-orange-600' : 'text-gray-600'
                                    }`}>
                                        <DollarSign size={16} />
                                        <span className="text-xs font-semibold uppercase tracking-wider">Lucro Líquido</span>
                                    </div>
                                    <div className={`font-bold text-sm ${
                                        stats.lucroLiquido > 0 ? 'text-blue-700' : 
                                        stats.lucroLiquido < 0 ? 'text-orange-700' : 'text-gray-700'
                                    }`}>
                                        {formatCurrency(stats.lucroLiquido)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {projectStats.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-500">
                            Nenhum projeto encontrado.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GestaoProjetos;
