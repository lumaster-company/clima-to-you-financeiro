import React, { useState, useEffect } from 'react';
import { useCapitalGiro } from '../context/CapitalGiroContext';
import { useFinance } from '../context/FinanceContext';
import { useTeam } from '../context/TeamContext';
import { calculateDetailedEmployeeCost } from '../utils/financeUtils';
import { Landmark, ArrowUpCircle, ArrowDownCircle, ArrowRightLeft, Plus, Settings, Pencil, Trash2 } from 'lucide-react';
import type { WorkingCapitalAccount, WorkingCapitalTransfer } from '../context/CapitalGiroContext';

const CapitalGiro = () => {
    const { accounts, transfers, globalGoal, updateGlobalGoal, addAccount, updateAccount, deleteAccount, registerTransfer, updateTransfer, deleteTransfer } = useCapitalGiro();
    const { fixedCosts } = useFinance();
    const { employees } = useTeam();

    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [newGoal, setNewGoal] = useState('');

    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [accName, setAccName] = useState('');
    const [accType, setAccType] = useState('Conta Corrente');
    const [accBal, setAccBal] = useState('');

    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [transType, setTransType] = useState<'Aporte' | 'Resgate' | 'Transferência'>('Aporte');
    const [transAmount, setTransAmount] = useState('');
    const [transReason, setTransReason] = useState('');
    const [originAcc, setOriginAcc] = useState('');
    const [destAcc, setDestAcc] = useState('');

    const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
    const [editingTransferId, setEditingTransferId] = useState<string | null>(null);

    // Set defaults when opening transfer modal
    useEffect(() => {
        if (isTransferModalOpen && accounts.length > 0) {
            setOriginAcc(accounts[0].id);
            setDestAcc(accounts[0].id);
        }
    }, [isTransferModalOpen, accounts]);

    // --- Calculations ---
    const totalFixed = fixedCosts.reduce((acc, curr) => acc + curr.amount, 0);
    const totalTeamCost = employees.reduce((acc, emp) => acc + calculateDetailedEmployeeCost(emp).monthlyCash, 0);
    const monthlyFixedCost = totalFixed + totalTeamCost;

    const reserveBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
    
    // Safety check to avoid division by zero
    const coverageMonths = monthlyFixedCost > 0 ? (reserveBalance / monthlyFixedCost) : 0;
    const progressToGoal = globalGoal > 0 ? Math.min((reserveBalance / globalGoal) * 100, 100) : 0;

    const getHealthStatus = () => {
        if (coverageMonths > 3) return { color: 'bg-green-500', text: 'Excelente (>3 meses)' };
        if (coverageMonths >= 1) return { color: 'bg-yellow-500', text: 'Atenção (1-3 meses)' };
        return { color: 'bg-red-500', text: 'Crítico (<1 mês)' };
    };

    const health = getHealthStatus();

    // --- Handlers ---
    const handleGoalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateGlobalGoal(Number(newGoal));
        setIsGoalModalOpen(false);
    };

    const handleAccountSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingAccountId) {
                await updateAccount(editingAccountId, { name: accName, type: accType, balance: Number(accBal) || 0 });
            } else {
                await addAccount(accName, accType, Number(accBal) || 0);
            }
            setAccName(''); setAccType('Conta Corrente'); setAccBal('');
            setEditingAccountId(null);
            setIsAccountModalOpen(false);
        } catch (error) {
            alert('Falha ao salvar conta. Verifique se o banco de dados (tabelas e RLS) foi atualizado corretamente e tente novamente.');
        }
    };

    const handleDeleteAccount = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir esta conta? Isso só será possível se não houver movimentações vinculadas a ela.')) return;
        try {
            await deleteAccount(id);
        } catch (error) {
            alert('Não foi possível excluir a conta. Ela provavelmente possui transferências ou aportes vinculados.');
        }
    };

    const openEditAccount = (acc: WorkingCapitalAccount) => {
        setEditingAccountId(acc.id);
        setAccName(acc.name);
        setAccType(acc.type);
        setAccBal(acc.balance.toString());
        setIsAccountModalOpen(true);
    };

    const handleTransferSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const transferPayload = {
            type: transType,
            amount: Number(transAmount),
            reason: transReason,
            transfer_date: new Date().toISOString(),
            origin_account_id: transType === 'Resgate' || transType === 'Transferência' ? originAcc : undefined,
            destination_account_id: transType === 'Aporte' || transType === 'Transferência' ? destAcc : undefined,
        };
        try {
            if (editingTransferId) {
                await updateTransfer(editingTransferId, { amount: Number(transAmount), reason: transReason });
            } else {
                await registerTransfer(transferPayload);
            }
            setIsTransferModalOpen(false);
            setTransAmount(''); setTransReason('');
            setEditingTransferId(null);
        } catch (error) {
            alert('Falha ao registrar/atualizar movimentação. Verifique o console ou as permissões do banco.');
        }
    };

    const handleDeleteTransfer = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja cancelar e excluir esta movimentação? Os saldos das contas serão revertidos.')) return;
        try {
            await deleteTransfer(id);
        } catch (error) {
            alert('Não foi possível excluir a movimentação.');
        }
    };

    const openEditTransfer = (t: WorkingCapitalTransfer) => {
        setEditingTransferId(t.id);
        setTransType(t.type);
        setTransAmount(t.amount.toString());
        setTransReason(t.reason || '');
        setOriginAcc(t.origin_account_id || '');
        setDestAcc(t.destination_account_id || '');
        setIsTransferModalOpen(true);
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 pb-2">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Capital de Giro</h2>
                    <p className="text-sm text-gray-500 mt-1">Gerencie suas reservas financeiras de forma isolada.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { setTransType('Aporte'); setIsTransferModalOpen(true); }} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-2 transition-colors">
                        <ArrowUpCircle size={18} /> Novo Aporte
                    </button>
                    <button onClick={() => { setTransType('Resgate'); setIsTransferModalOpen(true); }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium flex items-center gap-2 transition-colors">
                        <ArrowDownCircle size={18} /> Novo Resgate
                    </button>
                </div>
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Landmark size={80} />
                    </div>
                    <p className="text-sm font-medium text-indigo-200">Saldo Atual da Reserva</p>
                    <h3 className="text-4xl font-bold mt-2">{formatCurrency(reserveBalance)}</h3>
                    
                    <div className="mt-6 space-y-2">
                        <div className="flex justify-between text-xs text-indigo-200">
                            <span>Progresso da Meta</span>
                            <span>{progressToGoal.toFixed(1)}% de {formatCurrency(globalGoal)}</span>
                        </div>
                        <div className="w-full bg-indigo-950/50 rounded-full h-2">
                            <div className="bg-indigo-400 h-2 rounded-full transition-all duration-1000" style={{ width: `${progressToGoal}%` }}></div>
                        </div>
                    </div>
                    <button onClick={() => { setNewGoal(globalGoal.toString()); setIsGoalModalOpen(true); }} className="absolute top-4 right-4 text-indigo-300 hover:text-white transition-colors">
                        <Settings size={20} />
                    </button>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                    <p className="text-sm font-medium text-gray-500 mb-2">Saúde Financeira</p>
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full ${health.color} flex items-center justify-center text-white shadow-lg animate-pulse`}>
                            <Landmark size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">{coverageMonths.toFixed(1)} <span className="text-base font-normal text-gray-500">meses</span></h3>
                            <p className={`text-sm font-medium ${health.color.replace('bg-', 'text-')}`}>{health.text}</p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-4">Calculado sobre um custo fixo de {formatCurrency(monthlyFixedCost)}/mês</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm font-medium text-gray-500">Contas Registradas</p>
                        <button onClick={() => setIsAccountModalOpen(true)} className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors">
                            <Plus size={18} />
                        </button>
                    </div>
                    <div className="space-y-3 max-h-32 overflow-y-auto pr-2">
                        {accounts.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-2">Nenhuma conta cadastrada</p>
                        ) : (
                            accounts.map(acc => (
                                <div key={acc.id} className="flex justify-between items-center p-2 rounded-lg bg-gray-50 group hover:bg-gray-100 transition-colors">
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{acc.name}</p>
                                        <p className="text-xs text-gray-500">{acc.type}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-gray-900 text-sm">{formatCurrency(acc.balance)}</span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditAccount(acc)} className="text-gray-400 hover:text-indigo-600 p-1 rounded transition-colors" title="Editar">
                                                <Pencil size={14} />
                                            </button>
                                            <button onClick={() => handleDeleteAccount(acc.id)} className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors" title="Excluir">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">Histórico de Movimentações</h3>
                    <button onClick={() => { setTransType('Transferência'); setIsTransferModalOpen(true); }} className="text-sm text-indigo-600 font-medium hover:text-indigo-800 flex items-center gap-1">
                        <ArrowRightLeft size={16} /> Transferência Interna
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                            <tr>
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4">Tipo</th>
                                <th className="px-6 py-4">Detalhes</th>
                                <th className="px-6 py-4">Motivo</th>
                                <th className="px-6 py-4 text-right">Valor</th>
                                <th className="px-6 py-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transfers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">Nenhuma movimentação registrada.</td>
                                </tr>
                            ) : (
                                transfers.map(t => {
                                    const orig = accounts.find(a => a.id === t.origin_account_id)?.name;
                                    const dest = accounts.find(a => a.id === t.destination_account_id)?.name;
                                    let details = '';
                                    if (t.type === 'Aporte') details = `Para: ${dest}`;
                                    else if (t.type === 'Resgate') details = `De: ${orig}`;
                                    else details = `${orig} ➔ ${dest}`;

                                    return (
                                        <tr key={t.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                {new Date(t.transfer_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                    t.type === 'Aporte' ? 'bg-green-100 text-green-800' : 
                                                    t.type === 'Resgate' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {t.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-700">{details}</td>
                                            <td className="px-6 py-4 italic text-gray-500">{t.reason || '-'}</td>
                                            <td className={`px-6 py-4 text-right font-bold ${
                                                t.type === 'Aporte' ? 'text-green-600' : 
                                                t.type === 'Resgate' ? 'text-red-600' : 'text-gray-600'
                                            }`}>
                                                {t.type === 'Resgate' ? '-' : t.type === 'Aporte' ? '+' : ''}
                                                {formatCurrency(t.amount)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openEditTransfer(t)} className="text-gray-400 hover:text-indigo-600 p-1 rounded transition-colors" title="Editar Movimentação">
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button onClick={() => handleDeleteTransfer(t.id)} className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors" title="Cancelar e Excluir">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals go here */}
            {isGoalModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100"><h3 className="font-bold">Definir Meta Global</h3></div>
                        <form onSubmit={handleGoalSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Valor da Meta (R$)</label>
                                <input type="number" required value={newGoal} onChange={e => setNewGoal(e.target.value)} className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:ring-2 focus:ring-indigo-100" />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setIsGoalModalOpen(false)} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isAccountModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100"><h3 className="font-bold">Nova Conta de Reserva</h3></div>
                        <form onSubmit={handleAccountSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Conta</label>
                                <input required value={accName} onChange={e => setAccName(e.target.value)} placeholder="Ex: Reserva Santander" className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:ring-2 focus:ring-indigo-100" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                <select value={accType} onChange={e => setAccType(e.target.value)} className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:ring-2 focus:ring-indigo-100">
                                    <option>Conta Corrente</option>
                                    <option>CDB / Renda Fixa</option>
                                    <option>Caixinha / Poupança</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Inicial (R$)</label>
                                <input type="number" value={accBal} onChange={e => setAccBal(e.target.value)} className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:ring-2 focus:ring-indigo-100" />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => { setIsAccountModalOpen(false); setEditingAccountId(null); setAccName(''); setAccBal(''); }} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">{editingAccountId ? 'Salvar Alterações' : 'Adicionar'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isTransferModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-900">Registrar {transType}</h3>
                        </div>
                        <form onSubmit={handleTransferSubmit} className="p-4 space-y-4">
                            {accounts.length === 0 ? (
                                <p className="text-sm text-red-500">Cadastre uma conta primeiro para poder movimentar.</p>
                            ) : (
                                <>
                                    {(transType === 'Resgate' || transType === 'Transferência') && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Conta de Origem</label>
                                            <select required value={originAcc} disabled={!!editingTransferId} onChange={e => setOriginAcc(e.target.value)} className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50 disabled:text-gray-500">
                                                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    {(transType === 'Aporte' || transType === 'Transferência') && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Conta de Destino</label>
                                            <select required value={destAcc} disabled={!!editingTransferId} onChange={e => setDestAcc(e.target.value)} className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50 disabled:text-gray-500">
                                                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                                        <input type="number" required step="0.01" value={transAmount} onChange={e => setTransAmount(e.target.value)} className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:ring-2 focus:ring-indigo-100" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (Opcional, mas recomendado para resgates)</label>
                                        <input value={transReason} onChange={e => setTransReason(e.target.value)} className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:ring-2 focus:ring-indigo-100" placeholder="Ex: Pagamento Fornecedor Extra" />
                                    </div>
                                </>
                            )}
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => { setIsTransferModalOpen(false); setEditingTransferId(null); setTransAmount(''); setTransReason(''); }} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                                <button type="submit" disabled={accounts.length === 0} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300">{editingTransferId ? 'Salvar Alterações' : 'Registrar'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CapitalGiro;
