export interface Transaction {
  id: string;
  name: string;
  amount: number;
  timestamp: Date;
}

export interface WeekData {
  weekStart: Date;
  transactions: Transaction[];
  dailyTotal: number;
  weeklyTotal: number;
}

export interface BudgetData {
  currentWeek: WeekData;
  previousWeeks: WeekData[];
}

