export type TransactionType = 'income' | 'expense' | 'transfer';
export type PayFrequency = 'weekly' | 'biweekly' | 'monthly';
export type BillFrequency = 'monthly' | 'quarterly' | 'yearly';

export interface User {
  id: string;
  email: string;
  first_name: string;
  base_salary: number;
  pay_frequency: PayFrequency;
  buffer_amount: number;
  settings: Record<string, any>;
}

export interface Cycle {
  id: string;
  user_id: string;
  name: string | null;
  start_date: string;
  end_date: string;
  starting_balance: number | null;
  expected_income: number;
  actual_income: number;
  is_active: boolean;
  created_at?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  cycle_id: string;
  amount: number;
  type: TransactionType;
  category: string;
  is_need: boolean;
  transaction_date: string;
  notes: string | null;
  source_type: string;
  status?: 'ACTIVE' | 'REVERSED' | 'ARCHIVED' | 'SYSTEM_ADJUSTMENT';
  debt_id?: string;
  bill_id?: string;
  goal_id?: string;
}

export type DebtType = 'owe_money' | 'owed_money';
export type DebtRepaymentFrequency = 'one_time' | 'weekly' | 'monthly';
export type DebtStatus = 'active' | 'completed' | 'overdue';

export interface Debt {
  id: string;
  user_id: string;
  person_name: string;
  debt_type: DebtType;
  original_amount: number;
  outstanding_balance: number;
  installment_amount: number;
  due_date: string | null;
  repayment_frequency: DebtRepaymentFrequency;
  notes: string | null;
  status: DebtStatus;
  is_archived?: boolean;
  created_at?: string;
}

export interface Bill {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_day: number;
  is_auto_pay: boolean;
  category: string;
  frequency: BillFrequency;
  is_archived?: boolean;
  created_at?: string;
}

export type GoalType = 'Emergency Fund' | 'Vacation' | 'Vehicle' | 'Home' | 'Investment' | 'Custom';

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  type: GoalType;
  target_amount: number;
  current_amount: number;
  target_date: string;
  is_archived?: boolean;
  created_at?: string;
}
