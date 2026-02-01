import { useState } from 'react';
import { Search, Plus } from 'lucide-react';

const Clientes = () => {
    // Mock data for MVP
    const [clients] = useState([
        { id: 1, name: 'Empresa ABC Ltda', contact: 'Carlos', phone: '(11) 99999-9999', email: 'contato@abc.com' },
        { id: 2, name: 'Condomínio Solar', contact: 'Síndica Maria', phone: '(11) 88888-8888', email: 'adm@solar.com' },
    ]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Clientes</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors">
                    <Plus size={20} />
                    Novo Cliente
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar clientes..."
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                        />
                    </div>
                </div>

                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                        <tr>
                            <th className="px-6 py-4">Nome / Razão Social</th>
                            <th className="px-6 py-4">Contato</th>
                            <th className="px-6 py-4">Telefone</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {clients.map((client) => (
                            <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900">{client.name}</td>
                                <td className="px-6 py-4">{client.contact}</td>
                                <td className="px-6 py-4">{client.phone}</td>
                                <td className="px-6 py-4">{client.email}</td>
                                <td className="px-6 py-4 text-center">
                                    <button className="text-blue-600 hover:underline font-medium">Editar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Clientes;
