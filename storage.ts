import AsyncStorage from '@react-native-async-storage/async-storage';
import { BudgetData, Transaction, WeekData } from './types';
import { getWeekStart, createWeekData, isSameWeek } from './utils';

const STORAGE_KEY = 'budget_data';
const DARK_MODE_KEY = 'dark_mode_preference';

// Load budget data from storage
export const loadBudgetData = async (): Promise<BudgetData> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Convert timestamp strings back to Date objects
      const currentWeek = {
        ...parsed.currentWeek,
        weekStart: new Date(parsed.currentWeek.weekStart),
        transactions: parsed.currentWeek.transactions.map((t: any) => ({
          ...t,
          timestamp: new Date(t.timestamp),
        })),
      };
      
      const previousWeeks = parsed.previousWeeks.map((week: any) => ({
        ...week,
        weekStart: new Date(week.weekStart),
        transactions: week.transactions.map((t: any) => ({
          ...t,
          timestamp: new Date(t.timestamp),
        })),
      }));
      
      return { currentWeek, previousWeeks };
    }
  } catch (error) {
    console.error('Error loading budget data:', error);
  }
  
  // Return default data if loading fails
  const today = new Date();
  const currentWeekStart = getWeekStart(today);
  return {
    currentWeek: createWeekData(currentWeekStart, []),
    previousWeeks: [],
  };
};

// Save budget data to storage
export const saveBudgetData = async (data: BudgetData): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving budget data:', error);
  }
};

// Remove a transaction by id from a specific week and persist
export const removeTransaction = async (
  currentData: BudgetData,
  transactionId: string,
  weekStartToEdit: Date
): Promise<BudgetData> => {
  const targetWeekStart = getWeekStart(weekStartToEdit);

  const updateWeek = (week: WeekData): WeekData => {
    if (!isSameWeek(week.weekStart, targetWeekStart)) return week;
    const filtered = week.transactions.filter((t) => t.id !== transactionId);
    return createWeekData(week.weekStart, filtered);
  };

  const updatedCurrentWeek = updateWeek(currentData.currentWeek);
  const updatedPreviousWeeks = currentData.previousWeeks.map(updateWeek);

  const updatedData: BudgetData = {
    currentWeek: updatedCurrentWeek,
    previousWeeks: updatedPreviousWeeks,
  };

  await saveBudgetData(updatedData);
  return updatedData;
};

// Add a new transaction
export const addTransaction = async (
  name: string,
  amount: number,
  currentData: BudgetData
): Promise<BudgetData> => {
  const newTransaction: Transaction = {
    id: Date.now().toString(),
    name,
    amount,
    timestamp: new Date(),
  };
  
  const today = new Date();
  const currentWeekStart = getWeekStart(today);
  
  // Check if we're still in the current week
  if (isSameWeek(currentData.currentWeek.weekStart, currentWeekStart)) {
    // Add to current week
    const updatedTransactions = [...currentData.currentWeek.transactions, newTransaction];
    const updatedCurrentWeek = createWeekData(currentWeekStart, updatedTransactions);
    
    const updatedData = {
      ...currentData,
      currentWeek: updatedCurrentWeek,
    };
    
    // Save to storage
    await saveBudgetData(updatedData);
    
    return updatedData;
  } else {
    // Move current week to previous weeks and create new current week
    const updatedPreviousWeeks = [...currentData.previousWeeks, currentData.currentWeek];
    const newCurrentWeek = createWeekData(currentWeekStart, [newTransaction]);
    
    const updatedData = {
      currentWeek: newCurrentWeek,
      previousWeeks: updatedPreviousWeeks,
    };
    
    // Save to storage
    await saveBudgetData(updatedData);
    
    return updatedData;
  }
};

// Load dark mode preference
export const loadDarkModePreference = async (): Promise<boolean> => {
  try {
    const preference = await AsyncStorage.getItem(DARK_MODE_KEY);
    return preference === 'true';
  } catch (error) {
    console.error('Error loading dark mode preference:', error);
    return false;
  }
};

// Save dark mode preference
export const saveDarkModePreference = async (isDarkMode: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(DARK_MODE_KEY, isDarkMode.toString());
  } catch (error) {
    console.error('Error saving dark mode preference:', error);
  }
};

