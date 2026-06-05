
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Employee } from '../types';
import { supabase } from '../lib/supabase';

interface TeamContextType {
    employees: Employee[];
    addEmployee: (employee: Employee) => Promise<void>;
    updateEmployee: (id: string, employee: Partial<Employee>) => Promise<void>;
    removeEmployee: (id: string) => Promise<void>;
    isLoading: boolean;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const TeamProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchEmployees = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase.from('employees').select('*');
                if (error) throw error;

                if (data) {
                    const mapped: Employee[] = data.map(e => ({
                        id: e.id,
                        name: e.name,
                        role: e.role,
                        type: e.type,
                        financials: {
                            salary: e.base_salary ? parseFloat(e.base_salary) : 0,
                            periculosidade: e.benefits_json?.periculosidade === true ? 30 : (Number(e.benefits_json?.periculosidade) || 0),
                            transportBenefits: Number(e.benefits_json?.transportBenefits) || 0,
                            mealBenefits: Number(e.benefits_json?.mealBenefits) || 0,
                            cestaBasica: Number(e.benefits_json?.cestaBasica) || 0,
                            planoDeSaude: Number(e.benefits_json?.planoDeSaude) || 0,
                            internet: Number(e.benefits_json?.internet) || 0,
                            otherBenefits: Number(e.benefits_json?.otherBenefits) || 0,
                        }
                    }));
                    setEmployees(mapped);
                }
            } catch (error) {
                console.error("Error fetching employees:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEmployees();
    }, []);

    const addEmployee = async (employee: Employee) => {
        try {
            const dbPayload = {
                name: employee.name,
                role: employee.role,
                type: employee.type,
                base_salary: employee.financials.salary,
                benefits_json: {
                    periculosidade: employee.financials.periculosidade,
                    transportBenefits: employee.financials.transportBenefits,
                    mealBenefits: employee.financials.mealBenefits,
                    cestaBasica: employee.financials.cestaBasica,
                    planoDeSaude: employee.financials.planoDeSaude,
                    internet: employee.financials.internet,
                    otherBenefits: employee.financials.otherBenefits
                }
            };

            const { data, error } = await supabase.from('employees').insert([dbPayload]).select().single();
            if (error) throw error;

            if (data) {
                setEmployees(prev => [...prev, {
                    id: data.id,
                    name: data.name,
                    role: data.role,
                    type: data.type,
                    financials: {
                        salary: data.base_salary ? parseFloat(data.base_salary) : 0,
                        periculosidade: data.benefits_json?.periculosidade === true ? 30 : (Number(data.benefits_json?.periculosidade) || 0),
                        transportBenefits: Number(data.benefits_json?.transportBenefits) || 0,
                        mealBenefits: Number(data.benefits_json?.mealBenefits) || 0,
                        cestaBasica: Number(data.benefits_json?.cestaBasica) || 0,
                        planoDeSaude: Number(data.benefits_json?.planoDeSaude) || 0,
                        internet: Number(data.benefits_json?.internet) || 0,
                        otherBenefits: Number(data.benefits_json?.otherBenefits) || 0,
                    }
                }]);
            }
        } catch (error) {
            console.error("Error adding employee:", error);
        }
    };

    const updateEmployee = async (id: string, updates: Partial<Employee>) => {
        try {
            // We need to merge financials carefully
            // Since updates might be partial, we might need the current employee state to merge JSON correctly
            // For simplicity, let's assume we update what we have. 
            // Ideally updates.financials is a partial of financials.

            // Construct the payload.
            const dbUpdates: any = {};
            if (updates.name) dbUpdates.name = updates.name;
            if (updates.role) dbUpdates.role = updates.role;
            if (updates.type) dbUpdates.type = updates.type;

            if (updates.financials) {
                // Warning: This replaces the JSON if we are not careful.
                // We should probably merge in the app or fetch current first?
                // But in the context, we have `employees` state.
                const current = employees.find(e => e.id === id);
                if (current) {
                    const newFinancials = { ...current.financials, ...updates.financials };
                    dbUpdates.base_salary = newFinancials.salary;
                    dbUpdates.benefits_json = {
                        periculosidade: newFinancials.periculosidade,
                        transportBenefits: newFinancials.transportBenefits,
                        mealBenefits: newFinancials.mealBenefits,
                        cestaBasica: newFinancials.cestaBasica,
                        planoDeSaude: newFinancials.planoDeSaude,
                        internet: newFinancials.internet,
                        otherBenefits: newFinancials.otherBenefits
                    };
                }
            }

            const { error } = await supabase.from('employees').update(dbUpdates).eq('id', id);
            if (error) throw error;

            setEmployees(prev => prev.map(emp => {
                if (emp.id === id) {
                    // Merge carefully for local state too
                    const newFinancials = updates.financials
                        ? { ...emp.financials, ...updates.financials }
                        : emp.financials;
                    return { ...emp, ...updates, financials: newFinancials };
                }
                return emp;
            }));

        } catch (error) {
            console.error("Error updating employee:", error);
        }
    };

    const removeEmployee = async (id: string) => {
        try {
            const { error } = await supabase.from('employees').delete().eq('id', id);
            if (error) throw error;
            setEmployees(prev => prev.filter(emp => emp.id !== id));
        } catch (error) {
            console.error("Error removing employee:", error);
        }
    };

    return (
        <TeamContext.Provider value={{ employees, addEmployee, updateEmployee, removeEmployee, isLoading }}>
            {children}
        </TeamContext.Provider>
    );
};

export const useTeam = () => {
    const context = useContext(TeamContext);
    if (context === undefined) {
        throw new Error('useTeam must be used within a TeamProvider');
    }
    return context;
};
