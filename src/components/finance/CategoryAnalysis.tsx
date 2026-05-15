import { useMemo, useState } from 'react';
import { useFinance, type TransactionType } from '../../context/FinanceContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import clsx from 'clsx';

const MONTHS = [
    { value: 'all', label: 'Todo o Ano' },
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
];

const COLORS = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#64748B',
    '#06B6D4', '#d946ef', '#84cc16', '#a855f7'
];

export const CategoryAnalysis = () => {
    const { filteredTransactions, incomeCategories, expenseCategories } = useFinance(); // filteredTransactions is already filtered by Year in Context

    // Local Filters
    const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
    const [monthFilter, setMonthFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    // --- Aggregation Logic ---

    // 1. Filter by Month & Type
    const relevantTransactions = useMemo(() => {
        return filteredTransactions.filter(t => {
            // Month Filter
            if (monthFilter !== 'all') {
                const tMonth = t.date.split('-')[1]; // 'YYYY-MM-DD' -> 'MM'
                if (tMonth !== monthFilter) return false;
            }
            // Type Filter
            if (typeFilter !== 'all') {
                if (t.type !== typeFilter) return false;
            }
            return true;
        });
    }, [filteredTransactions, monthFilter, typeFilter]);

    // 2. Compute Totals for the "Period" (Base for %)
    const totalPeriodAmount = useMemo(() => {
        return relevantTransactions.reduce((acc, t) => acc + t.amount, 0);
    }, [relevantTransactions]);

    // 3. Filter by Specific Category (for Card Display)
    const selectedCategoryStats = useMemo(() => {
        if (categoryFilter === 'all') return null;

        const filtered = relevantTransactions.filter(t => t.category === categoryFilter);
        const total = filtered.reduce((acc, t) => acc + t.amount, 0);
        const count = filtered.length;

        return {
            total,
            count,
            percentage: totalPeriodAmount > 0 ? (total / totalPeriodAmount) * 100 : 0
        };
    }, [relevantTransactions, categoryFilter, totalPeriodAmount]);

    // 4. Prepare Chart Data (Group by Category)
    const chartData = useMemo(() => {
        const grouped: Record<string, { name: string; value: number; type: TransactionType }> = {};

        relevantTransactions.forEach(t => {
            if (!grouped[t.category]) {
                grouped[t.category] = { name: t.category, value: 0, type: t.type };
            }
            grouped[t.category].value += t.amount;
        });

        // Convert to array and sort by value desc
        return Object.values(grouped).sort((a, b) => b.value - a.value);
    }, [relevantTransactions]);

    // --- Helpers ---
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const availableCategories = useMemo(() => {
        if (typeFilter === 'income') return incomeCategories;
        if (typeFilter === 'expense') return expenseCategories;
        return [...incomeCategories, ...expenseCategories];
    }, [typeFilter, incomeCategories, expenseCategories]);

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mt-8">
            <div className="flex items-center gap-2 mb-6">
                <PieChartIcon className="text-blue-600" size={24} />
                <h2 className="text-xl font-bold text-gray-800">Análise por Categoria</h2>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 sticky top-0 bg-white z-10 pb-2">
                {/* Type Filter */}
                <div className="flex flex-col">
                    <label className="text-xs font-semibold text-gray-500 mb-1 ml-1 uppercase">Tipo</label>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {(['all', 'income', 'expense'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => {
                                    setTypeFilter(t);
                                    setCategoryFilter('all'); // Reset category when type changes
                                }}
                                className={clsx(
                                    "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                                    typeFilter === t
                                        ? "bg-white text-gray-800 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                                )}
                            >
                                {t === 'all' ? 'Todos' : t === 'income' ? 'Receitas' : 'Despesas'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Month Filter */}
                <div className="flex flex-col">
                    <label className="text-xs font-semibold text-gray-500 mb-1 ml-1 uppercase">Mês</label>
                    <select
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-100"
                    >
                        {MONTHS.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                </div>

                {/* Category Picker */}
                <div className="flex flex-col">
                    <label className="text-xs font-semibold text-gray-500 mb-1 ml-1 uppercase">Categoria (Detalhes)</label>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-100"
                    >
                        <option value="all">-- Visão Geral --</option>
                        {availableCategories.sort().map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left: Summary / Details Card */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                    {/* Main Total Card */}
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                        <p className="text-sm font-medium text-blue-600 mb-1">
                            {categoryFilter !== 'all' ? `Total: ${categoryFilter}` : 'Total do Período'}
                        </p>
                        <h3 className="text-3xl font-bold text-gray-800">
                            {formatCurrency(categoryFilter !== 'all' && selectedCategoryStats ? selectedCategoryStats.total : totalPeriodAmount)}
                        </h3>
                        {categoryFilter !== 'all' && selectedCategoryStats && (
                            <div className="mt-4 pt-4 border-t border-blue-200 flex flex-col gap-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Representatividade:</span>
                                    <span className="font-bold text-blue-700">{selectedCategoryStats.percentage.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Qtd. Lançamentos:</span>
                                    <span className="font-bold text-gray-800">{selectedCategoryStats.count}</span>
                                </div>
                            </div>
                        )}
                        <p className="mt-4 text-xs text-blue-400">
                            {monthFilter !== 'all' ? `Referente a ${MONTHS.find(m => m.value === monthFilter)?.label}` : 'Referente a todo o ano selecionado'}
                        </p>
                    </div>

                    {/* Top Categories List (Mini) */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex-1 overflow-y-auto max-h-[300px]">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Ranking no Período</h4>
                        <div className="space-y-2">
                            {chartData.slice(0, 5).map((d, index) => (
                                <div key={d.name} className="flex justify-between items-center text-sm p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                                    onClick={() => setCategoryFilter(d.name)}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="text-gray-700 truncate max-w-[120px]" title={d.name}>{d.name}</span>
                                    </div>
                                    <span className="font-medium text-gray-900">{formatCurrency(d.value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Chart */}
                <div className="lg:col-span-2 h-[400px] bg-white rounded-xl border border-gray-50 relative">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {chartData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: any) => formatCurrency(Number(value) || 0)}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend
                                    layout="vertical"
                                    verticalAlign="middle"
                                    align="right"
                                    wrapperStyle={{ 
                                        fontSize: '12px', 
                                        paddingLeft: '20px',
                                        paddingRight: '10px',
                                        maxHeight: '350px',
                                        overflowY: 'auto'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            Sem dados para exibir neste período
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
