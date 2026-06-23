import { useState, useMemo, useEffect } from 'react';
import { useFinance, type Project } from '../context/FinanceContext';
import { useTeam } from '../context/TeamContext';
import { calculateDetailedEmployeeCost } from '../utils/financeUtils';
import { Search, Briefcase, TrendingUp, Percent, ArrowLeft, Save, Users, FileText, ChevronRight } from 'lucide-react';

const GestaoProjetos = () => {
    const { projects, filteredTransactions, updateProjectDetails } = useFinance();
    const { employees } = useTeam();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    // Detail view states
    const [taxRate, setTaxRate] = useState<number>(0);
    const [indirectCostRate, setIndirectCostRate] = useState<number>(0);
    const [toolKitName, setToolKitName] = useState<string>('');
    const [toolDailyValue, setToolDailyValue] = useState<number>(0);
    const [toolDays, setToolDays] = useState<number>(0);
    const [vehicleDailyValue, setVehicleDailyValue] = useState<number>(0);
    const [vehicleDays, setVehicleDays] = useState<number>(0);
    const [laborAllocations, setLaborAllocations] = useState<{employeeId: string, daysWorked: number}[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (selectedProject) {
            // Update local state when a project is selected or when projects list updates
            const currentProject = projects.find(p => p.id === selectedProject.id);
            if (currentProject) {
                setTaxRate(currentProject.taxRate || 0);
                setIndirectCostRate(currentProject.indirectCostRate || 0);
                
                let parsedKit = { name: '', daily: 0, days: 0, vDaily: 0, vDays: 0 };
                try {
                    if (currentProject.toolKit && currentProject.toolKit.startsWith('{')) {
                        parsedKit = JSON.parse(currentProject.toolKit);
                    } else {
                        parsedKit.name = currentProject.toolKit || '';
                        // Fallback logic for legacy total value
                        if (currentProject.toolUsageValue && currentProject.toolUsageValue > 0) {
                            parsedKit.daily = currentProject.toolUsageValue;
                            parsedKit.days = 1;
                        }
                        if (currentProject.vehicleUsageValue && currentProject.vehicleUsageValue > 0) {
                            parsedKit.vDaily = currentProject.vehicleUsageValue;
                            parsedKit.vDays = 1;
                        }
                    }
                } catch(e) {}

                setToolKitName(parsedKit.name);
                setToolDailyValue(parsedKit.daily || 0);
                setToolDays(parsedKit.days || 0);
                setVehicleDailyValue(parsedKit.vDaily || 0);
                setVehicleDays(parsedKit.vDays || 0);
                
                setLaborAllocations(currentProject.laborAllocations || []);
                setSelectedProject(currentProject); // Keep reference updated
            }
        }
    }, [selectedProject?.id, projects]);

    const handleKitChange = (kit: string) => {
        setToolKitName(kit);
        if (kit === 'Kit Padrão') {
            setToolDailyValue(150); // Valor sugerido
        } else if (kit === 'Kit Completo') {
            setToolDailyValue(350); // Valor sugerido
        }
    };

    const handleSaveDetails = async () => {
        if (!selectedProject) return;
        setIsSaving(true);
        try {
            const toolTotal = toolDailyValue * toolDays;
            const vehicleTotal = vehicleDailyValue * vehicleDays;
            
            const kitJson = JSON.stringify({
                name: toolKitName,
                daily: toolDailyValue,
                days: toolDays,
                vDaily: vehicleDailyValue,
                vDays: vehicleDays
            });

            await updateProjectDetails(selectedProject.id, taxRate, indirectCostRate, kitJson, toolTotal, vehicleTotal, laborAllocations);
            alert('Configurações do projeto salvas com sucesso!');
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar as configurações.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAllocationChange = (employeeId: string, daysWorkedStr: string) => {
        const days = parseFloat(daysWorkedStr) || 0;
        setLaborAllocations(prev => {
            const existing = prev.find(a => a.employeeId === employeeId);
            if (existing) {
                return prev.map(a => a.employeeId === employeeId ? { ...a, daysWorked: days } : a);
            } else {
                return [...prev, { employeeId, daysWorked: days }];
            }
        });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    // Master View Computation
    const projectStats = useMemo(() => {
        return projects.map(project => {
            const projectTransactions = filteredTransactions.filter(t => t.projectId === project.id && t.status === 'paid');
            
            const totalEntradas = projectTransactions
                .filter(t => t.type === 'income')
                .reduce((acc, curr) => acc + curr.amount, 0);

            const totalSaidas = projectTransactions
                .filter(t => t.type === 'expense')
                .reduce((acc, curr) => acc + curr.amount, 0);

            let custoMaoDeObra = 0;
            (project.laborAllocations || []).forEach(allocation => {
                const emp = employees.find(e => e.id === allocation.employeeId);
                if (emp) {
                    const costDay = calculateDetailedEmployeeCost(emp).realCost / 22;
                    custoMaoDeObra += costDay * allocation.daysWorked;
                }
            });

            const impostoEstimado = totalEntradas * ((project.taxRate || 0) / 100);
            const custosIndiretos = totalEntradas * ((project.indirectCostRate || 0) / 100);
            const custosAtivos = (project.toolUsageValue || 0) + (project.vehicleUsageValue || 0);

            const lucroReal = totalEntradas - totalSaidas - custoMaoDeObra - impostoEstimado - custosIndiretos - custosAtivos;
            const margem = totalEntradas > 0 ? (lucroReal / totalEntradas) * 100 : 0;

            return {
                ...project,
                totalEntradas,
                totalSaidas,
                custoMaoDeObra,
                impostoEstimado,
                custosIndiretos,
                custosAtivos,
                lucroReal,
                margem
            };
        }).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [projects, filteredTransactions, searchTerm, employees]);

    if (selectedProject) {
        // Se ainda não salvou, a UI precisa refletir os inputs locais instantaneamente para mostrar o impacto
        // Recalculating based on LOCAL state (taxRate, laborAllocations) instead of DB state (stats)
        const projectTransactions = filteredTransactions.filter(t => t.projectId === selectedProject.id && t.status === 'paid');
        const receitaTotal = projectTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
        const custoDireto = projectTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
        
        let custoMaoDeObraLocal = 0;
        laborAllocations.forEach(allocation => {
            const emp = employees.find(e => e.id === allocation.employeeId);
            if (emp) {
                const costDay = calculateDetailedEmployeeCost(emp).realCost / 22;
                custoMaoDeObraLocal += costDay * allocation.daysWorked;
            }
        });

        const impostoEstimadoLocal = receitaTotal * (taxRate / 100);
        const custosIndiretosLocal = receitaTotal * (indirectCostRate / 100);
        const custosAtivosLocal = (toolDailyValue * toolDays) + (vehicleDailyValue * vehicleDays);
        
        const lucroRealLocal = receitaTotal - custoDireto - custoMaoDeObraLocal - impostoEstimadoLocal - custosIndiretosLocal - custosAtivosLocal;
        const margemLocal = receitaTotal > 0 ? (lucroRealLocal / receitaTotal) * 100 : 0;

        return (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setSelectedProject(null)}
                            className="p-2 bg-white text-gray-600 rounded-full hover:bg-gray-100 border border-gray-200 transition-colors shadow-sm"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h2 className="text-2xl font-bold text-[#442685]">{selectedProject.name}</h2>
                            <p className="text-gray-500 text-sm">Detalhamento e Análise de Lucro Real</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleSaveDetails}
                        disabled={isSaving}
                        className="bg-[#442685] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-[#341d66] transition-colors font-medium shadow-md disabled:opacity-70"
                    >
                        <Save size={18} />
                        {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                    </button>
                </div>

                {/* Dashboard Panel */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <TrendingUp className="text-[#442685] w-5 h-5" /> 
                        Painel de Resultado (Tempo Real)
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-8 gap-4">
                        <div className="bg-green-50/50 p-4 rounded-lg border border-green-100">
                            <div className="text-green-600 text-[11px] font-bold uppercase mb-1">Receita Total</div>
                            <div className="text-lg font-bold text-green-700">{formatCurrency(receitaTotal)}</div>
                        </div>
                        <div className="bg-red-50/50 p-4 rounded-lg border border-red-100">
                            <div className="text-red-600 text-[11px] font-bold uppercase mb-1">(-) Custo Direto</div>
                            <div className="text-lg font-bold text-red-700">{formatCurrency(custoDireto)}</div>
                        </div>
                        <div className="bg-orange-50/50 p-4 rounded-lg border border-orange-100">
                            <div className="text-orange-600 text-[11px] font-bold uppercase mb-1">(-) Mão de Obra</div>
                            <div className="text-lg font-bold text-orange-700">{formatCurrency(custoMaoDeObraLocal)}</div>
                        </div>
                        <div className="bg-purple-50/50 p-4 rounded-lg border border-purple-100">
                            <div className="text-purple-600 text-[11px] font-bold uppercase mb-1">(-) Impostos</div>
                            <div className="text-lg font-bold text-purple-700">{formatCurrency(impostoEstimadoLocal)}</div>
                        </div>
                        <div className="bg-pink-50/50 p-4 rounded-lg border border-pink-100">
                            <div className="text-pink-600 text-[11px] font-bold uppercase mb-1">(-) Indiretos</div>
                            <div className="text-lg font-bold text-pink-700">{formatCurrency(custosIndiretosLocal)}</div>
                        </div>
                        <div className="bg-teal-50/50 p-4 rounded-lg border border-teal-100">
                            <div className="text-teal-600 text-[11px] font-bold uppercase mb-1">(-) Ativos</div>
                            <div className="text-lg font-bold text-teal-700">{formatCurrency(custosAtivosLocal)}</div>
                        </div>
                        <div className={`p-4 rounded-lg border ${lucroRealLocal >= 0 ? 'bg-blue-50/50 border-blue-100' : 'bg-red-50 border-red-200'}`}>
                            <div className={`text-[11px] font-bold uppercase mb-1 ${lucroRealLocal >= 0 ? 'text-blue-600' : 'text-red-600'}`}>(=) Lucro Real</div>
                            <div className={`text-lg font-bold ${lucroRealLocal >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{formatCurrency(lucroRealLocal)}</div>
                        </div>
                        <div className={`p-4 rounded-lg border ${margemLocal >= 0 ? 'bg-gray-50 border-gray-200' : 'bg-red-50 border-red-200'}`}>
                            <div className={`text-[11px] font-bold uppercase mb-1 ${margemLocal >= 0 ? 'text-gray-500' : 'text-red-500'}`}>Margem (%)</div>
                            <div className={`text-lg font-bold ${margemLocal >= 0 ? 'text-gray-800' : 'text-red-700'}`}>{margemLocal.toFixed(2)}%</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Painéis Laterais: Impostos e Custos Operacionais */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center gap-2 mb-6 text-[#442685]">
                                <FileText size={20} />
                                <h3 className="font-bold text-lg">Impostos e Deduções</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Alíquota de Imposto (%)</label>
                                    <div className="relative">
                                        <input 
                                            type="number"
                                            value={taxRate || ''}
                                            onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                                            placeholder="0"
                                            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#442685]/20 focus:border-[#442685] outline-none transition-all"
                                        />
                                        <Percent className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Custos Indiretos (BDI/ADM) (%)</label>
                                    <div className="relative">
                                        <input 
                                            type="number"
                                            value={indirectCostRate || ''}
                                            onChange={e => setIndirectCostRate(parseFloat(e.target.value) || 0)}
                                            placeholder="0"
                                            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#442685]/20 focus:border-[#442685] outline-none transition-all"
                                        />
                                        <Percent className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    </div>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-4">
                                    <p className="text-xs text-blue-800">
                                        Valores calculados automaticamente sobre a Receita Total da obra e descontados no Lucro Real.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Custos Operacionais Adicionais */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center gap-2 mb-6 text-[#442685]">
                                <Briefcase size={20} />
                                <h3 className="font-bold text-lg">Custos Operacionais Adicionais</h3>
                            </div>
                            <div className="space-y-6">
                                {/* Ferramentas */}
                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-3 border-b pb-2">Ferramentas</h4>
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Kit Sugerido</label>
                                            <select 
                                                value={toolKitName}
                                                onChange={e => handleKitChange(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#442685]/20 focus:border-[#442685] outline-none transition-all bg-white"
                                            >
                                                <option value="">Personalizado</option>
                                                <option value="Kit Padrão">Kit Padrão</option>
                                                <option value="Kit Completo">Kit Completo</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Valor Diário (R$)</label>
                                            <input 
                                                type="number"
                                                value={toolDailyValue || ''}
                                                onChange={e => setToolDailyValue(parseFloat(e.target.value) || 0)}
                                                placeholder="0,00"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#442685]/20 focus:border-[#442685] outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Dias Utilizados</label>
                                            <input 
                                                type="number"
                                                value={toolDays || ''}
                                                onChange={e => setToolDays(parseFloat(e.target.value) || 0)}
                                                placeholder="0"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#442685]/20 focus:border-[#442685] outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="text-right text-sm font-bold text-gray-600 mt-2">
                                        Custo na Obra: <span className="text-[#442685]">{formatCurrency(toolDailyValue * toolDays)}</span>
                                    </div>
                                </div>

                                {/* Veículo */}
                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-3 border-b pb-2">Veículo</h4>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Valor Diário (R$)</label>
                                            <input 
                                                type="number"
                                                value={vehicleDailyValue || ''}
                                                onChange={e => setVehicleDailyValue(parseFloat(e.target.value) || 0)}
                                                placeholder="0,00"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#442685]/20 focus:border-[#442685] outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Dias Utilizados</label>
                                            <input 
                                                type="number"
                                                value={vehicleDays || ''}
                                                onChange={e => setVehicleDays(parseFloat(e.target.value) || 0)}
                                                placeholder="0"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#442685]/20 focus:border-[#442685] outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="text-right text-sm font-bold text-gray-600 mt-2">
                                        Custo na Obra: <span className="text-[#442685]">{formatCurrency(vehicleDailyValue * vehicleDays)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Alocação de Mão de Obra */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 col-span-2">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2 text-[#442685]">
                                <Users size={20} />
                                <h3 className="font-bold text-lg">Alocação de Mão de Obra</h3>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto rounded-lg border border-gray-100">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50">
                                    <tr className="border-b border-gray-200 text-sm text-gray-500">
                                        <th className="px-4 py-3 font-medium">Colaborador</th>
                                        <th className="px-4 py-3 font-medium">Cargo</th>
                                        <th className="px-4 py-3 font-medium">Custo Dia</th>
                                        <th className="px-4 py-3 font-medium w-32 text-center">Dias Trabalhados</th>
                                        <th className="px-4 py-3 font-medium text-right">Custo na Obra</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {employees.map(emp => {
                                        const costDay = calculateDetailedEmployeeCost(emp).realCost / 22;
                                        const allocation = laborAllocations.find(a => a.employeeId === emp.id);
                                        const daysWorked = allocation ? allocation.daysWorked : 0;
                                        const totalCost = costDay * daysWorked;

                                        return (
                                            <tr key={emp.id} className="text-sm hover:bg-gray-50/50 transition-colors">
                                                <td className="px-4 py-3 font-bold text-gray-800">{emp.name}</td>
                                                <td className="px-4 py-3 text-gray-500">
                                                    <span className="bg-gray-100 px-2 py-1 rounded-md text-xs">{emp.role || 'Sem Cargo'}</span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">{formatCurrency(costDay)}</td>
                                                <td className="px-4 py-3">
                                                    <input 
                                                        type="number"
                                                        value={daysWorked || ''}
                                                        onChange={e => handleAllocationChange(emp.id, e.target.value)}
                                                        placeholder="0"
                                                        min="0"
                                                        className="w-full text-center px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#442685]/20 focus:border-[#442685] outline-none transition-all"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-orange-600">
                                                    {formatCurrency(totalCost)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {employees.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                                Nenhum colaborador cadastrado na aba Equipe.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-[#442685]">Gestão de Projetos</h2>
                <p className="text-gray-500 text-sm">Selecione uma obra para ver o detalhamento do lucro real</p>
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
                        <div 
                            key={stats.id} 
                            onClick={() => setSelectedProject(stats)}
                            className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-[#442685]/30 transition-all group cursor-pointer"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-[#442685]/10 text-[#442685] rounded-lg group-hover:bg-[#442685] group-hover:text-white transition-colors">
                                    <Briefcase size={24} />
                                </div>
                                <h3 className="font-bold text-gray-800 text-lg flex-1 truncate group-hover:text-[#442685] transition-colors">{stats.name}</h3>
                                <div className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 ${
                                    stats.margem > 0 ? 'bg-green-100 text-green-700' : 
                                    stats.margem < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                    <Percent size={14} />
                                    {stats.margem.toFixed(2)}%
                                </div>
                                <div className="text-gray-400 group-hover:text-[#442685] transition-colors">
                                    <ChevronRight size={20} />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-green-50/50 p-2 rounded-lg border border-green-100 text-center">
                                    <div className="text-[10px] font-bold uppercase text-green-600 mb-1">Receita</div>
                                    <div className="font-bold text-green-700 text-sm">{formatCurrency(stats.totalEntradas)}</div>
                                </div>

                                <div className="bg-red-50/50 p-2 rounded-lg border border-red-100 text-center">
                                    <div className="text-[10px] font-bold uppercase text-red-600 mb-1">Custos</div>
                                    <div className="font-bold text-red-700 text-sm" title="Direto + Mão de Obra + Impostos + Indiretos + Ativos">
                                        {formatCurrency(stats.totalSaidas + stats.custoMaoDeObra + stats.impostoEstimado + stats.custosIndiretos + stats.custosAtivos)}
                                    </div>
                                </div>

                                <div className={`p-2 rounded-lg border text-center ${
                                    stats.lucroReal > 0 ? 'bg-blue-50/50 border-blue-100' : 
                                    stats.lucroReal < 0 ? 'bg-orange-50/50 border-orange-100' : 'bg-gray-50/50 border-gray-100'
                                }`}>
                                    <div className={`text-[10px] font-bold uppercase mb-1 ${
                                        stats.lucroReal > 0 ? 'text-blue-600' : 
                                        stats.lucroReal < 0 ? 'text-orange-600' : 'text-gray-600'
                                    }`}>
                                        Lucro Real
                                    </div>
                                    <div className={`font-bold text-sm ${
                                        stats.lucroReal > 0 ? 'text-blue-700' : 
                                        stats.lucroReal < 0 ? 'text-orange-700' : 'text-gray-700'
                                    }`}>
                                        {formatCurrency(stats.lucroReal)}
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
