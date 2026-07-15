export interface Employee {
    id: string;
    name: string;
    role: string; // Cargo
    type: 'CLT' | 'Sócio';
    financials: {
        salary: number; // Base Salary or Pró-labore Bruto
        periculosidade: number; // Percentage (0, 5, 10, 15, 20, 25, 30)
        transportBenefits: number; // Only for CLT
        mealBenefits: number; // Only for CLT
        cestaBasica: number;
        planoDeSaude: number;
        internet: number;
        otherBenefits?: number; // legacy
        vtDiscount?: boolean;
        bonuses?: number;
        lucroRetirada?: number;
    };
}
