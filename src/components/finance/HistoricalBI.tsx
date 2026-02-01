import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Upload, Trash2, AlertTriangle, TrendingUp, TrendingDown, DollarSign, Calendar, Lightbulb, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface MonthlyRecord {
    month: number;
    revenue: number;
    expense: number;
    result: number;
}

interface YearStructure {
    year: number;
    months: MonthlyRecord[];
    totalRevenue: number;
    totalExpense: number;
    totalResult: number;
}

// STORAGE PREFIX
// Removed legacy storage constants

const HistoricalBI = () => {
    // Current Data
    const [yearsAvailable, setYearsAvailable] = useState<number[]>([]);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear() - 1);
    const [currentData, setCurrentData] = useState<YearStructure | null>(null);
    const [prevYearData, setPrevYearData] = useState<YearStructure | null>(null);

    // Import State
    const [isImporting, setIsImporting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [csvInput, setCsvInput] = useState('');
    const [error, setError] = useState<string | null>(null);

    // 1. INITIAL LOAD
    useEffect(() => {
        fetchAvailableYears();
    }, []);

    // 2. LOAD DATA WHEN YEAR CHANGES
    useEffect(() => {
        setCurrentData(null); // Reset state explicitly
        loadYearData(selectedYear);
    }, [selectedYear]);

    const fetchAvailableYears = async () => {
        try {
            const { data, error } = await supabase
                .from('historical_data')
                .select('year');

            if (error) throw error;

            const foundYears = data?.map(d => d.year) || [];

            // Always ensure at least some years are in list for the selector
            const defaultYears = foundYears.length > 0 ? foundYears : [new Date().getFullYear()];
            const unique = Array.from(new Set(defaultYears)).sort((a, b) => b - a);

            setYearsAvailable(unique);

            // If selectedYear is not in list, switch to the most recent available
            if (!unique.includes(selectedYear) && unique.length > 0) {
                setSelectedYear(unique[0]);
            }
        } catch (err) {
            console.error('Error fetching years:', err);
            // Fallback
            setYearsAvailable([new Date().getFullYear()]);
        }
    };



    const loadYearData = async (year: number) => {
        setIsLoading(true);
        try {
            // Fetch Current Year
            const { data, error } = await supabase
                .from('historical_data')
                .select('*')
                .eq('year', year);

            if (error) throw error;

            if (data && data.length > 0) {
                // Map DB to App Structure
                const months: MonthlyRecord[] = data.map(item => ({
                    month: parseInt(item.month), // stored as text/string in DB
                    revenue: Number(item.income),
                    expense: Number(item.expense),
                    result: Number(item.income) - Number(item.expense)
                })).sort((a, b) => a.month - b.month);

                const totalRevenue = months.reduce((acc, m) => acc + m.revenue, 0);
                const totalExpense = months.reduce((acc, m) => acc + m.expense, 0);
                const totalResult = totalRevenue - totalExpense;

                setCurrentData({
                    year,
                    months,
                    totalRevenue,
                    totalExpense,
                    totalResult
                });
            } else {
                setCurrentData(null);
            }

            // Fetch Previous Year (for comparison)
            const { data: prevData, error: prevError } = await supabase
                .from('historical_data')
                .select('*')
                .eq('year', year - 1);

            if (!prevError && prevData && prevData.length > 0) {
                const prevMonths = prevData.map(item => ({
                    month: parseInt(item.month),
                    revenue: Number(item.income),
                    expense: Number(item.expense),
                    result: Number(item.income) - Number(item.expense)
                }));
                const prevTotalRev = prevMonths.reduce((sum, m) => sum + m.revenue, 0);
                const prevTotalExp = prevMonths.reduce((sum, m) => sum + m.expense, 0);

                setPrevYearData({
                    year: year - 1,
                    months: prevMonths,
                    totalRevenue: prevTotalRev,
                    totalExpense: prevTotalExp,
                    totalResult: prevTotalRev - prevTotalExp
                });
            } else {
                setPrevYearData(null);
            }

        } catch (err) {
            console.error('Error loading year data:', err);
            setCurrentData(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImportText = () => {
        setError(null);
        if (!csvInput.trim()) return;

        try {
            const lines = csvInput.trim().split('\n');
            const records: any[] = []; // Temporary raw records

            lines.forEach((line, index) => {
                if (!line.trim()) return;

                // Format: year,month,revenue,expense
                const parts = line.split(',');
                if (parts.length !== 4) {
                    throw new Error(`Linha ${index + 1}: Formato inválido (ano,mes,receita,despesa)`);
                }

                const year = parseInt(parts[0].trim());
                const month = parseInt(parts[1].trim());
                const revenue = parseFloat(parts[2].trim());
                const expense = parseFloat(parts[3].trim());

                if (isNaN(year) || isNaN(month) || isNaN(revenue) || isNaN(expense)) {
                    throw new Error(`Linha ${index + 1}: Valores devem ser números`);
                }

                records.push({ year, month, revenue, expense });
            });

            processImportData(records);
            setCsvInput('');
            setIsImporting(false);
            alert('Dados importados com sucesso!');

        } catch (err: any) {
            setError(err.message);
        }
    };

    const processImportData = async (records: any[]) => {
        setIsLoading(true);
        try {
            // Prepare payload for Upsert
            const payload = records.map(rec => ({
                year: rec.year,
                month: String(rec.month),
                income: rec.revenue,
                expense: rec.expense
            }));

            // Supabase Upsert
            const { error } = await supabase
                .from('historical_data')
                .upsert(payload, { onConflict: 'year,month' });

            if (error) throw error;

            // Refresh Logic
            await fetchAvailableYears();
            loadYearData(selectedYear); // Reload current view

        } catch (err) {
            console.error("Error saving data:", err);
            setError("Erro ao salvar dados no Supabase.");
        } finally {
            setIsLoading(false);
        }
    };

    const clearYearHistory = async () => {
        if (confirm(`Tem certeza que deseja apagar o histórico de ${selectedYear}?`)) {
            setIsLoading(true);
            try {
                const { error } = await supabase
                    .from('historical_data')
                    .delete()
                    .eq('year', selectedYear);

                if (error) throw error;

                fetchAvailableYears();
                loadYearData(selectedYear);
            } catch (err) {
                console.error("Error deleting:", err);
                alert("Erro ao excluir dados.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const getMonthName = (monthNum: number) => {
        const monthMap: { [key: number]: string } = {
            1: "Janeiro",
            2: "Fevereiro",
            3: "Março",
            4: "Abril",
            5: "Maio",
            6: "Junho",
            7: "Julho",
            8: "Agosto",
            9: "Setembro",
            10: "Outubro",
            11: "Novembro",
            12: "Dezembro"
        };
        return monthMap[monthNum] || 'Mês Inválido';
    };

    // --- Chart Data Preparation ---
    const chartData = Array.from({ length: 12 }, (_, i) => {
        const monthNum = i + 1;
        const record = currentData?.months.find(m => m.month === monthNum);
        return {
            name: getMonthName(monthNum),
            revenue: record?.revenue || 0,
            expense: record?.expense || 0,
            result: record?.result || 0
        };
    });

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);



    // Insights Logic
    const insights = (() => {
        if (!currentData || currentData.months.length === 0) return null;

        const best = currentData.months.reduce((prev, curr) => (prev.result > curr.result) ? prev : curr);
        const worst = currentData.months.reduce((prev, curr) => (prev.result < curr.result) ? prev : curr);
        // Removed strict negative check to ensure "Any Worst" is shown if no negative exists, per 'Always show Name + Value' rule.
        // However, user said "'Pior mês' = mês com MENOR saldo (mais negativo)".
        // If all are positive, the one closely to 0 is the "worst".

        // Comparison
        let comparison = null;
        if (prevYearData && prevYearData.totalResult !== 0) {
            const currentTotal = currentData.totalResult;
            const prevTotal = prevYearData.totalResult;
            const pct = ((currentTotal - prevTotal) / Math.abs(prevTotal)) * 100;
            comparison = { prevTotal, pct };
        }

        return { best, worst, comparison };
    })();

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Histórico Consolidado</h2>
                        <p className="text-xs text-gray-500">Dados importados (Somente Leitura)</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="bg-white border border-gray-200 text-gray-800 text-sm font-bold rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 shadow-sm min-w-[100px]"
                    >
                        {yearsAvailable.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => setIsImporting(!isImporting)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${isImporting
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                            }`}
                    >
                        <Upload size={16} />
                        {isImporting ? 'Fechar Importador' : 'Importar'}
                    </button>

                    {currentData && (
                        <button
                            onClick={clearYearHistory}
                            className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                            title="Limpar este ano"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Import Panel */}
            {isImporting && (
                <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-lg relative z-10 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-sm font-bold text-gray-800">Importar Dados via CSV</h3>
                        <div className="text-xs text-gray-500 text-right">
                            <p>O sistema identificará o ano automaticamente.</p>
                            <p>Dados existentes do mesmo mês serão atualizados.</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded text-xs text-slate-600 mb-3 border border-slate-200 font-mono">
                        <span className="font-bold text-slate-800">FORMATO:</span> ano,mes,receita,despesa<br />
                        <span className="font-bold text-slate-800">EXEMPLO:</span> 2024,1,75000.00,50000.00
                    </div>

                    <textarea
                        value={csvInput}
                        onChange={(e) => setCsvInput(e.target.value)}
                        placeholder="2024,1,90000,85000&#10;2024,2,92000,60000"
                        className="w-full h-32 p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                    />

                    {error && (
                        <div className="mt-2 text-red-600 text-sm flex items-center gap-2">
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleImportText}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors shadow-sm"
                        >
                            Processar e Salvar
                        </button>
                    </div>
                </div>
            )}

            {currentData ? (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <p className="text-sm text-gray-500 font-medium mb-1">Total Receita ({selectedYear})</p>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                    <TrendingUp size={20} />
                                </div>
                                <span className="text-2xl font-bold text-gray-800">{formatCurrency(currentData.totalRevenue)}</span>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <p className="text-sm text-gray-500 font-medium mb-1">Total Despesa ({selectedYear})</p>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                    <TrendingDown size={20} />
                                </div>
                                <span className="text-2xl font-bold text-gray-800">{formatCurrency(currentData.totalExpense)}</span>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <p className="text-sm text-gray-500 font-medium mb-1">Resultado Líquido</p>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${currentData.totalResult >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    <DollarSign size={20} />
                                </div>
                                <div>
                                    <span className={`text-2xl font-bold ${currentData.totalResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(currentData.totalResult)}
                                    </span>
                                </div>
                            </div>
                        </div>


                        {/* INSIGHTS CARD */}
                        <div key={`insights-${selectedYear}`} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10">
                                <Lightbulb size={64} className="text-yellow-500" />
                            </div>
                            <p className="text-sm text-gray-500 font-medium mb-3 flex items-center gap-2">
                                <Lightbulb size={16} className="text-yellow-500" /> Insights do Ano
                            </p>

                            {insights ? (
                                <div className="space-y-3">
                                    {/* Best Month */}
                                    <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                                        <span className="text-gray-600">Melhor:</span>
                                        <div className="text-right">
                                            <span className="font-bold text-gray-800 block">{getMonthName(insights.best.month)}</span>
                                            <span className="text-green-600 text-xs font-bold">
                                                {formatCurrency(insights.best.result)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Worst Month */}
                                    <div className="flex justify-between items-center text-sm pt-2">
                                        <span className="text-gray-600">Pior:</span>
                                        <div className="text-right">
                                            <span className="font-bold text-gray-800 block">{getMonthName(insights.worst.month)}</span>
                                            <span className="text-red-500 text-xs font-bold">
                                                {formatCurrency(insights.worst.result)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Year Comparison */}
                                    {insights.comparison && (
                                        <div className="pt-2 border-t border-gray-100 mt-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500">vs {selectedYear - 1}</span>
                                                <div className={`flex items-center text-sm font-bold ${insights.comparison.pct >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                                    {insights.comparison.pct >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                                                    {Math.abs(insights.comparison.pct).toFixed(1)}%
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-xs text-center text-gray-400 mt-8">Dados insuficientes</p>
                            )}
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">Evolução Mensal - {selectedYear}</h3>
                        <div className="h-80 w-full min-w-[600px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `R$ ${val / 1000}k`} />
                                    <Tooltip formatter={(value: number | undefined) => formatCurrency(value || 0)} />
                                    <Legend />
                                    <Bar dataKey="revenue" name="Receitas" fill="#10B981" radius={[4, 4, 0, 0]} barSize={30} />
                                    <Bar dataKey="expense" name="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-center">
                    {isLoading ? (
                        <Loader2 className="animate-spin text-indigo-500 mb-4" size={32} />
                    ) : (
                        <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                            <Upload size={32} className="text-gray-400" />
                        </div>
                    )}
                    <h3 className="text-lg font-bold text-gray-700">
                        {isLoading ? 'Carregando dados...' : `Nenhum dado para ${selectedYear}`}
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto mt-2">
                        Utilize o botão "Importar" acima para adicionar ou colar dados CSV para este ano.
                        O sistema reconhecerá automaticamente o ano no arquivo.
                    </p>
                </div>
            )}
        </div >
    );
};

export default HistoricalBI;
