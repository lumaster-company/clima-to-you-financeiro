import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export interface WorkingCapitalAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
}

export interface WorkingCapitalTransfer {
  id: string;
  type: 'Aporte' | 'Resgate' | 'Transferência';
  amount: number;
  reason?: string;
  origin_account_id?: string;
  destination_account_id?: string;
  date: string;
}

interface CapitalGiroContextType {
  accounts: WorkingCapitalAccount[];
  transfers: WorkingCapitalTransfer[];
  globalGoal: number;
  isLoading: boolean;
  addAccount: (name: string, type: string, initialBalance?: number) => Promise<void>;
  updateAccount: (id: string, updates: Partial<WorkingCapitalAccount>) => Promise<void>;
  registerTransfer: (transfer: Omit<WorkingCapitalTransfer, 'id'>) => Promise<void>;
  updateGlobalGoal: (goal: number) => Promise<void>;
}

const CapitalGiroContext = createContext<CapitalGiroContextType | undefined>(undefined);

export const CapitalGiroProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<WorkingCapitalAccount[]>([]);
  const [transfers, setTransfers] = useState<WorkingCapitalTransfer[]>([]);
  const [globalGoal, setGlobalGoal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: accData, error: accError } = await supabase.from('financial_accounts').select('*');
        if (accError) throw accError;
        if (accData) setAccounts(accData.map(a => ({ id: a.id, name: a.name, type: a.type, balance: parseFloat(a.balance) })));

        const { data: transData, error: transError } = await supabase.from('financial_transfers').select('*').order('date', { ascending: false }).order('created_at', { ascending: false });
        if (transError) throw transError;
        if (transData) setTransfers(transData.map(t => ({ id: t.id, type: t.type, amount: parseFloat(t.amount), reason: t.reason, origin_account_id: t.origin_account_id, destination_account_id: t.destination_account_id, date: t.date })));

        const { data: setData, error: setError } = await supabase.from('financial_settings').select('*').limit(1).maybeSingle();
        if (setError && setError.code !== 'PGRST116') throw setError; 
        if (setData) setGlobalGoal(parseFloat(setData.global_goal));
      } catch (error) {
        console.error('Error fetching working capital data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const addAccount = async (name: string, type: string, initialBalance: number = 0) => {
    try {
      const { data, error } = await supabase.from('financial_accounts').insert([{ name, type, balance: initialBalance }]).select().single();
      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }
      if (data) {
        setAccounts(prev => [...prev, { id: data.id, name: data.name, type: data.type, balance: parseFloat(data.balance) }]);
      }
    } catch (e: any) {
      console.error("addAccount failed:", e.message || e);
      throw e;
    }
  };

  const updateAccount = async (id: string, updates: Partial<WorkingCapitalAccount>) => {
    try {
      const { error } = await supabase.from('financial_accounts').update(updates).eq('id', id);
      if (error) throw error;
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    } catch (e) {
      console.error(e);
    }
  };

  const registerTransfer = async (transfer: Omit<WorkingCapitalTransfer, 'id'>) => {
    try {
      const { data, error } = await supabase.from('financial_transfers').insert([transfer]).select().single();
      if (error) {
        console.error("Supabase insert error (transfer):", error);
        throw error;
      }

      if (data) {
        setTransfers(prev => [{ id: data.id, type: data.type, amount: parseFloat(data.amount), reason: data.reason, origin_account_id: data.origin_account_id, destination_account_id: data.destination_account_id, date: data.date }, ...prev]);
        
        let newAccounts = [...accounts];
        
        if (transfer.origin_account_id) {
          const accIndex = newAccounts.findIndex(a => a.id === transfer.origin_account_id);
          if (accIndex !== -1) {
            const newBal = newAccounts[accIndex].balance - transfer.amount;
            await supabase.from('financial_accounts').update({ balance: newBal }).eq('id', transfer.origin_account_id);
            newAccounts[accIndex] = { ...newAccounts[accIndex], balance: newBal };
          }
        }
        if (transfer.destination_account_id) {
          const accIndex = newAccounts.findIndex(a => a.id === transfer.destination_account_id);
          if (accIndex !== -1) {
            const newBal = newAccounts[accIndex].balance + transfer.amount;
            await supabase.from('financial_accounts').update({ balance: newBal }).eq('id', transfer.destination_account_id);
            newAccounts[accIndex] = { ...newAccounts[accIndex], balance: newBal };
          }
        }
        
        setAccounts(newAccounts);
      }
    } catch (e: any) {
      console.error("registerTransfer failed:", e.message || e);
      throw e;
    }
  };

  const updateGlobalGoal = async (goal: number) => {
    try {
      const { data: currentData } = await supabase.from('financial_settings').select('id').limit(1).maybeSingle();
      if (currentData) {
        await supabase.from('financial_settings').update({ global_goal: goal }).eq('id', currentData.id);
      } else {
        await supabase.from('financial_settings').insert([{ global_goal: goal }]);
      }
      setGlobalGoal(goal);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <CapitalGiroContext.Provider value={{ accounts, transfers, globalGoal, isLoading, addAccount, updateAccount, registerTransfer, updateGlobalGoal }}>
      {children}
    </CapitalGiroContext.Provider>
  );
};

export const useCapitalGiro = () => {
  const context = useContext(CapitalGiroContext);
  if (context === undefined) {
    throw new Error('useCapitalGiro must be used within a CapitalGiroProvider');
  }
  return context;
};
