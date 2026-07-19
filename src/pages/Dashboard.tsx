import { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useContracts } from '../context/ContractContext';
import { useCapitalGiro } from '../context/CapitalGiroContext';
import { useTeam } from '../context/TeamContext';
import { calculateDetailedEmployeeCost } from '../utils/financeUtils';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Activity, CalendarDays, Landmark } from 'lucide-react';
import HistoricalBI from '../components/finance/HistoricalBI';
import { CategoryAnalysis } from '../components/finance/CategoryAnalysis';

const Dashboard = () => {
    const {
        filteredTransactions,
        income,
        expenses,
        balance,
        selectedYear,
        setSelectedYear,
        fixedCosts
    } = useFinance();
    const { getMRR, getActiveContractsCount } = useContracts();
    const { accounts } = useCapitalGiro();
    const { employees } = useTeam();

    const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');

    // Enforce 2026 when in Operational View
    useEffect(() => {
        if (activeTab === 'current') {
            setSelectedYear('2026');
        }
    }, [activeTab, setSelectedYear]);

    // --- Working Capital Health Calculation ---
    const totalFixed = fixedCosts.reduce((acc, curr) => acc + curr.amount, 0);
    const totalTeamCost = employees.reduce((acc, emp) => acc + calculateDetailedEmployeeCost(emp).monthlyCash, 0);
    const monthlyFixedCost = totalFixed + totalTeamCost;
    const reserveBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
    const coverageMonths = monthlyFixedCost > 0 ? (reserveBalance / monthlyFixedCost) : 0;
    
    const getHealthColor = () => {
        if (coverageMonths > 3) return 'bg-green-500 text-white';
        if (coverageMonths >= 1) return 'bg-yellow-500 text-white';
        return 'bg-red-500 text-white';
    };

    // --- Contracts Data ---
    const mrr = getMRR();
    const activeContracts = getActiveContractsCount();

    // --- Prepare Data for Charts ---
    // Use filteredTransactions (Year Specific)

    // 1. Revenue Origin
    const incomeByCategory = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((acc, curr) => {
            acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
            return acc;
        }, {} as Record<string, number>);

    const revenueData = Object.keys(incomeByCategory).map(key => ({
        name: key,
        value: incomeByCategory[key]
    }));

    // 2. Expense Destination
    const expenseByCategory = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, curr) => {
            acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
            return acc;
        }, {} as Record<string, number>);

    const expenseData = Object.keys(expenseByCategory).map(key => ({
        name: key,
        value: expenseByCategory[key]
    }));

    // 3. Monthly Cash Flow
    const transactionsByMonth = filteredTransactions.reduce((acc, curr) => {
        if (!curr.date) return acc;
        const parts = curr.date.toString().split('-').map(Number);
        const m = parts[1];
        const monthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
        const month = monthNames[m - 1];

        if (!acc[month]) acc[month] = { name: month, receita: 0, despesa: 0, order: m };

        if (curr.type === 'income') acc[month].receita += curr.amount;
        else acc[month].despesa += curr.amount;

        return acc;
    }, {} as Record<string, any>);

    const cashFlowData = Object.values(transactionsByMonth).sort((a: any, b: any) => a.order - b.order);

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 pb-2">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Visão Geral</h2>
                    <p className="text-sm text-gray-500 mt-1">Acompanhe os principais indicadores do seu negócio em tempo real.</p>
                </div>

                <div className="bg-gray-100/80 p-1.5 rounded-xl flex gap-1 shadow-inner">
                    <button
                        onClick={() => setActiveTab('current')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'current'
                            ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                            }`}
                    >
                        Visão Atual (2026)
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'history'
                            ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                            }`}
                    >
                        Histórico (BI)
                    </button>
                </div>
            </div>

            {activeTab === 'current' ? (
                <div className="space-y-8">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            {/* Working Capital Health Indicator */}
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm text-sm font-medium transition-all ${getHealthColor()}`} title={`Cobertura atual: ${coverageMonths.toFixed(1)} meses`}>
                                <Landmark size={14} />
                                <span>Giro: {coverageMonths.toFixed(1)}m</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm text-sm font-medium text-blue-700 bg-blue-50/50">
                            <CalendarDays size={16} />
                            <span>Exercício 2026 – Operacional</span>
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 hover:shadow-lg transition-shadow duration-300 group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                    <Activity size={24} />
                                </div>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${balance >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {balance >= 0 ? '+ Lucro' : '- Prejuízo'}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Resultado Líquido</p>
                                <h3 className={`text-3xl font-bold mt-1 tracking-tight ${balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                                    {formatCurrency(balance)}
                                </h3>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 hover:shadow-lg transition-shadow duration-300 group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                    <TrendingUp size={24} />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Receita Total</p>
                                <h3 className="text-3xl font-bold mt-1 tracking-tight text-gray-900">{formatCurrency(income)}</h3>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 hover:shadow-lg transition-shadow duration-300 group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-red-50 text-red-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                    <TrendingDown size={24} />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Despesas Totais</p>
                                <h3 className="text-3xl font-bold mt-1 tracking-tight text-gray-900">{formatCurrency(expenses)}</h3>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 hover:shadow-lg transition-shadow duration-300 group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                    <DollarSign size={24} />
                                </div>
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">
                                    {activeContracts} Ativos
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Receita Recorrente (MRR)</p>
                                <h3 className="text-3xl font-bold mt-1 tracking-tight text-gray-900">{formatCurrency(mrr)}</h3>
                            </div>
                        </div>
                    </div>

                    {/* Category Analysis */}
                    <CategoryAnalysis />

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Cash Flow Bar Chart */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2 overflow-x-auto">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-900">Fluxo de Caixa Mensal</h3>
                                <p className="text-sm text-gray-500">Comparativo de entradas e saídas no decorrer de {selectedYear}</p>
                            </div>
                            <div className="h-80 w-full min-w-[500px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={cashFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(value) => `R$ ${value / 1000}k`} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value) => formatCurrency(Number(value))}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        <Bar dataKey="receita" name="Receitas" fill="#10B981" radius={[6, 6, 0, 0]} barSize={32} />
                                        <Bar dataKey="despesa" name="Despesas" fill="#EF4444" radius={[6, 6, 0, 0]} barSize={32} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Revenue Donut */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-x-auto">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Origem das Receitas</h3>
                            <div className="h-64 w-full flex-1">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={revenueData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {revenueData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Expense Donut */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-x-auto">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Destino das Despesas</h3>
                            <div className="h-64 w-full flex-1">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={expenseData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {expenseData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <HistoricalBI />
            )}
        </div>
    );
};

export default Dashboard;
