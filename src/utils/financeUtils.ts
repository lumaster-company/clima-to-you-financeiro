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
        periculosidade: false,
        transportBenefits: 0,
        mealBenefits: 0,
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

    // CLT Logic (Simples Nacional - Pessimistic/Termination Scenario)

    // 1. Base Remuneration
    const periculosidadeValue = financials.periculosidade ? baseSalary * 0.30 : 0;
    const totalRemuneration = baseSalary + periculosidadeValue; // Base for FGTS and Provisions

    // 2. Monthly Cash Flow (Saída Mensal)
    const fgtsMonthly = totalRemuneration * 0.08;
    const benefits = (financials.transportBenefits || 0) + (financials.mealBenefits || 0) + (financials.otherBenefits || 0);

    const monthlyCash = totalRemuneration + benefits + fgtsMonthly;

    // 3. Termination Provisions (Future Liabilities)
    const provisionVacation = totalRemuneration * 0.1111; // 11.11% (Vacation + 1/3)
    const provision13th = totalRemuneration * 0.0833;     // 8.33% (13th Salary)
    const provisionNotice = totalRemuneration * 0.0833;   // 8.33% (Indemnified Notice)
    const provisionFgtsFine = totalRemuneration * 0.0400; // 4.00% (40% Fine on deposits)
    const provisionFgtsOnProv = totalRemuneration * 0.0200; // 2.00% (FGTS on Provisions)

    const totalProvisions = provisionVacation + provision13th + provisionNotice + provisionFgtsFine + provisionFgtsOnProv;

    // 4. Real Cost (Custo Total)
    const realCost = monthlyCash + totalProvisions;

    return {
        monthlyCash,
        realCost,
        details: {
            totalRemuneration,
            benefits,
            fgtsMonthly,
            totalProvisions
        }
    };
};
