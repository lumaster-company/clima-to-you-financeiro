import { useState } from 'react';
import { useFinance, type Transaction } from '../context/FinanceContext';
import FinanceSummary from '../components/finance/FinanceSummary';
import TaxPredictionCard from '../components/finance/TaxPredictionCard';
import TransactionModal from '../components/finance/TransactionModal';
import { Plus, Search, Filter, Edit2, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { formatDateBR, getTodayString } from '../utils/dateUtils';

const Lancamentos = () => {
    // renamed filteredTransactions from context to yearTransactions to avoid naming conflict with local filter
    const { filteredTransactions: yearTransactions, removeTransaction, updateTransaction } = useFinance();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    const displayedTransactions = yearTransactions
        .filter(t => filterType === 'all' || t.type === filterType)
        .filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => b.date.localeCompare(a.date));

    const toggleStatus = (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
        updateTransaction(id, { status: newStatus as any });
    };

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTransaction(null);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Lançamentos Financeiros</h2>
                    <p className="text-sm text-gray-500">Gerencie todas as entradas e saídas do caixa.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-secondary text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-secondary/90 transition-all font-medium shadow-lg hover:shadow-secondary/20"
                >
                    <Plus size={20} />
                    Nova Transação
                </button>
            </div>

            <TaxPredictionCard />
            <FinanceSummary />

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar por descrição ou categoria..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none text-sm transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 text-sm">
                            <Filter size={16} className="text-gray-400" />
                            <select
                                className="bg-transparent border-none focus:ring-0 p-0 text-sm outline-none cursor-pointer"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as any)}
                            >
                                <option value="all">Todas as Movimentações</option>
                                <option value="income">Apenas Receitas</option>
                                <option value="expense">Apenas Despesas</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4">Descrição</th>
                                <th className="px-6 py-4">Categoria</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Valor</th>
                                <th className="px-6 py-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {displayedTransactions.map((t) => (
                                <tr key={t.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 font-medium">
                                        {formatDateBR(t.date)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-800">{t.description}</span>
                                            {t.hasInvoice && (
                                                <span className="text-[10px] text-blue-600 bg-blue-50 w-fit px-1.5 py-0.5 rounded border border-blue-100 mt-1">
                                                    Com Nota ( Imposto: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.taxAmount || 0)} )
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                            {t.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => toggleStatus(t.id, t.status)}
                                            className={clsx(
                                                "px-2.5 py-1 rounded-full text-xs font-bold border transition-all shadow-sm hover:shadow",
                                                t.status === 'paid'
                                                    ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                                                    : t.status === 'overdue'
                                                        ? "bg-red-100 text-red-700 border-red-200 hover:bg-red-200"
                                                        : "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200"
                                            )}
                                        >
                                            {t.status === 'paid' ? 'Pago' : t.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                                        </button>
                                        {t.status !== 'paid' && t.date < getTodayString() && t.type === 'expense' && (
                                            <span className="block text-[10px] text-red-500 mt-1 font-bold animate-pulse">VENCIDO</span>
                                        )}
                                    </td>
                                    <td className={clsx("px-6 py-4 text-right font-bold tabular-nums text-base", t.type === 'income' ? 'text-green-600' : 'text-red-500')}>
                                        {t.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(t)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Tem certeza que deseja excluir esta transação?')) {
                                                        removeTransaction(t.id);
                                                    }
                                                }}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {displayedTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Search size={32} className="opacity-20" />
                                            <p>Nenhuma transação encontrada.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <TransactionModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                transactionToEdit={editingTransaction}
            />
        </div>
    );
};

export default Lancamentos;
