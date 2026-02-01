import { useFinance } from '../../context/FinanceContext';
import { AlertCircle, Calendar, Clock, TrendingUp } from 'lucide-react';

import clsx from 'clsx';
import { getTodayString, addDaysStr } from '../../utils/dateUtils';

const FinanceSummary = () => {
    const { filteredTransactions: transactions, balance } = useFinance();

    const today = getTodayString();
    const next7DaysStr = addDaysStr(today, 7);

    // Logic: Overdue (Red) - Status 'pending' AND date < today AND Type 'expense'
    const overdueAmount = transactions
        .filter(t => t.type === 'expense' && t.status === 'pending' && t.date < today)
        .reduce((acc, curr) => acc + curr.amount, 0);

    // Logic: Due Today (Yellow) - Status 'pending' AND date === today AND Type 'expense'
    const dueTodayAmount = transactions
        .filter(t => t.type === 'expense' && t.status === 'pending' && t.date === today)
        .reduce((acc, curr) => acc + curr.amount, 0);

    // Logic: Due Soon (Blue) - Status 'pending' AND date > today AND date <= next7Days AND Type 'expense'
    const dueSoonAmount = transactions
        .filter(t => t.type === 'expense' && t.status === 'pending' && t.date > today && t.date <= next7DaysStr)
        .reduce((acc, curr) => acc + curr.amount, 0);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const Card = ({ title, value, color, icon: Icon }: any) => (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                <h3 className={clsx("text-2xl font-bold", color)}>{formatCurrency(value)}</h3>
            </div>
            <div className={clsx("p-2 rounded-lg bg-opacity-10", color.replace('text-', 'bg-'))}>
                <Icon size={24} className={color} />
            </div>
        </div>
    );

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card
                    title="Contas em Atraso"
                    value={overdueAmount}
                    color="text-red-600"
                    icon={AlertCircle}
                />
                <Card
                    title="Vence Hoje"
                    value={dueTodayAmount}
                    color="text-yellow-600"
                    icon={Calendar}
                />
                <Card
                    title="A Vencer (7 dias)"
                    value={dueSoonAmount}
                    color="text-blue-600"
                    icon={Clock}
                />
                <Card
                    title="Saldo em Caixa"
                    value={balance}
                    color={balance >= 0 ? "text-green-600" : "text-red-600"}
                    icon={TrendingUp}
                />
            </div>


        </>
    );
};

export default FinanceSummary;
