import { useFinance } from '../../context/FinanceContext';
import { FileText, Calendar } from 'lucide-react';

const TaxPredictionCard = () => {
    const { transactions } = useFinance();

    // 1. Determine Current Competence (Month/Year)
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();

    // 2. Filter transactions for the CURRENT calendar month that have invoices
    const currentMonthTransactions = transactions.filter(t => {
        // Fix timezone issue by using local date parts if string is YYYY-MM-DD
        // The date string from input is usually YYYY-MM-DD. 
        // Let's rely on simple string parsing to be safe and avoid timezone shifts
        const [tYear, tMonth] = t.date.split('-').map(Number);

        // tMonth is 1-12, currentMonth is 0-11. So tMonth - 1 === currentMonth
        const isSameMonth = (tMonth - 1) === currentMonth;
        const isSameYear = tYear === currentYear;

        return isSameMonth && isSameYear && t.hasInvoice && t.type === 'income';
    });

    // 3. Sum up the taxAmount
    const totalTax = currentMonthTransactions.reduce((acc, curr) => acc + (curr.taxAmount || 0), 0);

    // 4. Determine Due Date (20th of NEXT month)
    // If we are in Jan (0), next month is Feb (1).
    const nextMonthDate = new Date(currentYear, currentMonth + 1, 20);
    const dueDateStr = nextMonthDate.toLocaleDateString('pt-BR');

    // Get Month Name for display
    const monthName = now.toLocaleString('pt-BR', { month: 'long' });
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    return (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 p-4 opacity-10">
                <FileText size={120} />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 opacity-90">
                    <FileText size={20} />
                    <h3 className="font-semibold text-lg">Previsão DAS ({capitalize(monthName)})</h3>
                </div>

                <div className="flex flex-col gap-1 mb-4">
                    <span className="text-3xl font-bold tracking-tight">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalTax)}
                    </span>
                    <span className="text-sm opacity-80 font-medium">
                        Referente a {currentMonthTransactions.length} notas emitidas este mês
                    </span>
                </div>

                <div className="flex items-center gap-2 bg-white/20 w-fit px-3 py-1.5 rounded-lg text-sm backdrop-blur-sm">
                    <Calendar size={16} />
                    <span className="font-medium">Vencimento: {dueDateStr}</span>
                </div>
            </div>
        </div>
    );
};

export default TaxPredictionCard;
