import type { Cycle, Transaction, Bill, Goal, User, Debt } from '../types/database';

export type ObligationStatus = 'Unpaid' | 'Partially Paid' | 'Fully Paid';

export interface ObligationBreakdown {
  expected: number;
  paid: number;
  remaining: number;
  status: ObligationStatus;
}

// -----------------------------------------------------------------------------
// FINANCIAL TRANSACTION CLASSIFICATION MATRIX
// -----------------------------------------------------------------------------

export type ClassificationType = 
  | 'Earned Income'
  | 'Passive Income'
  | 'Debt Origination'
  | 'Debt Repayment'
  | 'Goal Contribution'
  | 'Goal Reversal'
  | 'Bill Payment'
  | 'Discretionary Expense'
  | 'Refund';

export interface TransactionBehavior {
  affectsAvailableCash: boolean;
  affectsIncomeMetrics: boolean;
  affectsForecasting: boolean;
  affectsGoalBalances: boolean;
  affectsDebtBalances: boolean;
}

export const TRANSACTION_BEHAVIORS: Record<ClassificationType, TransactionBehavior> = {
  'Earned Income': { affectsAvailableCash: true, affectsIncomeMetrics: true, affectsForecasting: false, affectsGoalBalances: false, affectsDebtBalances: false },
  'Passive Income': { affectsAvailableCash: true, affectsIncomeMetrics: true, affectsForecasting: false, affectsGoalBalances: false, affectsDebtBalances: false },
  'Debt Origination': { affectsAvailableCash: true, affectsIncomeMetrics: false, affectsForecasting: false, affectsGoalBalances: false, affectsDebtBalances: false },
  'Debt Repayment': { affectsAvailableCash: true, affectsIncomeMetrics: false, affectsForecasting: false, affectsGoalBalances: false, affectsDebtBalances: true },
  'Goal Contribution': { affectsAvailableCash: true, affectsIncomeMetrics: false, affectsForecasting: false, affectsGoalBalances: true, affectsDebtBalances: false },
  'Goal Reversal': { affectsAvailableCash: true, affectsIncomeMetrics: false, affectsForecasting: false, affectsGoalBalances: true, affectsDebtBalances: false },
  'Bill Payment': { affectsAvailableCash: true, affectsIncomeMetrics: false, affectsForecasting: false, affectsGoalBalances: false, affectsDebtBalances: false },
  'Discretionary Expense': { affectsAvailableCash: true, affectsIncomeMetrics: false, affectsForecasting: true, affectsGoalBalances: false, affectsDebtBalances: false },
  'Refund': { affectsAvailableCash: true, affectsIncomeMetrics: false, affectsForecasting: true, affectsGoalBalances: false, affectsDebtBalances: false },
};

export const classifyTransaction = (txn: Transaction): ClassificationType => {
  // If it's not active, we classify it as Discretionary to fall back,
  // but the engines will filter it out anyway.
  if (txn.status === 'REVERSED' || txn.status === 'ARCHIVED' || txn.status === 'SYSTEM_ADJUSTMENT') {
    return 'Discretionary Expense';
  }

  // Debt flows
  if (txn.debt_id) {
    if (txn.source_type === 'Debt') return 'Debt Origination';
    if (txn.source_type === 'Repayment') return 'Debt Repayment';
  }
  
  // Goal flows
  if (txn.goal_id) {
    return txn.type === 'expense' ? 'Goal Contribution' : 'Goal Reversal';
  }
  
  // Bill flows
  if (txn.bill_id) {
    return 'Bill Payment';
  }
  
  // Income flows
  if (txn.type === 'income') {
    const earnedCategories = ['Salary', 'Bonus', 'Freelance'];
    const passiveCategories = ['Interest', 'Cashback', 'Dividend', 'Investment'];
    
    if (earnedCategories.includes(txn.category) || txn.source_type === 'Salary') return 'Earned Income';
    if (passiveCategories.includes(txn.category)) return 'Passive Income';
    if (txn.category === 'Refund') return 'Refund';
    
    // Default fallback for manual income
    return 'Earned Income';
  }
  
  // Expense flows
  if (txn.type === 'expense') {
    return 'Discretionary Expense';
  }
  
  return 'Discretionary Expense';
};

