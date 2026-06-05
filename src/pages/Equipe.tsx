import { useState } from 'react';
import { Plus, Users, Trash2, Edit2, X, Check, UserCheck } from 'lucide-react';
import type { Employee } from '../types';
import { calculateDetailedEmployeeCost } from '../utils/financeUtils';
import { useTeam } from '../context/TeamContext';

const Equipe = () => {
    const { employees, addEmployee, updateEmployee, removeEmployee } = useTeam();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [type, setType] = useState<'CLT' | 'Sócio'>('CLT');
    const [salary, setSalary] = useState('');
    const [periculosidade, setPericulosidade] = useState<number>(0);
    const [transportBenefits, setTransportBenefits] = useState('');
    const [mealBenefits, setMealBenefits] = useState('');
    const [cestaBasica, setCestaBasica] = useState('');
    const [planoDeSaude, setPlanoDeSaude] = useState('');
    const [internet, setInternet] = useState('');
    const [vtDiscount, setVtDiscount] = useState(false);
    const [bonuses, setBonuses] = useState('');

    const handleOpenModal = (employee?: Employee) => {
        if (employee) {
            setEditingEmployee(employee);
            setName(employee.name);
            setRole(employee.role);
            setType(employee.type);
            setSalary(employee.financials?.salary?.toString() || '');
            setPericulosidade(employee.financials?.periculosidade || 0);
            setTransportBenefits(employee.financials?.transportBenefits?.toString() || '');
            setMealBenefits(employee.financials?.mealBenefits?.toString() || '');
            setCestaBasica(employee.financials?.cestaBasica?.toString() || '');
            setPlanoDeSaude(employee.financials?.planoDeSaude?.toString() || '');
            setInternet(employee.financials?.internet?.toString() || '');
            setVtDiscount(employee.financials?.vtDiscount || false);
            setBonuses(employee.financials?.bonuses?.toString() || '');
        } else {
            setEditingEmployee(null);
            setName('');
            setRole('');
            setType('CLT');
            setSalary('');
            setPericulosidade(0);
            setTransportBenefits('');
            setMealBenefits('');
            setCestaBasica('');
            setPlanoDeSaude('');
            setInternet('');
            setVtDiscount(false);
            setBonuses('');
        }
        setIsModalOpen(true);
    };

    const handleSave = () => {
        // Generate a more robust ID if new
        const newId = editingEmployee ? editingEmployee.id : `emp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const newEmployee: Employee = {
            id: newId,
            name,
            role,
            type,
            financials: {
                salary: Number(salary) || 0,
                periculosidade,
                transportBenefits: Number(transportBenefits) || 0,
                mealBenefits: Number(mealBenefits) || 0,
                cestaBasica: Number(cestaBasica) || 0,
                planoDeSaude: Number(planoDeSaude) || 0,
                internet: Number(internet) || 0,
                vtDiscount,
                bonuses: Number(bonuses) || 0,
            },
        };

        if (editingEmployee) {
            updateEmployee(editingEmployee.id, newEmployee);
        } else {
            addEmployee(newEmployee);
        }
        setIsModalOpen(false);
        setEditingEmployee(null);
    };

    const handleDelete = (id: string) => {
        if (confirm('Tem certeza que deseja excluir este colaborador?')) {
            removeEmployee(id);
        }
    };

    const calculateCosts = (emp: Employee) => {
        return calculateDetailedEmployeeCost(emp);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Users className="w-6 h-6 text-blue-600" />
                        Equipe
                    </h1>
                    <p className="text-gray-500 text-sm">Gerencie pagamentos e custos de colaboradores e sócios.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Nova Pessoa
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {employees.map(employee => {
                    const costs = calculateCosts(employee);
                    return (
                        <div key={employee.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg">{employee.name}</h3>
                                    <div className="flex gap-2 mt-1">
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                            {employee.role}
                                        </span>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${employee.type === 'Sócio'
                                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                                            : 'bg-blue-50 text-blue-700 border-blue-200'
                                            }`}>
                                            {employee.type}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => handleOpenModal(employee)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(employee.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 pt-3 border-t border-gray-100">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">
                                        {employee.type === 'Sócio' ? 'Pró-labore Bruto' : 'Salário Base'}
                                    </span>
                                    <span className="font-semibold text-gray-700">
                                        R$ {employee.financials.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>

                                {employee.type === 'CLT' && (
                                    <>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500">Periculosidade ({employee.financials.periculosidade}%)</span>
                                            <span className="font-medium text-gray-700">
                                                + R$ {((employee.financials.salary * employee.financials.periculosidade) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm font-bold pt-1 border-t border-gray-100">
                                            <span className="text-gray-800">Base de Cálculo</span>
                                            <span className="text-gray-800">
                                                R$ {costs.details.baseDeCalculo?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm mt-2">
                                            <span className="text-gray-500">Benefícios</span>
                                            <span className="font-medium text-gray-700">
                                                + R$ {costs.details.benefits?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        {employee.financials.vtDiscount && (
                                            <div className="flex justify-between items-center text-sm text-red-600 mt-1">
                                                <span className="text-red-500">Desconto VT (6%)</span>
                                                <span className="font-medium">
                                                    - R$ {(costs.details.baseDeCalculo! * 0.06).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        )}
                                    </>
                                )}

                                {employee.type === 'Sócio' && (
                                    <div className="bg-purple-50 rounded-lg p-2 flex justify-between items-center text-xs text-purple-700 border border-purple-100">
                                        <span>INSS a Recolher (11%)</span>
                                        <span className="font-bold">R$ {costs.details.inss?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                )}

                                <div className="pt-2 mt-2 border-t border-gray-100 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1" title="O que a empresa paga todo mês (Salário + Benefícios + FGTS)">
                                            Saída Mensal (Caixa)
                                        </p>
                                        <p className="text-sm font-bold text-gray-800">
                                            R$ {costs.monthlyCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                        <div className="flex flex-col mt-1 space-y-0.5">
                                            <div className="flex justify-between items-center text-[10px] text-gray-500">
                                                <span>Dia (22d):</span>
                                                <span className="font-medium text-gray-700">
                                                    R$ {(costs.monthlyCash / 22).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] text-gray-500">
                                                <span>Hora (176h):</span>
                                                <span className="font-medium text-gray-700">
                                                    R$ {(costs.monthlyCash / 176).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex justify-end items-center gap-1 mb-1">
                                            <p className="text-xs text-gray-400">Custo Total c/ Rescisão</p>
                                            <div className="group relative">
                                                <div className="cursor-help text-gray-400 hover:text-blue-500">
                                                    <UserCheck size={12} />
                                                </div>
                                                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-48 bg-gray-800 text-white text-xs rounded p-2 z-10 shadow-lg">
                                                    Inclui provisão de Férias, 13º, Aviso Prévio e Multa FGTS.
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm font-bold text-red-600">
                                            R$ {costs.realCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                        <div className="flex flex-col mt-1 space-y-0.5 items-end">
                                            <div className="flex justify-end items-center gap-2 text-[10px] text-red-400">
                                                <span>Dia:</span>
                                                <span className="font-medium">
                                                    R$ {(costs.realCost / 22).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            <div className="flex justify-end items-center gap-2 text-[10px] text-red-400">
                                                <span>Hora (176h):</span>
                                                <span className="font-medium">
                                                    R$ {(costs.realCost / 176).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">
                                {editingEmployee ? 'Editar Colaborador' : 'Novo Colaborador'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            {/* Type Selection */}
                            <div className="grid grid-cols-2 gap-4 p-1 bg-gray-100 rounded-lg mb-4">
                                <button
                                    onClick={() => setType('CLT')}
                                    className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${type === 'CLT'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    CLT (Funcionário)
                                </button>
                                <button
                                    onClick={() => setType('Sócio')}
                                    className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${type === 'Sócio'
                                        ? 'bg-white text-purple-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Sócio (Parceiro)
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="Ex: João Silva"
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                                    <input
                                        type="text"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="Ex: Mecânico"
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {type === 'Sócio' ? 'Pró-labore Bruto (R$)' : 'Salário Base (R$)'}
                                    </label>
                                    <input
                                        type="number"
                                        value={salary}
                                        onChange={(e) => setSalary(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="0,00"
                                    />
                                </div>
                            </div>

                            {type === 'CLT' && (
                                <div className="space-y-4 pt-2 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Periculosidade (%)</label>
                                        <select
                                            value={periculosidade}
                                            onChange={(e) => setPericulosidade(Number(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                                        >
                                            <option value={0}>0%</option>
                                            <option value={5}>5%</option>
                                            <option value={10}>10%</option>
                                            <option value={15}>15%</option>
                                            <option value={20}>20%</option>
                                            <option value={25}>25%</option>
                                            <option value={30}>30%</option>
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">Calculado sobre o Salário Base.</p>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Benefícios Mensais</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Transporte (R$)</label>
                                                <input
                                                    type="number"
                                                    value={transportBenefits}
                                                    onChange={(e) => setTransportBenefits(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                    placeholder="0,00"
                                                />
                                                <label className="flex items-center gap-2 mt-2 text-xs text-gray-600 cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={vtDiscount}
                                                        onChange={(e) => setVtDiscount(e.target.checked)}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    Aplicar desconto de VT (6%)
                                                </label>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Alimentação (R$)</label>
                                                <input
                                                    type="number"
                                                    value={mealBenefits}
                                                    onChange={(e) => setMealBenefits(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                    placeholder="0,00"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Cesta Básica (R$)</label>
                                                <input
                                                    type="number"
                                                    value={cestaBasica}
                                                    onChange={(e) => setCestaBasica(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                    placeholder="0,00"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Plano de Saúde (R$)</label>
                                                <input
                                                    type="number"
                                                    value={planoDeSaude}
                                                    onChange={(e) => setPlanoDeSaude(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                    placeholder="0,00"
                                                />
                                            </div>
                                            <div className="col-span-2 sm:col-span-1">
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Internet/Telefone (R$)</label>
                                                <input
                                                    type="number"
                                                    value={internet}
                                                    onChange={(e) => setInternet(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                    placeholder="0,00"
                                                />
                                            </div>
                                            <div className="col-span-2 sm:col-span-1">
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Outros / Bonificações (R$)</label>
                                                <input
                                                    type="number"
                                                    value={bonuses}
                                                    onChange={(e) => setBonuses(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                    placeholder="0,00"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {type === 'Sócio' && (
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 animate-in fade-in slide-in-from-top-2">
                                    <h4 className="text-sm font-semibold text-purple-800 mb-2 flex items-center gap-2">
                                        <UserCheck className="w-4 h-4" />
                                        Resumo do Sócio
                                    </h4>
                                    <p className="text-xs text-purple-600 mb-1">
                                        O custo para a empresa é exatamente o valor do <strong>Pró-labore Bruto</strong>.
                                        O INSS e IRRF são descontados deste valor no momento do pagamento ao sócio.
                                    </p>
                                </div>
                            )}

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
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Equipe;
