import { 
  calculateAvailableCash, 
  calculateSafeToSpend, 
  calculateProjectedEndBalance,
  calculateUpcomingCycleBills,
  calculateRequiredGoalContributions,
  calculateUpcomingDebtObligations,
  calculateActualIncome,
  calculateIncomeVariance,
  getTransactionBehavior
} from '../utils/engines';
import type { Cycle, Transaction, Bill, Goal, User, Debt } from '../types/database';
import * as fs from 'fs';
import * as path from 'path';

function generateId() {
  return Math.random().toString(36).substring(7);
}

const mockUser: User = {
  id: 'user1',
  email: 'test@example.com',
  first_name: 'Test',
  base_salary: 100000,
  pay_frequency: 'monthly',
  buffer_amount: 5000,
  settings: {}
};

const mockCycle: Cycle = {
  id: 'cycle1',
  user_id: 'user1',
  name: 'Test Cycle',
  start_date: '2026-06-01',
  end_date: '2026-06-30',
  starting_balance: 10000, // Opening Balance
  expected_income: 100000,
  actual_income: 0,
  is_active: true
};

let txns: Transaction[] = [];
let bills: Bill[] = [];
let goals: Goal[] = [];
let debts: Debt[] = [];

function resetState() {
  txns = [];
  bills = [];
  goals = [];
  debts = [];
}

interface TestResult {
  name: string;
  input: string;
  expected: any;
  actual: any;
  passed: boolean;
}

const results: TestResult[] = [];

function runReconciliationCheck(): boolean {
  // Opening Balance + Income + Debt Originations - Expenses - Bills - Goal Contributions - Debt Payments = Closing Balance
  const openingBalance = Number(mockCycle.starting_balance);
  let inflows = 0;
  let outflows = 0;
  
  for (const t of txns) {
    if (t.status === 'REVERSED' || t.status === 'ARCHIVED') continue;
    const behavior = getTransactionBehavior(t);
    if (behavior.affectsAvailableCash) {
      if (t.type === 'income') inflows += Number(t.amount);
      if (t.type === 'expense') outflows += Number(t.amount);
    }
  }
  
  const expectedClosing = openingBalance + inflows - outflows;
  const actualClosing = calculateAvailableCash(mockCycle, txns);
  
  return Math.abs(expectedClosing - actualClosing) < 0.01;
}

function assertTest(name: string, input: string, expected: number, actual: number) {
  const isReconciled = runReconciliationCheck();
  const passed = Math.abs(expected - actual) < 0.01 && isReconciled;
  
  results.push({
    name,
    input,
    expected,
    actual,
    passed
  });
  
  if (!passed) {
    console.error(`FAILED: ${name}`);
    console.error(`  Expected: ${expected}`);
    console.error(`  Actual: ${actual}`);
    console.error(`  Reconciled: ${isReconciled}`);
  }
}

