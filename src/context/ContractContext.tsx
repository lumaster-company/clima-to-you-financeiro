
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export type ContractType = 'PMOC' | 'Manutenção' | 'Outro';
export type BillingFrequency = 'Mensal' | 'Bimestral' | 'Trimestral' | 'Semestral' | 'Anual';
export type ContractStatus = 'Ativo' | 'Encerrado' | 'Perdido';
export type ClientType = 'Comercial' | 'Residencial';

export interface Contract {
    id: string;
    clientName: string;
    cnpj: string;
    type: ContractType;
    clientType: ClientType;
    value: number;
    billingFrequency: BillingFrequency;
    startDate: string;
    endDate?: string;
    durationMonths: 12 | 24;
    status: ContractStatus;
}

interface ContractContextType {
    contracts: Contract[];
    addContract: (contract: Omit<Contract, 'id'>) => Promise<void>;
    updateContract: (id: string, updates: Partial<Contract>) => Promise<void>;
    removeContract: (id: string) => Promise<void>;
    getMRR: () => number;
    getActiveContractsCount: () => number;
    isLoading: boolean;
}

const ContractContext = createContext<ContractContextType | undefined>(undefined);

export const ContractProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchContracts = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase.from('contracts').select('*');
                if (error) throw error;

                if (data) {
                    const mapped: Contract[] = data.map(c => ({
                        id: c.id,
                        clientName: c.client_name,
                        cnpj: c.cnpj,
                        type: c.type,
                        clientType: c.client_type,
                        value: parseFloat(c.value),
                        billingFrequency: c.billing_frequency,
                        startDate: c.start_date,
                        endDate: c.end_date,
                        durationMonths: c.duration_months,
                        status: c.status
                    }));
                    setContracts(mapped);
                }
            } catch (error) {
                console.error("Error fetching contracts:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchContracts();
    }, []);

    const calculateMonthlyValue = (value: number, frequency: BillingFrequency): number => {
        switch (frequency) {
            case 'Mensal': return value;
            case 'Bimestral': return value / 2;
            case 'Trimestral': return value / 3;
            case 'Semestral': return value / 6;
            case 'Anual': return value / 12;
            default: return value;
        }
    };

    const getMRR = () => {
        return contracts
            .filter(c => c.status === 'Ativo')
            .reduce((acc, curr) => acc + calculateMonthlyValue(curr.value, curr.billingFrequency), 0);
    };

    const getActiveContractsCount = () => {
        return contracts.filter(c => c.status === 'Ativo').length;
    };

    const addContract = async (contractData: Omit<Contract, 'id'>) => {
        try {
            const dbPayload = {
                client_name: contractData.clientName,
                cnpj: contractData.cnpj,
                type: contractData.type,
                client_type: contractData.clientType,
                value: contractData.value,
                billing_frequency: contractData.billingFrequency,
                start_date: contractData.startDate,
                end_date: contractData.endDate,
                duration_months: contractData.durationMonths,
                status: contractData.status
            };

            const { data, error } = await supabase.from('contracts').insert([dbPayload]).select().single();
            if (error) throw error;

            if (data) {
                const newContract: Contract = {
                    id: data.id,
                    clientName: data.client_name,
                    cnpj: data.cnpj,
                    type: data.type,
                    clientType: data.client_type,
                    value: parseFloat(data.value),
                    billingFrequency: data.billing_frequency,
                    startDate: data.start_date,
                    endDate: data.end_date,
                    durationMonths: data.duration_months,
                    status: data.status
                };

                setContracts(prev => [...prev, newContract]);
            }
        } catch (error) {
            console.error("Error adding contract:", error);
        }
    };

    const updateContract = async (id: string, updates: Partial<Contract>) => {
        try {
            const dbUpdates: any = {};
            if (updates.clientName) dbUpdates.client_name = updates.clientName;
            if (updates.cnpj) dbUpdates.cnpj = updates.cnpj;
            if (updates.type) dbUpdates.type = updates.type;
            if (updates.clientType) dbUpdates.client_type = updates.clientType;
            if (updates.value) dbUpdates.value = updates.value;
            if (updates.billingFrequency) dbUpdates.billing_frequency = updates.billingFrequency;
            if (updates.startDate) dbUpdates.start_date = updates.startDate;
            if (updates.endDate) dbUpdates.end_date = updates.endDate;
            if (updates.durationMonths) dbUpdates.duration_months = updates.durationMonths;
            if (updates.status) dbUpdates.status = updates.status;

            const { error } = await supabase.from('contracts').update(dbUpdates).eq('id', id);
            if (error) throw error;

            setContracts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
        } catch (error) {
            console.error("Error updating contract:", error);
        }
    };

    const removeContract = async (id: string) => {
        if (confirm('Deseja realmente excluir este contrato?')) {
            try {
                const { error } = await supabase.from('contracts').delete().eq('id', id);
                if (error) throw error;
                setContracts(prev => prev.filter(c => c.id !== id));
            } catch (error) {
                console.error("Error removing contract:", error);
            }
        }
    };

    return (
        <ContractContext.Provider value={{
            contracts,
            addContract,
            updateContract,
            removeContract,
            getMRR,
            getActiveContractsCount,
            isLoading
        }}>
            {children}
        </ContractContext.Provider>
    );
};

export const useContracts = () => {
    const context = useContext(ContractContext);
    if (context === undefined) {
        throw new Error('useContracts must be used within a ContractProvider');
    }
    return context;
};
