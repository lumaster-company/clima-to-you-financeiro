import React, { useState } from 'react';
import { X, Upload, FileJson, AlertCircle, CheckCircle } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import type { Transaction } from '../../context/FinanceContext';

interface HistoryImportProps {
    onClose: () => void;
}

const HistoryImport: React.FC<HistoryImportProps> = ({ onClose }) => {
    const { importTransactions } = useFinance();
    const [csvContent, setCsvContent] = useState('');
    const [preview, setPreview] = useState<Omit<Transaction, 'id'>[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            setCsvContent(content);
            parseCSV(content);
        };
        reader.readAsText(file);
    };

    const parseCSV = (content: string) => {
        try {
            const lines = content.trim().split('\n');
            const parsedTransactions: Omit<Transaction, 'id'>[] = [];

            lines.forEach((line, index) => {
                if (index === 0 && line.toLowerCase().includes('year')) return; // Skip header
                if (!line.trim()) return;

                const parts = line.split(',');
                // Expected format: year,month,type,value,category (optional)
                // Actually user said: year, month, type (entrada/saida), value

                if (parts.length < 4) return;

                const year = parts[0].trim();
                const month = parts[1].trim().padStart(2, '0');
                const typeRaw = parts[2].trim().toLowerCase();
                const valueRaw = parts[3].trim();
                const category = parts[4]?.trim() || "Histórico Financeiro";

                let type: 'income' | 'expense' = 'income';
                if (typeRaw.includes('saida') || typeRaw.includes('saída') || typeRaw.includes('expense')) {
                    type = 'expense';
                }

                // Assume last day of month or 15th? Let's say 05.
                const date = `${year}-${month}-05`;

                parsedTransactions.push({
                    description: `Histórico ${month}/${year}`,
                    amount: parseFloat(valueRaw),
                    type,
                    date,
                    category,
                    status: 'paid', // Historical data is assumed paid
                    hasInvoice: false,
                });
            });

            setPreview(parsedTransactions);
            setError(null);
        } catch (err) {
            setError('Erro ao processar CSV. Verifique o formato.');
            setPreview([]);
        }
    };

    const handleImport = () => {
        if (preview.length === 0) return;
        importTransactions(preview);
        setSuccess(true);
        setTimeout(() => {
            onClose();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Upload size={20} className="text-indigo-600" />
                        Importar Histórico Financeiro
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {!success ? (
                        <>
                            <div className="bg-blue-50 p-4 rounded-lg flex gap-3 text-blue-700 text-sm">
                                <AlertCircle size={20} className="shrink-0" />
                                <div>
                                    <p className="font-semibold mb-1">Formato CSV Esperado:</p>
                                    <code className="bg-blue-100 px-2 py-0.5 rounded">ano,mes,tipo,valor,categoria(opcional)</code>
                                    <p className="mt-2 text-xs opacity-80">Exemplo: 2024,05,entrada,15000</p>
                                </div>
                            </div>

                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors bg-gray-50">
                                <input
                                    type="file"
                                    accept=".csv,.txt"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="csv-upload"
                                />
                                <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center gap-3">
                                    <div className="p-4 bg-white rounded-full shadow-sm">
                                        <FileJson size={32} className="text-indigo-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-700">Clique para selecionar arquivo CSV</p>
                                        <p className="text-sm text-gray-400 mt-1">ou cole o texto abaixo</p>
                                    </div>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">Cole o conteúdo CSV aqui (opcional)</label>
                                <textarea
                                    className="w-full h-32 p-3 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder={`2024,01,entrada,5000\n2024,02,saida,2000`}
                                    value={csvContent}
                                    onChange={(e) => {
                                        setCsvContent(e.target.value);
                                        parseCSV(e.target.value);
                                    }}
                                />
                            </div>

                            {preview.length > 0 && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm font-medium text-gray-700 mb-2 flex justify-between">
                                        <span>Pré-visualização</span>
                                        <span className="text-indigo-600">{preview.length} registros encontrados</span>
                                    </p>
                                    <div className="max-h-40 overflow-y-auto space-y-1">
                                        {preview.map((t, i) => (
                                            <div key={i} className="text-xs flex justify-between p-2 bg-white border border-gray-100 rounded">
                                                <span>{t.date} - {t.description}</span>
                                                <span className={t.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                                                    {t.type === 'income' ? '+' : '-'} R$ {t.amount}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {error && (
                                <p className="text-sm text-red-500 flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    {error}
                                </p>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={preview.length === 0}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                                >
                                    <Upload size={18} />
                                    Confirmar Importação
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="py-12 flex flex-col items-center text-center animate-in zoom-in duration-300">
                            <div className="p-4 bg-green-100 rounded-full text-green-600 mb-4">
                                <CheckCircle size={48} />
                            </div>
                            <h4 className="text-xl font-bold text-gray-800">Importação Concluída!</h4>
                            <p className="text-gray-500 mt-2">Os registros foram adicionados com sucesso.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryImport;