export const getTransactionBehavior = (txn: Transaction): TransactionBehavior => {
  return TRANSACTION_BEHAVIORS[classifyTransaction(txn)];
};

// -----------------------------------------------------------------------------
// CORE MATHEMATICAL ENGINES
// -----------------------------------------------------------------------------

const getObligationStatus = (expected: number, paid: number): ObligationStatus => {
  const remaining = Math.max(0, expected - paid);
  if (remaining <= 0) return 'Fully Paid';
  if (paid > 0 && remaining > 0) return 'Partially Paid';
  return 'Unpaid';
};

const getActiveTransactions = (transactions: Transaction[]) => {
  return transactions.filter(t => !t.status || t.status === 'ACTIVE');
};

export const calculateUpcomingCycleBills = (
  activeCycle: Cycle,
  bills: Bill[],
  transactions: Transaction[]
): ObligationBreakdown => {
  if (!activeCycle || !bills.length) return { expected: 0, paid: 0, remaining: 0, status: 'Unpaid' };
  
  const activeTxns = getActiveTransactions(transactions);
  
  let totalExpected = 0;
  let totalPaid = 0;
  let totalRemaining = 0;
  
  const cycleStart = new Date(activeCycle.start_date);
  const cycleEnd = new Date(activeCycle.end_date);
  const startDay = cycleStart.getUTCDate();
  const endDay = cycleEnd.getUTCDate();
  const startMonth = cycleStart.getUTCMonth();
  const endMonth = cycleEnd.getUTCMonth();
  
  for (const bill of bills) {
    if (bill.is_archived) continue;
    
    const due = bill.due_day;
    let isDueInCycle = false;
    
    if (startMonth === endMonth) {
      if (due >= startDay && due <= endDay) isDueInCycle = true;
    } else {
      if (due >= startDay || due <= endDay) isDueInCycle = true;
    }
    
    if (isDueInCycle) {
      const expected = Number(bill.amount);
      const paid = activeTxns.filter(t => t.bill_id === bill.id).reduce((sum, t) => sum + Number(t.amount), 0);
      const remaining = Math.max(0, expected - paid);
      
      totalExpected += expected;
      totalPaid += paid;
      totalRemaining += remaining;
    }
  }
  
  return {
    expected: totalExpected,
    paid: totalPaid,
    remaining: totalRemaining,
    status: getObligationStatus(totalExpected, totalPaid)
  };
};

export const calculateSingleGoalContribution = (
  goal: Goal,
  userRecord: User
): number => {
  if (!goal.target_date || !userRecord) return 0;
  
  const today = new Date();
  const targetAmount = Number(goal.target_amount);
  const currentAmount = Number(goal.current_amount);
  if (currentAmount >= targetAmount) return 0;
  
  const remainingAmount = targetAmount - currentAmount;
  const targetDate = new Date(goal.target_date);
  const msRemaining = Math.max(targetDate.getTime() - today.getTime(), 0);
  const daysRemaining = msRemaining / (1000 * 60 * 60 * 24);
  
  let cyclesRemaining = 1;
  if (userRecord.pay_frequency === 'monthly') {
    cyclesRemaining = Math.max(Math.ceil(daysRemaining / 30), 1);
  } else if (userRecord.pay_frequency === 'biweekly') {
    cyclesRemaining = Math.max(Math.ceil(daysRemaining / 14), 1);
  } else if (userRecord.pay_frequency === 'weekly') {
    cyclesRemaining = Math.max(Math.ceil(daysRemaining / 7), 1);
  }
  
  return remainingAmount / cyclesRemaining;
};

