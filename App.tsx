/**
 * Budget App
 * A simple budget tracking app with weekly and daily totals
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BudgetData, Transaction, WeekData } from './types';
import { loadBudgetData, addTransaction, loadDarkModePreference, saveDarkModePreference, removeTransaction } from './storage';
import { formatDateTime, getWeekLabel, isSameWeek } from './utils';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <BudgetApp />
    </SafeAreaProvider>
  );
}

function BudgetApp() {
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<WeekData | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [inputName, setInputName] = useState('');
  const [inputAmount, setInputAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load data on app start
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load budget data and dark mode preference in parallel
      const [data, darkModePreference] = await Promise.all([
        loadBudgetData(),
        loadDarkModePreference()
      ]);
      
      setBudgetData(data);
      setSelectedWeek(data.currentWeek);
      setIsDarkMode(darkModePreference);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async () => {
    if (!inputName.trim() || !inputAmount.trim()) {
      Alert.alert('Error', 'Please fill in both name and amount');
      return;
    }

    const amount = parseFloat(inputAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!budgetData) return;

    try {
      const updatedData = await addTransaction(inputName.trim(), amount, budgetData);
      setBudgetData(updatedData);
      setSelectedWeek(updatedData.currentWeek);
      setInputName('');
      setInputAmount('');
    } catch (error) {
      console.error('Error adding transaction:', error);
      Alert.alert('Error', 'Failed to add transaction');
    }
  };

  const handleWeekSelect = (week: WeekData) => {
    setSelectedWeek(week);
    setIsMenuOpen(false);
  };

  const handleHomePress = () => {
    if (budgetData) {
      setSelectedWeek(budgetData.currentWeek);
      setIsMenuOpen(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!budgetData || !selectedWeek) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load budget data</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? '#121212' : '#ffffffff' },
      ]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: isDarkMode ? '#1f1f1f' : '#fff' },
        ]}
      >
        <Text
          style={[
            styles.headerTitle,
            { color: isDarkMode ? '#ffffff' : '#333333' },
          ]}
        >
          Budget Tracker
        </Text>

        <View style={{ flexDirection: 'row' }}>
          {/* 🌙 Toggle Button */}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={async () => {
              const newDarkMode = !isDarkMode;
              setIsDarkMode(newDarkMode);
              await saveDarkModePreference(newDarkMode);
            }}
          >
            <Text
              style={[
                styles.menuButtonText,
                { color: isDarkMode ? '#ffffff' : '#333333' },
              ]}
            >
              {isDarkMode ? '🌙' : '☀️'}
            </Text>
          </TouchableOpacity>

          {/* ☰ Menu Button */}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setIsMenuOpen(true)}
          >
            <Text
              style={[
                styles.menuButtonText,
                { color: isDarkMode ? '#ffffff' : '#333333' },
              ]}
            >
              ☰
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Weekly Total */}
      <View
        style={[
          styles.totalContainer,
          { backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffffff' },
        ]}
      >
        <Text
          style={[
            styles.totalLabel,
            { color: isDarkMode ? '#aaaaaa' : '#666666' },
          ]}
        >
          Weekly Total
        </Text>
        <Text
          style={[
            styles.weeklyTotal,
            { color: isDarkMode ? '#ffffff' : '#2c3e50' },
          ]}
        >
          ${selectedWeek.weeklyTotal.toFixed(2)}
        </Text>
      </View>

      {/* Daily Total */}
      <View
        style={[
          styles.totalContainer,
          { backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffffff' },
        ]}
      >
        <Text
          style={[
            styles.totalLabel,
            { color: isDarkMode ? '#aaaaaa' : '#666666' },
          ]}
        >
          Daily Total
        </Text>
        <Text
          style={[
            styles.dailyTotal,
            { color: isDarkMode ? '#ffffff' : '#e74c3c' },
          ]}
        >
          ${selectedWeek.dailyTotal.toFixed(2)}
        </Text>
      </View>

      {/* Transaction List */}
      <View style={styles.listContainer}>
        <Text
          style={[
            styles.listTitle,
            { color: isDarkMode ? '#ffffff' : '#333333' },
          ]}
        >
          Transactions
        </Text>
        <FlatList
          data={selectedWeek.transactions}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onLongPress={() => {
                Alert.alert(
                  'Delete transaction',
                  `Remove "${item.name}" for $${item.amount.toFixed(2)}?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        if (!budgetData) return;
                        try {
                          const updated = await removeTransaction(
                            budgetData,
                            item.id,
                            selectedWeek.weekStart
                          );
                          setBudgetData(updated);
                          // keep viewing same week (it may be current or previous)
                          const stillSelected = isSameWeek(updated.currentWeek.weekStart, selectedWeek.weekStart)
                            ? updated.currentWeek
                            : updated.previousWeeks.find(w => isSameWeek(w.weekStart, selectedWeek.weekStart)) || updated.currentWeek;
                          setSelectedWeek(stillSelected);
                        } catch (e) {
                          console.error(e);
                          Alert.alert('Error', 'Failed to delete transaction');
                        }
                      },
                    },
                  ]
                );
              }}
              style={[
                styles.transactionItem,
                { backgroundColor: isDarkMode ? '#1f1f1f' : '#fff' },
              ]}
            >
              <View style={styles.transactionInfo}>
                <Text
                  style={[
                    styles.transactionName,
                    { color: isDarkMode ? '#ffffff' : '#333333' },
                  ]}
                >
                  {item.name}
                </Text>
                <Text
                  style={[
                    styles.transactionTime,
                    { color: isDarkMode ? '#aaaaaa' : '#666666' },
                  ]}
                >
                  {formatDateTime(item.timestamp)}
                </Text>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  { color: '#e74c3c' },
                ]}
              >
                ${item.amount.toFixed(2)}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          style={styles.transactionList}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Input Form */}
      <View
        style={[
          styles.inputContainer,
          { backgroundColor: isDarkMode ? '#1f1f1f' : '#f9f7f7ff' },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: isDarkMode ? '#2a2a2a' : '#ffffff',
              color: isDarkMode ? '#ffffff' : '#000000',
              borderColor: isDarkMode ? '#444444' : '#dddddd',
            },
          ]}
          placeholder="Item name"
          placeholderTextColor={isDarkMode ? '#aaaaaa' : '#888888'}
          value={inputName}
          onChangeText={setInputName}
        />
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: isDarkMode ? '#2a2a2a' : '#ffffff',
              color: isDarkMode ? '#ffffff' : '#000000',
              borderColor: isDarkMode ? '#444444' : '#dddddd',
            },
          ]}
          placeholder="Amount"
          placeholderTextColor={isDarkMode ? '#aaaaaa' : '#888888'}
          value={inputAmount}
          onChangeText={setInputAmount}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddTransaction}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Week Selection Modal */}
      <Modal
        visible={isMenuOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDarkMode ? '#1c1c1c' : '#fffefeff' },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  { color: isDarkMode ? '#ffffff' : '#333333' },
                ]}
              >
                Select Week
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsMenuOpen(false)}
              >
                <Text
                  style={[
                    styles.closeButtonText,
                    { color: isDarkMode ? '#aaaaaa' : '#666666' },
                  ]}
                >
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.homeButton}
              onPress={handleHomePress}
            >
              <Text style={styles.homeButtonText}>🏠 Current Week</Text>
            </TouchableOpacity>

            <FlatList
              data={budgetData.previousWeeks}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.weekItem,
                    { backgroundColor: isDarkMode ? '#2a2a2a' : '#f8f9fa' },
                  ]}
                  onPress={() => handleWeekSelect(item)}
                >
                  <Text
                    style={[
                      styles.weekLabel,
                      { color: isDarkMode ? '#ffffff' : '#333333' },
                    ]}
                  >
                    {getWeekLabel(item.weekStart)}
                  </Text>
                  <Text
                    style={[
                      styles.weekTotal,
                      { color: '#e74c3c' },
                    ]}
                  >
                    ${item.weeklyTotal.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.weekStart.toISOString()}
              style={styles.weekList}
            />
          </View>
        </View>
      </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 18, color: '#666' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 18, color: '#ff4444' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  menuButton: { padding: 10 },
  menuButtonText: { fontSize: 20, color: '#333' },
  totalContainer: {
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalLabel: { fontSize: 16, color: '#666', marginBottom: 5 },
  weeklyTotal: { fontSize: 32, fontWeight: 'bold', color: '#2c3e50' },
  dailyTotal: { fontSize: 28, fontWeight: 'bold', color: '#e74c3c' },
  listContainer: { flex: 1, marginHorizontal: 20, marginTop: 10 },
  listTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  transactionList: { flex: 1 },
  transactionItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 8,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionInfo: { flex: 1 },
  transactionName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  transactionTime: { fontSize: 12, color: '#666' },
  transactionAmount: { fontSize: 16, fontWeight: 'bold', color: '#e74c3c' },
  inputContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  closeButton: { padding: 5 },
  closeButtonText: { fontSize: 18, color: '#666' },
  homeButton: {
    backgroundColor: '#3498db',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  homeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  weekList: { flex: 1 },
  weekItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  weekLabel: { fontSize: 16, color: '#333' },
  weekTotal: { fontSize: 16, fontWeight: 'bold', color: '#e74c3c' },
});

export default App;
