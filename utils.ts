import { WeekData, Transaction } from './types';

// Get the start of the week (Monday) for a given date
export const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Get the end of the week (Sunday) for a given date
export const getWeekEnd = (date: Date): Date => {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
};

// Check if two dates are in the same week
export const isSameWeek = (date1: Date, date2: Date): boolean => {
  const week1Start = getWeekStart(date1);
  const week2Start = getWeekStart(date2);
  return week1Start.getTime() === week2Start.getTime();
};

// Check if two dates are on the same day
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.toDateString() === date2.toDateString();
};

// Format date for display
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Format time for display
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// Format date and time for display
export const formatDateTime = (date: Date): string => {
  return `${formatDate(date)} at ${formatTime(date)}`;
};

// Calculate daily total for a given date
export const calculateDailyTotal = (transactions: Transaction[], date: Date): number => {
  return transactions
    .filter(transaction => isSameDay(transaction.timestamp, date))
    .reduce((total, transaction) => total + transaction.amount, 0);
};

// Calculate weekly total for a given week
export const calculateWeeklyTotal = (transactions: Transaction[], weekStart: Date): number => {
  const weekEnd = getWeekEnd(weekStart);
  return transactions
    .filter(transaction => 
      transaction.timestamp >= weekStart && transaction.timestamp <= weekEnd
    )
    .reduce((total, transaction) => total + transaction.amount, 0);
};

// Create a new week data object
export const createWeekData = (weekStart: Date, transactions: Transaction[]): WeekData => {
  const today = new Date();
  const dailyTotal = calculateDailyTotal(transactions, today);
  const weeklyTotal = calculateWeeklyTotal(transactions, weekStart);
  
  return {
    weekStart,
    transactions,
    dailyTotal,
    weeklyTotal,
  };
};

// Generate week label for display
export const getWeekLabel = (weekStart: Date): string => {
  const weekEnd = getWeekEnd(weekStart);
  const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
  const startDay = weekStart.getDate();
  const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
  const endDay = weekEnd.getDate();
  
  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${startMonth} ${startDay}-${endDay}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  }
};