export const calculateRequiredGoalContributions = (
  activeCycle: Cycle,
  goals: Goal[],
  userRecord: User,
  transactions: Transaction[]
): ObligationBreakdown => {
  if (!activeCycle || !goals.length || !userRecord) return { expected: 0, paid: 0, remaining: 0, status: 'Unpaid' };
  
  const activeTxns = getActiveTransactions(transactions);
  
  let totalExpected = 0;
  let totalPaid = 0;
  let totalRemaining = 0;
  
  for (const goal of goals) {
    if (goal.is_archived) continue;
    
    const expected = calculateSingleGoalContribution(goal, userRecord);
    if (expected > 0) {
      const paid = activeTxns
        .filter(t => t.goal_id === goal.id)
        .reduce((sum, t) => {
          const behavior = getTransactionBehavior(t);
          if (t.type === 'expense' && behavior.affectsGoalBalances) return sum + Number(t.amount);
          if (t.type === 'income' && behavior.affectsGoalBalances) return sum - Number(t.amount);
          return sum;
        }, 0);
        
      const remaining = Math.max(0, expected - paid);
      
      totalExpected += expected;
      totalPaid += paid;
      totalRemaining += remaining;
    }
  }
  
  return {
    expected: totalExpected,
    paid: totalPaid,
    remaining: totalRemaining,
    status: getObligationStatus(totalExpected, totalPaid)
  };
};

export const calculateUpcomingDebtObligations = (
  activeCycle: Cycle,
  debts: Debt[],
  transactions: Transaction[]
): ObligationBreakdown => {
  if (!activeCycle || !debts.length) return { expected: 0, paid: 0, remaining: 0, status: 'Unpaid' };
  
  const activeTxns = getActiveTransactions(transactions);
  
  let totalExpected = 0;
  let totalPaid = 0;
  let totalRemaining = 0;
  
  const cycleStart = new Date(activeCycle.start_date);
  const cycleEnd = new Date(activeCycle.end_date);
  
  for (const debt of debts) {
    if (debt.is_archived) continue;
    
    if (debt.debt_type === 'owe_money' && debt.status !== 'completed' && debt.installment_amount > 0) {
      if (debt.due_date) {
        const dueDate = new Date(debt.due_date);
        const dueDay = dueDate.getUTCDate();
        
        let expected = 0;
        
        if (debt.repayment_frequency === 'monthly') {
          const startDay = cycleStart.getUTCDate();
          const endDay = cycleEnd.getUTCDate();
          const startMonth = cycleStart.getUTCMonth();
          const endMonth = cycleEnd.getUTCMonth();
          
          let isDueInCycle = false;
          if (startMonth === endMonth) {
            if (dueDay >= startDay && dueDay <= endDay) isDueInCycle = true;
          } else {
            if (dueDay >= startDay || dueDay <= endDay) isDueInCycle = true;
          }
          if (isDueInCycle) expected = Number(debt.installment_amount);
        } else if (debt.repayment_frequency === 'weekly') {
          const diffDays = Math.ceil((cycleEnd.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24));
          const weeksInCycle = Math.floor(diffDays / 7);
          expected = Number(debt.installment_amount) * Math.max(weeksInCycle, 1);
        } else if (debt.repayment_frequency === 'one_time') {
          if (dueDate >= cycleStart && dueDate <= cycleEnd) expected = Number(debt.installment_amount);
        }
        
        if (expected > 0) {
          const paid = activeTxns
            .filter(t => t.debt_id === debt.id)
            .filter(t => getTransactionBehavior(t).affectsDebtBalances)
            .reduce((sum, t) => sum + Number(t.amount), 0);
            
          const remaining = Math.max(0, expected - paid);
          
          totalExpected += expected;
          totalPaid += paid;
          totalRemaining += remaining;
        }
      }
    }
  }
  
  return {
    expected: totalExpected,
    paid: totalPaid,
    remaining: totalRemaining,
    status: getObligationStatus(totalExpected, totalPaid)
  };
};

