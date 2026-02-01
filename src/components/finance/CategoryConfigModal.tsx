import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Check } from 'lucide-react';
import { useFinance, type TransactionType } from '../../context/FinanceContext';

interface CategoryConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: TransactionType;
}

const CategoryConfigModal: React.FC<CategoryConfigModalProps> = ({ isOpen, onClose, type }) => {
    const {
        incomeCategories,
        expenseCategories,
        addCategory,
        removeCategory,
        updateCategory
    } = useFinance();

    const [newCategory, setNewCategory] = useState('');
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const categories = type === 'income' ? incomeCategories : expenseCategories;
    const title = type === 'income' ? 'Categorias de Receita' : 'Categorias de Despesa';
    const colorClass = type === 'income' ? 'text-green-600' : 'text-red-600';
    // bgClass removed as it was unused
    const buttonClass = type === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700';

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCategory.trim()) {
            addCategory(type, newCategory.trim());
            setNewCategory('');
        }
    };

    const handleStartEdit = (cat: string) => {
        setEditingCategory(cat);
        setEditValue(cat);
    };

    const handleSaveEdit = () => {
        if (editingCategory && editValue.trim() && editValue.trim() !== editingCategory) {
            updateCategory(type, editingCategory, editValue.trim());
        }
        setEditingCategory(null);
        setEditValue('');
    };

    const handleDelete = (cat: string) => {
        if (confirm(`Tem certeza que deseja remover a categoria "${cat}"?`)) {
            removeCategory(type, cat);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className={`text-lg font-bold ${colorClass}`}>
                        {title}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Add New */}
                    <form onSubmit={handleAdd} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Nova Categoria..."
                            className="flex-1 rounded-lg border-gray-200 border p-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={!newCategory.trim()}
                            className={`p-2 rounded-lg text-white transition-colors disabled:opacity-50 ${buttonClass}`}
                        >
                            <Plus size={20} />
                        </button>
                    </form>

                    {/* List */}
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {categories.map((cat) => (
                            <div key={cat} className="flex items-center justify-between p-2 rounded-lg group hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
                                {editingCategory === cat ? (
                                    <div className="flex items-center gap-2 flex-1">
                                        <input
                                            type="text"
                                            className="flex-1 p-1 text-sm border rounded border-blue-300 outline-none"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveEdit();
                                                if (e.key === 'Escape') setEditingCategory(null);
                                            }}
                                        />
                                        <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-700 p-1">
                                            <Check size={16} />
                                        </button>
                                        <button onClick={() => setEditingCategory(null)} className="text-red-500 hover:text-red-600 p-1">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${type === 'income' ? 'bg-green-400' : 'bg-red-400'}`}></span>
                                            <span className="text-sm text-gray-700 font-medium">{cat}</span>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleStartEdit(cat)}
                                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cat)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryConfigModal;