function runTests() {
  console.log('--- STARTING FINANCIAL INTEGRITY TESTS ---');
  resetState();
  
  // 1. Initial State
  const initialAvailable = calculateAvailableCash(mockCycle, txns);
  assertTest('Initial Available Cash', 'Starting Balance 10000, 0 txns', 10000, initialAvailable);
  
  // 2. Salary Income
  txns.push({
    id: generateId(), user_id: mockUser.id, cycle_id: mockCycle.id,
    amount: 100000, type: 'income', category: 'Salary', is_need: true, transaction_date: '2026-06-01', notes: '', source_type: 'Salary'
  });
  const afterSalaryCash = calculateAvailableCash(mockCycle, txns);
  assertTest('Salary Income Available Cash', '+100k Salary', 110000, afterSalaryCash);
  
  const incomeTotal = calculateActualIncome(txns);
  assertTest('Salary Income Tracking', '100k Salary', 100000, incomeTotal);
  
  // 3. Bill Creation and Payment
  const bill: Bill = {
    id: 'bill1', user_id: mockUser.id, name: 'Rent', amount: 30000, due_day: 5, is_auto_pay: false, category: 'Housing', frequency: 'monthly', is_archived: false
  };
  bills.push(bill);
  
  const upcomingBills = calculateUpcomingCycleBills(mockCycle, bills, txns);
  assertTest('Bill Expected', '30k Bill Created', 30000, upcomingBills.expected);
  
  // Pay the bill
  txns.push({
    id: generateId(), user_id: mockUser.id, cycle_id: mockCycle.id,
    amount: 30000, type: 'expense', category: 'Housing', is_need: true, transaction_date: '2026-06-02', notes: '', source_type: 'Manual', bill_id: 'bill1'
  });
  
  const updatedBills = calculateUpcomingCycleBills(mockCycle, bills, txns);
  assertTest('Bill Remaining after Payment', 'Paid 30k', 0, updatedBills.remaining);
  assertTest('Available Cash after Rent', '110k - 30k', 80000, calculateAvailableCash(mockCycle, txns));
  
  // 4. Debt Origination (Borrowing)
  const debt: Debt = {
    id: 'debt1', user_id: mockUser.id, person_name: 'Friend', debt_type: 'owe_money', original_amount: 50000, outstanding_balance: 50000, installment_amount: 5000, due_date: '2026-06-10', repayment_frequency: 'monthly', notes: '', status: 'active', is_archived: false
  };
  debts.push(debt);
  
  txns.push({
    id: generateId(), user_id: mockUser.id, cycle_id: mockCycle.id,
    amount: 50000, type: 'income', category: 'Debt Origination', is_need: true, transaction_date: '2026-06-03', notes: '', source_type: 'Debt', debt_id: 'debt1'
  });
  
  assertTest('Available Cash after Borrowing', '80k + 50k', 130000, calculateAvailableCash(mockCycle, txns));
  
  // Ensure Borrowing DOES NOT affect Income Tracking
  const incomeTotalAfterDebt = calculateActualIncome(txns);
  assertTest('Income Tracking ignores Debt Origination', '100k Salary + 50k Borrowed', 100000, incomeTotalAfterDebt);
  
  // 5. Debt Settlement (Repayment)
  txns.push({
    id: generateId(), user_id: mockUser.id, cycle_id: mockCycle.id,
    amount: 5000, type: 'expense', category: 'Debt Repayment', is_need: true, transaction_date: '2026-06-04', notes: '', source_type: 'Repayment', debt_id: 'debt1'
  });
  
  const debtObs = calculateUpcomingDebtObligations(mockCycle, debts, txns);
  assertTest('Debt Remaining after Repayment', 'Expected 5000 - Paid 5000', 0, debtObs.remaining);
  
  // 6. Forecasting Accuracy (Discretionary vs Non-Discretionary)
  // Rent (30k) and Debt Repay (5k) should NOT affect forecasting.
  // Add 1000 discretionary spend
  txns.push({
    id: generateId(), user_id: mockUser.id, cycle_id: mockCycle.id,
    amount: 1000, type: 'expense', category: 'Food', is_need: false, transaction_date: '2026-06-05', notes: '', source_type: 'Manual'
  });
  
  // Mock today to be 2026-06-10 (10 days elapsed)
  // Discretionary spent so far = 1000 over 10 days = 100/day
  // Days remaining in 30 day cycle = 20
  // Projected Future Discretionary Spend = 100 * 20 = 2000
  // Available Cash = 130k - 5k - 1k = 124,000
  // Upcoming Bills Rem = 0
  // Upcoming Debts Rem = 0
  // Goal Rem = 0
  // Projected End Balance = 124,000 - 2000 = 122,000
  
  const originalDate = global.Date;
  class MockDate extends originalDate {
    constructor(...args: any[]) {
      if (args.length === 0) {
        super('2026-06-11T00:00:00.000Z');
      } else {
        super(...args as [any]);
      }
    }
    static now() {
      return new originalDate('2026-06-11T00:00:00.000Z').getTime();
    }
  }
  global.Date = MockDate as any;
  
  const peb = calculateProjectedEndBalance(
    calculateAvailableCash(mockCycle, txns),
    mockCycle,
    txns,
    calculateUpcomingCycleBills(mockCycle, bills, txns),
    { expected: 0, paid: 0, remaining: 0, status: 'Unpaid' },
    calculateUpcomingDebtObligations(mockCycle, debts, txns)
  );
  
  assertTest('Projected End Balance (Discretionary Only)', '124000 - (100/day * 19days)', 122100, peb);
  
  global.Date = originalDate; // Restore
  
  // 7. Goal Reversals & Refunds
  // Refund a discretionary expense
  txns.push({
    id: generateId(), user_id: mockUser.id, cycle_id: mockCycle.id,
    amount: 500, type: 'income', category: 'Refund', is_need: false, transaction_date: '2026-06-06', notes: '', source_type: 'Manual'
  });
  
  const incomeWithRefund = calculateActualIncome(txns);
  assertTest('Income Tracking ignores Refunds', 'Still 100k', 100000, incomeWithRefund);
  assertTest('Available Cash after Refund', '124k + 500', 124500, calculateAvailableCash(mockCycle, txns));
  
  // 8. Reversing a transaction
  txns[txns.length - 1].status = 'REVERSED';
  assertTest('Available Cash after Txn Reversal', 'Back to 124k', 124000, calculateAvailableCash(mockCycle, txns));
  
  // Format report
  console.log('\n--- TEST RESULTS ---');
  let passedCount = 0;
  for (const r of results) {
    console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.name}`);
    if (!r.passed) {
      console.log(`     Input: ${r.input}`);
      console.log(`     Expected: ${r.expected} | Actual: ${r.actual}`);
    } else {
      passedCount++;
    }
  }
  
  console.log(`\nFinal Score: ${passedCount}/${results.length} (${Math.round((passedCount/results.length)*100)}%)`);
  
  const reportPath = path.join(process.cwd(), 'src/tests/test_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
}

runTests();
