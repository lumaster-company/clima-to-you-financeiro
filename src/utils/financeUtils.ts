import type { Employee } from '../types';

export const generateUUID = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for environments without crypto.randomUUID (e.g. older browsers / non-secure contexts)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const calculateDetailedEmployeeCost = (emp: Employee) => {
    const financials = emp.financials || {
        salary: 0,
        periculosidade: 0,
        transportBenefits: 0,
        mealBenefits: 0,
        cestaBasica: 0,
        planoDeSaude: 0,
        internet: 0,
        otherBenefits: 0
    };

    const baseSalary = financials.salary || 0;

    if (emp.type === 'Sócio') {
        const inss = baseSalary * 0.11;
        return {
            monthlyCash: baseSalary, // Same as cost for partner
            realCost: baseSalary,
            details: {
                inss,
                totalRemuneration: baseSalary // Added for consistency
            }
        };
    }

    // CLT Logic

    // 1. Base Remuneration
    const periculosidadePerc = financials.periculosidade || 0;
    const periculosidadeValue = baseSalary * (periculosidadePerc / 100);
    const baseDeCalculo = baseSalary + periculosidadeValue;

    // 2. Monthly Cash Flow (Saída Mensal)
    const bonuses = financials.bonuses || 0;
    const vtDiscountValue = financials.vtDiscount ? baseDeCalculo * 0.06 : 0;
    
    // Transporte com desconto (pode ser negativo, o que reduz o líquido pago)
    const transportCost = (financials.transportBenefits || 0) - vtDiscountValue;
    const transportFull = financials.transportBenefits || 0;

    const benefitsWithoutTransport = (financials.mealBenefits || 0) + 
                     (financials.cestaBasica || 0) + 
                     (financials.planoDeSaude || 0) + 
                     (financials.internet || 0) +
                     (financials.otherBenefits || 0) +
                     bonuses;

    const monthlyCash = baseDeCalculo + benefitsWithoutTransport + transportCost;

    // 3. Real Cost (Custo Total p/ Empresa com provisão para rescisão)
    // Formula: (Base de Cálculo * 1.8) + (Soma dos Benefícios sem desconto de VT)
    const realCost = (baseDeCalculo * 1.8) + benefitsWithoutTransport + transportFull;

    const benefits = benefitsWithoutTransport + transportFull; // Used for returning in details

    const fgtsMonthly = baseDeCalculo * 0.08; // 8% de FGTS sobre a base de cálculo
    const totalProvisions = baseDeCalculo * 0.8; // 80% de provisões/encargos adicionais da base de cálculo (multiplicador 1.8)

    return {
        monthlyCash,
        realCost,
        details: {
            baseDeCalculo,
            totalRemuneration: baseDeCalculo,
            benefits,
            fgtsMonthly,
            totalProvisions
        }
    };
};