export const calculateAvailableCash = (
  activeCycle: Cycle,
  transactions: Transaction[]
) => {
  if (!activeCycle) return 0;
  
  const startingBalance = Number(activeCycle.starting_balance || 0);
  const activeTxns = getActiveTransactions(transactions);
  
  let cashChange = 0;
  
  for (const t of activeTxns) {
    const behavior = getTransactionBehavior(t);
    if (behavior.affectsAvailableCash) {
      if (t.type === 'income') cashChange += Number(t.amount);
      if (t.type === 'expense') cashChange -= Number(t.amount);
    }
  }
    
  return startingBalance + cashChange;
};

export const calculateSafeToSpend = (
  availableCash: number,
  upcomingBills: ObligationBreakdown,
  requiredGoalContributions: ObligationBreakdown,
  upcomingDebtObligations: ObligationBreakdown,
  userRecord: User
) => {
  if (!userRecord) return 0;
  
  const bufferAmount = Number(userRecord.buffer_amount);
  const totalRemainingObligations = upcomingBills.remaining + requiredGoalContributions.remaining + upcomingDebtObligations.remaining + bufferAmount;
    
  const safeToSpend = availableCash - totalRemainingObligations;
  
  return Math.max(safeToSpend, 0);
};

export const calculateDailyAllowance = (
  safeToSpend: number,
  activeCycle: Cycle
): number => {
  if (!activeCycle) return 0;
  const today = new Date();
  const endDate = new Date(activeCycle.end_date);
  const diffTime = Math.max(endDate.getTime() - today.getTime(), 0);
  const daysRemaining = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);
  return safeToSpend / daysRemaining;
};

export const calculateWeeklyAllowance = (
  dailyAllowance: number
): number => {
  return dailyAllowance * 7;
};

export const calculateProjectedEndBalance = (
  availableCash: number,
  activeCycle: Cycle,
  transactions: Transaction[],
  upcomingBills: ObligationBreakdown,
  requiredGoalContributions: ObligationBreakdown,
  upcomingDebtObligations: ObligationBreakdown
): number => {
  if (!activeCycle) return 0;
  
  const today = new Date();
  const startDate = new Date(activeCycle.start_date);
  const endDate = new Date(activeCycle.end_date);
  
  const elapsedMs = Math.max(today.getTime() - startDate.getTime(), 0);
  const daysElapsed = Math.max(Math.ceil(elapsedMs / (1000 * 60 * 60 * 24)), 1);
  
  const remainingMs = Math.max(endDate.getTime() - today.getTime(), 0);
  const daysRemaining = Math.max(Math.ceil(remainingMs / (1000 * 60 * 60 * 24)), 0);
  
  const activeTxns = getActiveTransactions(transactions);
  
  let discretionarySpend = 0;
  for (const t of activeTxns) {
    const behavior = getTransactionBehavior(t);
    if (behavior.affectsForecasting) {
      if (t.type === 'expense') discretionarySpend += Number(t.amount);
      if (t.type === 'income') discretionarySpend -= Number(t.amount); // refunds reduce burn rate
    }
  }
    
  const currentDailySpendRate = Math.max(discretionarySpend / daysElapsed, 0);
  const projectedFutureSpend = currentDailySpendRate * daysRemaining;
  
  return availableCash - upcomingBills.remaining - requiredGoalContributions.remaining - upcomingDebtObligations.remaining - projectedFutureSpend;
};

export const calculateActualIncome = (transactions: Transaction[]): number => {
  const activeTxns = getActiveTransactions(transactions);
  let actualIncomeTotal = 0;
  
  for (const t of activeTxns) {
    const behavior = getTransactionBehavior(t);
    if (behavior.affectsIncomeMetrics && t.type === 'income') {
      actualIncomeTotal += Number(t.amount);
    }
  }
  
  return actualIncomeTotal;
};

export const calculateIncomeVariance = (expectedIncome: number, actualIncomeTotal: number): number => {
  if (expectedIncome > 0) {
    return ((actualIncomeTotal - expectedIncome) / expectedIncome) * 100;
  }
  if (expectedIncome === 0 && actualIncomeTotal > 0) {
    return 100;
  }
  return 0;
};
