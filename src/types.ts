export interface Employee {
    id: string;
    name: string;
    role: string; // Cargo
    type: 'CLT' | 'Sócio';
    financials: {
        salary: number; // Base Salary or Pró-labore Bruto
        periculosidade: boolean; // Only for CLT
        transportBenefits: number; // Only for CLT
        mealBenefits: number; // Only for CLT
        otherBenefits: number; // Only for CLT
    };
}
