import React, { useState, useEffect } from 'react';
import { X, Calculator, Save, Settings } from 'lucide-react';
import { useFinance, type TransactionType, type Transaction } from '../../context/FinanceContext';
import CategoryConfigModal from './CategoryConfigModal';
import { getTodayString } from '../../utils/dateUtils';

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactionToEdit?: Transaction | null;
}

// Hardcoded categories removed in favor of dynamic ones from Context

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, transactionToEdit }) => {
    const { addTransaction, updateTransaction, incomeCategories, expenseCategories, projects } = useFinance();

    const [isConfigOpen, setIsConfigOpen] = useState(false);

    const [type, setType] = useState<TransactionType>('income');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState(getTodayString());
    const [status, setStatus] = useState<'pending' | 'paid'>('paid');
    const [hasInvoice, setHasInvoice] = useState(false);
    const [projectId, setProjectId] = useState<string>('');

    // Initialize/Reset form
    useEffect(() => {
        if (isOpen) {
            if (transactionToEdit) {
                // Edit Mode
                setType(transactionToEdit.type);
                setDescription(transactionToEdit.description);
                setAmount(transactionToEdit.amount.toString());
                setCategory(transactionToEdit.category);
                setDate(transactionToEdit.date);
                // Map status, handle potential 'overdue' as 'pending' for simple editing unless explicitly paid
                setStatus(transactionToEdit.status === 'paid' ? 'paid' : 'pending');
                setHasInvoice(transactionToEdit.hasInvoice);
                setProjectId(transactionToEdit.projectId || '');
            } else {
                // Create Mode
                setDescription('');
                setAmount('');
                setCategory('');
                setDate(getTodayString());
                setStatus('paid');
                setHasInvoice(false);
                setType('income');
                setProjectId('');
            }
        }
    }, [isOpen, transactionToEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const taxAmount = hasInvoice ? Number(amount) * 0.10 : 0; // 10% tax rule
        const numericAmount = Number(amount);

        if (transactionToEdit) {
            // Update
            updateTransaction(transactionToEdit.id, {
                description,
                amount: numericAmount,
                type,
                category,
                date,
                status,
                hasInvoice,
                taxAmount,
                projectId: projectId || undefined
            });
        } else {
            // Create
            addTransaction({
                description,
                amount: numericAmount,
                type,
                category,
                date,
                status,
                hasInvoice,
                taxAmount,
                projectId: projectId || undefined
            });
        }

        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800">
                        {transactionToEdit ? 'Editar Transação' : 'Nova Transação'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Type Selection */}
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setType('income')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === 'income'
                                ? 'bg-white text-green-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Receita (+ Entrada)
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('expense')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === 'expense'
                                ? 'bg-white text-red-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Despesa (- Saída)
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                        <input
                            required
                            type="text"
                            className="w-full rounded-lg border-gray-200 border p-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                            placeholder="Ex: Instalação Cliente X"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                            <input
                                required
                                type="number"
                                step="0.01"
                                min="0"
                                className="w-full rounded-lg border-gray-200 border p-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                            <input
                                required
                                type="date"
                                className="w-full rounded-lg border-gray-200 border p-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-gray-700">Categoria (HVAC)</label>
                            <button
                                type="button"
                                onClick={() => setIsConfigOpen(true)}
                                className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                            >
                                <Settings size={12} />
                                Configurar
                            </button>
                        </div>
                        <select
                            required
                            className="w-full rounded-lg border-gray-200 border p-2.5 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            <option value="">Selecione...</option>
                            {(type === 'income' ? incomeCategories : expenseCategories).map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Projeto / Obra (Opcional)</label>
                        <select
                            className="w-full rounded-lg border-gray-200 border p-2.5 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                            value={projectId}
                            onChange={(e) => setProjectId(e.target.value)}
                        >
                            <option value="">Nenhum (Custo Fixo / Geral)</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="hasInvoice"
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                checked={hasInvoice}
                                onChange={(e) => setHasInvoice(e.target.checked)}
                            />
                            <label htmlFor="hasInvoice" className="text-sm text-gray-700">Com Nota Fiscal?</label>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isPaid"
                                className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                                checked={status === 'paid'}
                                onChange={(e) => setStatus(e.target.checked ? 'paid' : 'pending')}
                            />
                            <label htmlFor="isPaid" className="text-sm text-gray-700">Já foi pago?</label>
                        </div>
                    </div>

                    {hasInvoice && amount && (
                        <div className="bg-blue-50 p-3 rounded-lg flex items-center gap-3 text-blue-700 text-sm animated-in fade-in">
                            <Calculator size={18} />
                            <span>
                                Previsão de Impostos (DAS/ISS - 10%):
                                <strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(amount) * 0.10)}</strong>
                            </span>
                        </div>
                    )}

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${type === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                }`}
                        >
                            <Save size={18} />
                            {transactionToEdit ? 'Salvar Alterações' : 'Adicionar Lançamento'}
                        </button>
                    </div>
                </form>
            </div>

            <CategoryConfigModal
                isOpen={isConfigOpen}
                onClose={() => setIsConfigOpen(false)}
                type={type}
            />
        </div>
    );
};

export default TransactionModal;
