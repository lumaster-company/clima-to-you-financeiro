import { useState } from 'react';
import { Search, Plus, Briefcase, Pencil, Trash2, X } from 'lucide-react';
import { useFinance, type Project } from '../context/FinanceContext';

const Projetos = () => {
    const { projects, addProject, updateProject, removeProject } = useFinance();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [projectName, setProjectName] = useState('');
    const [projectDate, setProjectDate] = useState('');

    const filteredProjects = projects.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenModal = (project?: Project) => {
        if (project) {
            setEditingProject(project);
            setProjectName(project.name);
            setProjectDate(project.closingDate || '');
        } else {
            setEditingProject(null);
            setProjectName('');
            setProjectDate('');
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProject(null);
        setProjectName('');
        setProjectDate('');
    };

    const handleSave = async () => {
        if (!projectName.trim()) return;

        if (editingProject) {
            await updateProject(editingProject.id, projectName, projectDate || undefined);
        } else {
            await addProject(projectName, projectDate || undefined);
        }
        handleCloseModal();
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta obra?')) {
            await removeProject(id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-[#442685]">Projetos</h2>
                <button 
                    onClick={() => handleOpenModal()}
                    className="bg-[#DD3728] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#c22e20] transition-colors shadow-md font-medium"
                >
                    <Plus size={20} />
                    Nova Obra
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar obras..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#442685]/20 focus:border-[#442685] outline-none text-sm transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    {filteredProjects.map((project) => (
                        <div key={project.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between min-h-[120px]">
                            <div className="flex items-start justify-between mb-2">
                                <div className="p-2 bg-[#442685]/10 text-[#442685] rounded-lg">
                                    <Briefcase size={20} />
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleOpenModal(project)}
                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Editar"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(project.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg line-clamp-2 leading-tight">{project.name}</h3>
                                {project.closingDate && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        Fechamento: {new Date(project.closingDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {filteredProjects.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-500">
                            Nenhuma obra encontrada.
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Criação/Edição */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-900">
                                    {editingProject ? 'Editar Obra' : 'Nova Obra'}
                                </h3>
                                <button 
                                    onClick={handleCloseModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nome da Obra
                                    </label>
                                    <input
                                        type="text"
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                        placeholder="Ex: Obra Maurício"
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#442685]/20 focus:border-[#442685] outline-none"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Data de Fechamento
                                    </label>
                                    <input
                                        type="date"
                                        value={projectDate}
                                        onChange={(e) => setProjectDate(e.target.value)}
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#442685]/20 focus:border-[#442685] outline-none text-gray-700"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={handleCloseModal}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!projectName.trim()}
                                className="px-4 py-2 text-sm font-medium bg-[#442685] text-white rounded-lg hover:bg-[#341d66] transition-colors disabled:opacity-50"
                            >
                                Salvar Obra
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Projetos;
