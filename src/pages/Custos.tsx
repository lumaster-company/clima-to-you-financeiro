import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useTeam } from '../context/TeamContext';
import { calculateDetailedEmployeeCost } from '../utils/financeUtils';
import { Plus, Trash, Download, Pencil, Users } from 'lucide-react';

const Custos = () => {
    const { fixedCosts, addFixedCost, removeFixedCost, updateFixedCost, importDefaultFixedCosts } = useFinance();
    const { employees } = useTeam();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCostId, setEditingCostId] = useState<string | null>(null);

    // Form state
    const [newName, setNewName] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [dueDay, setDueDay] = useState('5');

    const handleOpenModal = (cost?: any) => {
        if (cost) {
            setEditingCostId(cost.id);
            setNewName(cost.name);
            setNewAmount(cost.amount.toString());
            setDueDay(cost.dueDay.toString());
        } else {
            setEditingCostId(null);
            setNewName('');
            setNewAmount('');
            setDueDay('5');
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newAmount) return;

        if (editingCostId) {
            updateFixedCost(editingCostId, {
                name: newName,
                amount: Number(newAmount),
                dueDay: Number(dueDay)
            });
        } else {
            addFixedCost({
                name: newName,
                amount: Number(newAmount),
                dueDay: Number(dueDay),
                isActive: true
            });
        }

        setEditingCostId(null);
        setNewName('');
        setNewAmount('');
        setIsModalOpen(false);
    };

    const totalFixed = fixedCosts.reduce((acc, curr) => acc + curr.amount, 0);
    const totalTeamCost = employees.reduce((acc, emp) => acc + calculateDetailedEmployeeCost(emp).monthlyCash, 0);
    const grandTotal = totalFixed + totalTeamCost;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Custos Fixos</h2>
                    <p className="text-gray-500">Gerencie suas despesas recorrentes mensais.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={importDefaultFixedCosts}
                        className="flex items-center gap-2 px-4 py-2 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-medium text-sm"
                    >
                        <Download size={18} />
                        Importar Padrão
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium text-sm"
                    >
                        <Plus size={18} />
                        Adicionar Novo
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Card */}
                <div className="md:col-span-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 rounded-xl shadow-md border border-white/5">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                        <div>
                            <p className="text-gray-400 font-medium text-sm uppercase tracking-wider">Custo Fixo Total (Estimado)</p>
                            <h3 className="text-3xl sm:text-4xl font-bold mt-1 text-white">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(grandTotal)}
                            </h3>
                            <p className="text-xs text-gray-500 mt-2">* Soma dos custos fixos + folha de equipe.</p>
                        </div>

                        <div className="flex flex-col gap-1 sm:text-right bg-white/5 p-3 rounded-lg border border-white/5 min-w-[200px]">
                            <div className="flex justify-between sm:justify-end items-center gap-3 text-sm">
                                <span className="text-gray-400">Fixos:</span>
                                <span className="font-semibold text-blue-200">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalFixed)}</span>
                            </div>
                            <div className="flex justify-between sm:justify-end items-center gap-3 text-sm">
                                <span className="text-gray-400 flex items-center gap-1">
                                    <Users size={14} /> Equipe:
                                </span>
                                <span className="font-semibold text-purple-200">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalTeamCost)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cost List */}
                <div className="md:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                            <tr>
                                <th className="px-6 py-4">Nome do Custo</th>
                                <th className="px-6 py-4">Dia Vencimento</th>
                                <th className="px-6 py-4 text-right">Valor Estimado</th>
                                <th className="px-6 py-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {fixedCosts.map((cost) => (
                                <tr key={cost.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{cost.name}</td>
                                    <td className="px-6 py-4">Dia {cost.dueDay}</td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-800">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cost.amount)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleOpenModal(cost)}
                                                className="text-blue-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Tem certeza que deseja excluir?')) {
                                                        removeFixedCost(cost.id);
                                                    }
                                                }}
                                                className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                                            >
                                                <Trash size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {fixedCosts.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                        Nenhum custo fixo cadastrado. Clique em "Importar Padrão" para começar.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800">
                                {editingCostId ? 'Editar Custo Fixo' : 'Novo Custo Fixo'}
                            </h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                                <input
                                    autoFocus
                                    required
                                    className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:ring-2 focus:ring-blue-100"
                                    placeholder="Ex: Aluguel"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:ring-2 focus:ring-blue-100"
                                    value={newAmount}
                                    onChange={e => setNewAmount(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dia de Vencimento</label>
                                <select
                                    className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                                    value={dueDay}
                                    onChange={e => setDueDay(e.target.value)}
                                >
                                    {[...Array(31)].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                                >
                                    {editingCostId ? 'Atualizar' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Custos;
