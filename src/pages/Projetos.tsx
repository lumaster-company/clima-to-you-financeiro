import { useState } from 'react';
import { Search, Plus, Briefcase } from 'lucide-react';

const Projetos = () => {
    const [projects] = useState([
        { id: 1, name: 'Instalação VRF - Edifício H', client: 'Empresa ABC', status: 'Em Andamento', value: 45000 },
        { id: 2, name: 'Manutenção Split - Sala 4', client: 'Condomínio Solar', status: 'Concluído', value: 1200 },
    ]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Projetos</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors">
                    <Plus size={20} />
                    Novo Projeto
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar projetos..."
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    {projects.map((project) => (
                        <div key={project.id} className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <Briefcase size={20} />
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${project.status === 'Concluído' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                                    }`}>
                                    {project.status}
                                </span>
                            </div>
                            <h3 className="font-bold text-gray-800">{project.name}</h3>
                            <p className="text-sm text-gray-500 mb-3">{project.client}</p>
                            <p className="font-semibold text-gray-900">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(project.value)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Projetos;
