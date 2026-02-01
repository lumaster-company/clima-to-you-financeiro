import { useState } from 'react';
import { FileText, Plus, Search, Edit2, Trash2, X, Check, Calendar, DollarSign, Filter, Users, Building, TrendingUp, Activity } from 'lucide-react';
import { useContracts, type Contract, type ContractType, type BillingFrequency, type ClientType, type ContractStatus } from '../context/ContractContext';

const Contratos = () => {
    const { contracts, addContract, updateContract, removeContract, getMRR, getActiveContractsCount } = useContracts();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingContract, setEditingContract] = useState<Contract | null>(null);

    // Filters
    const [filterType, setFilterType] = useState<ContractType | 'Todos'>('Todos');
    const [filterFreq, setFilterFreq] = useState<BillingFrequency | 'Todos'>('Todos');
    const [filterClient, setFilterClient] = useState<ClientType | 'Todos'>('Todos');
    const [filterStatus, setFilterStatus] = useState<ContractStatus | 'Todos'>('Todos');

    // Form State
    const [clientName, setClientName] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [type, setType] = useState<ContractType>('PMOC');
    const [clientType, setClientType] = useState<ClientType>('Comercial');
    const [value, setValue] = useState('');
    const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>('Mensal');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [durationMonths, setDurationMonths] = useState<12 | 24>(12);
    const [status, setStatus] = useState<ContractStatus>('Ativo');
    const [endDate, setEndDate] = useState('');

    // Derived Logic
    const activeContracts = contracts.filter(c => c.status === 'Ativo');
    const pmocCount = activeContracts.filter(c => c.type === 'PMOC').length;
    const maintenanceCount = activeContracts.filter(c => c.type === 'Manutenção').length;

    const monthlyCount = activeContracts.filter(c => c.billingFrequency === 'Mensal').length;
    const bimonthlyCount = activeContracts.filter(c => c.billingFrequency === 'Bimestral').length;
    const quarterlyCount = activeContracts.filter(c => c.billingFrequency === 'Trimestral').length;

    const filteredContracts = contracts.filter(c => {
        const matchesSearch = c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || c.cnpj.includes(searchTerm);
        const matchesType = filterType === 'Todos' || c.type === filterType;
        const matchesFreq = filterFreq === 'Todos' || c.billingFrequency === filterFreq;
        const matchesClient = filterClient === 'Todos' || c.clientType === filterClient;
        const matchesStatus = filterStatus === 'Todos' || c.status === filterStatus;
        return matchesSearch && matchesType && matchesFreq && matchesClient && matchesStatus;
    });

    const handleOpenModal = (contract?: Contract) => {
        if (contract) {
            setEditingContract(contract);
            setClientName(contract.clientName);
            setCnpj(contract.cnpj);
            setType(contract.type);
            setClientType(contract.clientType || 'Comercial');
            setValue(contract.value.toString());
            setBillingFrequency(contract.billingFrequency);
            setStartDate(contract.startDate);
            setDurationMonths(contract.durationMonths);
            setStatus(contract.status);
            setEndDate(contract.endDate || '');
        } else {
            setEditingContract(null);
            setClientName('');
            setCnpj('');
            setType('PMOC');
            setClientType('Comercial');
            setValue('');
            setBillingFrequency('Mensal');
            setStartDate(new Date().toISOString().split('T')[0]);
            setDurationMonths(12);
            setStatus('Ativo');
            setEndDate('');
        }
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!clientName || !value || !startDate) return alert('Preencha os campos obrigatórios');
        if (status !== 'Ativo' && !endDate) return alert('Data de encerramento é obrigatória para contratos inativos');

        const contractData = {
            clientName,
            cnpj,
            type,
            clientType,
            value: Number(value),
            billingFrequency,
            startDate,
            endDate: status !== 'Ativo' ? endDate : undefined,
            durationMonths,
            status
        };

        if (editingContract) {
            updateContract(editingContract.id, contractData);
        } else {
            addContract(contractData);
        }
        setIsModalOpen(false);
    };

    // Helper to calculate "Mensal Equivalent" for display in modal
    const calculateMonthlyEquivalent = () => {
        const val = Number(value) || 0;
        switch (billingFrequency) {
            case 'Mensal': return val;
            case 'Bimestral': return val / 2;
            case 'Trimestral': return val / 3;
            case 'Semestral': return val / 6;
            case 'Anual': return val / 12;
            default: return val;
        }
    };

    const formatDateMonthYear = (dateStr: string) => {
        if (!dateStr) return '-';
        // Add timezone offset correction or just use UTC parts if input is purely date
        // Since input type='date' gives YYYY-MM-DD, splitting is safer to avoid timezone shifts
        const [y, m] = dateStr.split('-');
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        return `${monthNames[parseInt(m) - 1]}/${y}`;
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-600" />
                        Contratos e Gestão de PMOC
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Gerencie contratos recorrentes, PMOC e manutenções ativas.
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium whitespace-nowrap shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Novo Contrato
                </button>
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-1">MRR Mensal (Est.)</p>
                        <h3 className="text-2xl font-bold text-gray-800">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(getMRR())}
                        </h3>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <TrendingUp size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Contratos Ativos</p>
                        <h3 className="text-2xl font-bold text-gray-800">{getActiveContractsCount()}</h3>
                    </div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <Activity size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Frequência de Manutenção</p>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500">Mensal</span>
                            <strong className="text-gray-800">{monthlyCount}</strong>
                        </div>
                        <div className="w-px h-8 bg-gray-200"></div>
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500">Trimestral</span>
                            <strong className="text-gray-800">{quarterlyCount}</strong>
                        </div>
                        <div className="w-px h-8 bg-gray-200"></div>
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500">Bimestral</span>
                            <strong className="text-gray-800">{bimonthlyCount}</strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* FILTERS & SEARCH */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                    {/* Filters Group */}
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <div className="flex items-center gap-2 text-gray-400">
                            <Filter size={16} />
                            <span className="text-xs font-semibold uppercase">Filtros:</span>
                        </div>

                        {/* Filter: Type */}
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as any)}
                            className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                        >
                            <option value="Todos">Todos os Tipos</option>
                            <option value="PMOC">PMOC + RT ({pmocCount})</option>
                            <option value="Manutenção">Manutenção ({maintenanceCount})</option>
                        </select>

                        {/* Filter: Frequency */}
                        <select
                            value={filterFreq}
                            onChange={(e) => setFilterFreq(e.target.value as any)}
                            className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                        >
                            <option value="Todos">Todas Frequências</option>
                            <option value="Mensal">Mensal</option>
                            <option value="Bimestral">Bimestral</option>
                            <option value="Trimestral">Trimestral</option>
                            <option value="Semestral">Semestral</option>
                            <option value="Anual">Anual</option>
                        </select>

                        {/* Filter: Client Type */}
                        <select
                            value={filterClient}
                            onChange={(e) => setFilterClient(e.target.value as any)}
                            className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                        >
                            <option value="Todos">Clientes (Todos)</option>
                            <option value="Comercial">Comercial</option>
                            <option value="Residencial">Residencial</option>
                        </select>

                        {/* Filter: Status */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                        >
                            <option value="Todos">Status (Todos)</option>
                            <option value="Ativo">Ativo</option>
                            <option value="Encerrado">Encerrado</option>
                            <option value="Perdido">Perdido</option>
                        </select>
                    </div>

                    {/* Search */}
                    <div className="relative w-full lg:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente ou CNPJ..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-gray-50"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Frequência</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">MRR / Valor</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Início</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredContracts.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                    Nenhum contrato encontrado com os filtros atuais.
                                </td>
                            </tr>
                        ) : (
                            filteredContracts.map((contract) => {
                                const mrr = contract.value / (contract.billingFrequency === 'Anual' ? 12 : contract.billingFrequency === 'Semestral' ? 6 : contract.billingFrequency === 'Trimestral' ? 3 : contract.billingFrequency === 'Bimestral' ? 2 : 1);

                                let statusColor = 'bg-gray-100 text-gray-800';
                                if (contract.status === 'Ativo') statusColor = 'bg-green-100 text-green-800';
                                if (contract.status === 'Perdido') statusColor = 'bg-red-100 text-red-800';

                                return (
                                    <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {contract.clientType === 'Comercial' ? (
                                                    <Building size={14} className="text-gray-400" />
                                                ) : (
                                                    <Users size={14} className="text-gray-400" />
                                                )}
                                                <div>
                                                    <div className="font-medium text-gray-900">{contract.clientName}</div>
                                                    {contract.cnpj && <div className="text-xs text-gray-500">{contract.cnpj}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${contract.type === 'PMOC' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {contract.type === 'PMOC' ? 'PMOC + RT' : contract.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600 capitalize">{contract.billingFrequency}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-green-700 text-xs">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mrr)}/mês
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.value)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <div className="font-medium text-gray-700">{formatDateMonthYear(contract.startDate)}</div>
                                            {contract.status !== 'Ativo' && contract.endDate && (
                                                <div className="text-xs text-red-400">Fim: {formatDateMonthYear(contract.endDate)}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                                                {contract.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(contract)}
                                                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => removeContract(contract.id)}
                                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="w-4 h-4" />
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

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">
                                {editingContract ? 'Editar Contrato' : 'Novo Contrato'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                                    <input
                                        type="text"
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Nome da Empresa / Cliente"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ (Opcional)</label>
                                        <input
                                            type="text"
                                            value={cnpj}
                                            onChange={(e) => setCnpj(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="00.000.000/0000-00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Perfil do Cliente</label>
                                        <select
                                            value={clientType}
                                            onChange={(e) => setClientType(e.target.value as ClientType)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="Comercial">Comercial</option>
                                            <option value="Residencial">Residencial</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Contrato</label>
                                        <select
                                            value={type}
                                            onChange={(e) => setType(e.target.value as ContractType)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="PMOC">PMOC + RT (Completo)</option>
                                            <option value="Manutenção">Manutenção Simples</option>
                                            <option value="Outro">Outro</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Frequência</label>
                                        <select
                                            value={billingFrequency}
                                            onChange={(e) => setBillingFrequency(e.target.value as BillingFrequency)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="Mensal">Mensal</option>
                                            <option value="Bimestral">Bimestral</option>
                                            <option value="Trimestral">Trimestral</option>
                                            <option value="Semestral">Semestral</option>
                                            <option value="Anual">Anual</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Valor do Contrato (R$)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                                            <input
                                                type="number"
                                                value={value}
                                                onChange={(e) => setValue(e.target.value)}
                                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-gray-800"
                                                placeholder="0,00"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Mês/Ano de Início</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* LIFECYCLE SECTION */}
                                <div className="border-t border-gray-100 pt-4 mt-2">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Ciclo de Vida</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Status Atual</label>
                                            <select
                                                value={status}
                                                onChange={(e) => setStatus(e.target.value as ContractStatus)}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none font-medium ${status === 'Ativo' ? 'bg-green-50 text-green-700 border-green-200 focus:ring-green-500' :
                                                    status === 'Perdido' ? 'bg-red-50 text-red-700 border-red-200 focus:ring-red-500' :
                                                        'bg-gray-50 text-gray-700 border-gray-200 focus:ring-gray-500'
                                                    }`}
                                            >
                                                <option value="Ativo">Ativo (Vigente)</option>
                                                <option value="Encerrado">Encerrado (Normal)</option>
                                                <option value="Perdido">Perdido (Cancelado)</option>
                                            </select>
                                        </div>

                                        {status !== 'Ativo' && (
                                            <div className="animate-in fade-in duration-200">
                                                <label className="block text-sm font-medium text-red-600 mb-1">Data de Encerramento *</label>
                                                <input
                                                    type="date"
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                    required
                                                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-red-50"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* MRR Preview */}
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-blue-800 text-sm font-medium">
                                        <DollarSign className="w-4 h-4" />
                                        Receita Recorrente (MRR)
                                    </div>
                                    <div className="text-blue-800 font-bold text-lg">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateMonthlyEquivalent())}
                                        <span className="text-xs font-normal opacity-75"> / mês (est.)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors font-medium text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm flex items-center gap-2 shadow-sm hover:shadow-md"
                            >
                                <Check className="w-4 h-4" />
                                Salvar Contrato
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Contratos;
