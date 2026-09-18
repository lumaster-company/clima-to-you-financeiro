import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

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
  transfer_date: string;
}

interface CapitalGiroContextType {
  accounts: WorkingCapitalAccount[];
  transfers: WorkingCapitalTransfer[];
  globalGoal: number;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  addAccount: (name: string, type: string, initialBalance?: number) => Promise<void>;
  updateAccount: (id: string, updates: Partial<WorkingCapitalAccount>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  registerTransfer: (transfer: Omit<WorkingCapitalTransfer, 'id'>) => Promise<void>;
  updateTransfer: (id: string, updates: Partial<WorkingCapitalTransfer>) => Promise<void>;
  deleteTransfer: (id: string) => Promise<void>;
  updateGlobalGoal: (goal: number) => Promise<void>;
}

const CapitalGiroContext = createContext<CapitalGiroContextType | undefined>(undefined);

export const CapitalGiroProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  const [accounts, setAccounts] = useState<WorkingCapitalAccount[]>([]);
  const [transfers, setTransfers] = useState<WorkingCapitalTransfer[]>([]);
  const [globalGoal, setGlobalGoal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Authoritative server fetch
  const fetchData = useCallback(async () => {
    try {
      // 1. Fetch Accounts with deterministic ordering
      const { data: accData, error: accError } = await supabase
        .from('financial_accounts')
        .select('*')
        .order('created_at', { ascending: true });

      if (accError) throw accError;
      if (accData) {
        setAccounts(accData.map(a => ({
          id: a.id,
          name: a.name,
          type: a.type,
          balance: Number(Number(a.balance).toFixed(2)) || 0
        })));
      }

      // 2. Fetch Transfers ordered by transfer_date and created_at
      const { data: transData, error: transError } = await supabase
        .from('financial_transfers')
        .select('*')
        .order('transfer_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (transError) throw transError;
      if (transData) {
        setTransfers(transData.map(t => ({
          id: t.id,
          type: t.type,
          amount: Number(Number(t.amount).toFixed(2)) || 0,
          reason: t.reason,
          origin_account_id: t.origin_account_id,
          destination_account_id: t.destination_account_id,
          transfer_date: t.transfer_date
        })));
      }

      // 3. Fetch Global Goal Settings
      const { data: setData, error: setError } = await supabase
        .from('financial_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (setError && setError.code !== 'PGRST116') throw setError;
      if (setData && setData.global_goal !== undefined) {
        setGlobalGoal(Number(Number(setData.global_goal).toFixed(2)) || 0);
      }
    } catch (error) {
      console.error('Error fetching working capital data from Supabase:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 1. Trigger fetch on initial mount and whenever user auth session updates
  useEffect(() => {
    fetchData();
  }, [fetchData, session]);

  // 2. Trigger automatic background refresh on window focus / visibility change (multi-tab / machine sync)
  useEffect(() => {
    const handleFocus = () => {
      fetchData();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchData]);

  // 3. Supabase Realtime channel for instant reactive updates across sessions
  useEffect(() => {
    const channel = supabase
      .channel('realtime:working_capital')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_accounts' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_transfers' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_settings' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  // Add account with exact numeric validation and immediate database refresh
  const addAccount = async (name: string, type: string, initialBalance: number = 0) => {
    try {
      const cleanBalance = Number(Number(initialBalance).toFixed(2)) || 0;
      const { error } = await supabase
        .from('financial_accounts')
        .insert([{ name: name.trim(), type, balance: cleanBalance }])
        .select()
        .single();

      if (error) throw error;
      await fetchData();
    } catch (e: any) {
      console.error("addAccount failed:", e.message || e);
      throw e;
    }
  };

  // Update account (name, type, or balance) and sync with DB
  const updateAccount = async (id: string, updates: Partial<WorkingCapitalAccount>) => {
    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name.trim();
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.balance !== undefined) dbUpdates.balance = Number(Number(updates.balance).toFixed(2)) || 0;

      const { error } = await supabase
        .from('financial_accounts')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
      await fetchData();
    } catch (e: any) {
      console.error("updateAccount failed:", e.message || e);
      throw e;
    }
  };

  // Delete account with error propagation
  const deleteAccount = async (id: string) => {
    try {
      const { error } = await supabase
        .from('financial_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchData();
    } catch (e: any) {
      console.error("deleteAccount failed:", e.message || e);
      throw e;
    }
  };

  // Register transfer using fresh database balances to guarantee mathematical integrity
  const registerTransfer = async (transfer: Omit<WorkingCapitalTransfer, 'id'>) => {
    try {
      const cleanAmount = Number(Number(transfer.amount).toFixed(2));
      if (isNaN(cleanAmount) || cleanAmount <= 0) {
        throw new Error('O valor da movimentação deve ser maior que zero.');
      }

      // 1. Insert the transfer record
      const { error: transError } = await supabase
        .from('financial_transfers')
        .insert([{
          type: transfer.type,
          amount: cleanAmount,
          reason: transfer.reason?.trim() || null,
          origin_account_id: transfer.origin_account_id || null,
          destination_account_id: transfer.destination_account_id || null,
          transfer_date: transfer.transfer_date || new Date().toISOString()
        }])
        .select()
        .single();

      if (transError) throw transError;

      // 2. Adjust origin account balance using fresh DB read
      if (transfer.origin_account_id) {
        const { data: origAcc, error: origErr } = await supabase
          .from('financial_accounts')
          .select('balance')
          .eq('id', transfer.origin_account_id)
          .single();

        if (origErr) throw origErr;
        const currentBal = Number(origAcc.balance) || 0;
        const newBal = Number((currentBal - cleanAmount).toFixed(2));
        const { error: updErr } = await supabase
          .from('financial_accounts')
          .update({ balance: newBal })
          .eq('id', transfer.origin_account_id);

        if (updErr) throw updErr;
      }

      // 3. Adjust destination account balance using fresh DB read
      if (transfer.destination_account_id) {
        const { data: destAcc, error: destErr } = await supabase
          .from('financial_accounts')
          .select('balance')
          .eq('id', transfer.destination_account_id)
          .single();

        if (destErr) throw destErr;
        const currentBal = Number(destAcc.balance) || 0;
        const newBal = Number((currentBal + cleanAmount).toFixed(2));
        const { error: updErr } = await supabase
          .from('financial_accounts')
          .update({ balance: newBal })
          .eq('id', transfer.destination_account_id);

        if (updErr) throw updErr;
      }

      // 4. Authoritative full re-fetch
      await fetchData();
    } catch (e: any) {
      console.error("registerTransfer failed:", e.message || e);
      throw e;
    }
  };

  // Update transfer and reconcile accounts
  const updateTransfer = async (id: string, updates: Partial<WorkingCapitalTransfer>) => {
    try {
      const { data: oldTransfer, error: fetchErr } = await supabase
        .from('financial_transfers')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchErr || !oldTransfer) throw new Error('Transferência não encontrada no banco de dados.');

      const oldAmount = Number(oldTransfer.amount) || 0;
      const newAmount = updates.amount !== undefined ? Number(Number(updates.amount).toFixed(2)) : oldAmount;
      const diff = Number((newAmount - oldAmount).toFixed(2));

      const dbUpdates: any = {};
      if (updates.amount !== undefined) dbUpdates.amount = newAmount;
      if (updates.reason !== undefined) dbUpdates.reason = updates.reason?.trim() || null;

      const { error: updateErr } = await supabase
        .from('financial_transfers')
        .update(dbUpdates)
        .eq('id', id);

      if (updateErr) throw updateErr;

      if (diff !== 0) {
        if (oldTransfer.origin_account_id) {
          const { data: origAcc } = await supabase
            .from('financial_accounts')
            .select('balance')
            .eq('id', oldTransfer.origin_account_id)
            .single();

          if (origAcc) {
            const currentBal = Number(origAcc.balance) || 0;
            const newBal = Number((currentBal - diff).toFixed(2));
            await supabase
              .from('financial_accounts')
              .update({ balance: newBal })
              .eq('id', oldTransfer.origin_account_id);
          }
        }

        if (oldTransfer.destination_account_id) {
          const { data: destAcc } = await supabase
            .from('financial_accounts')
            .select('balance')
            .eq('id', oldTransfer.destination_account_id)
            .single();

          if (destAcc) {
            const currentBal = Number(destAcc.balance) || 0;
            const newBal = Number((currentBal + diff).toFixed(2));
            await supabase
              .from('financial_accounts')
              .update({ balance: newBal })
              .eq('id', oldTransfer.destination_account_id);
          }
        }
      }

      await fetchData();
    } catch (e: any) {
      console.error("updateTransfer failed:", e.message || e);
      throw e;
    }
  };

  // Delete transfer and reverse balances
  const deleteTransfer = async (id: string) => {
    try {
      const { data: transfer, error: fetchErr } = await supabase
        .from('financial_transfers')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchErr || !transfer) throw new Error('Transferência não encontrada no banco de dados.');

      const amount = Number(transfer.amount) || 0;

      const { error: delErr } = await supabase
        .from('financial_transfers')
        .delete()
        .eq('id', id);

      if (delErr) throw delErr;

      if (transfer.origin_account_id) {
        const { data: origAcc } = await supabase
          .from('financial_accounts')
          .select('balance')
          .eq('id', transfer.origin_account_id)
          .single();

        if (origAcc) {
          const currentBal = Number(origAcc.balance) || 0;
          const newBal = Number((currentBal + amount).toFixed(2));
          await supabase
            .from('financial_accounts')
            .update({ balance: newBal })
            .eq('id', transfer.origin_account_id);
        }
      }

      if (transfer.destination_account_id) {
        const { data: destAcc } = await supabase
          .from('financial_accounts')
          .select('balance')
          .eq('id', transfer.destination_account_id)
          .single();

        if (destAcc) {
          const currentBal = Number(destAcc.balance) || 0;
          const newBal = Number((currentBal - amount).toFixed(2));
          await supabase
            .from('financial_accounts')
            .update({ balance: newBal })
            .eq('id', transfer.destination_account_id);
        }
      }

      await fetchData();
    } catch (e: any) {
      console.error("deleteTransfer failed:", e.message || e);
      throw e;
    }
  };

  // Global Goal updater
  const updateGlobalGoal = async (goal: number) => {
    try {
      const cleanGoal = Number(Number(goal).toFixed(2)) || 0;
      const { data: currentData } = await supabase
        .from('financial_settings')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (currentData) {
        const { error } = await supabase
          .from('financial_settings')
          .update({ global_goal: cleanGoal })
          .eq('id', currentData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('financial_settings')
          .insert([{ global_goal: cleanGoal }]);
        if (error) throw error;
      }

      await fetchData();
    } catch (e: any) {
      console.error("updateGlobalGoal failed:", e.message || e);
      throw e;
    }
  };

  return (
    <CapitalGiroContext.Provider value={{ 
      accounts, transfers, globalGoal, isLoading, 
      refreshData: fetchData,
      addAccount, updateAccount, deleteAccount, 
      registerTransfer, updateTransfer, deleteTransfer, updateGlobalGoal 
    }}>
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
