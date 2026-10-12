import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface Expense {
  id: number;
  title: string;
  category: string;
  amount: number;
  date: string;
}

interface ExpenseState {
  expenses: Expense[];
  searchTerm: string;
  categoryFilter: string;
  sortBy: "date" | "amount";
  sortOrder: "ascending" | "descending";
}

const STORAGE_KEY = "retain-expenses";

function loadExpenses(): Expense[] {
  try {
    const savedExpenses = localStorage.getItem(STORAGE_KEY);
    return savedExpenses ? (JSON.parse(savedExpenses) as Expense[]) : [];
  } catch {
    return [];
  }
}

const initialState: ExpenseState = {
  expenses: loadExpenses(),
  searchTerm: "",
  categoryFilter: "All",
  sortBy: "date",
  sortOrder: "descending",
};

const expenseSlice = createSlice({
  name: "expenses",
  initialState,
  reducers: {
    addExpense(state, action: PayloadAction<Expense>) {
      state.expenses.unshift(action.payload);
    },

    updateExpense(state, action: PayloadAction<Expense>) {
      const index = state.expenses.findIndex(
        (expense) => expense.id === action.payload.id
      );

      if (index !== -1) {
        state.expenses[index] = action.payload;
      }
    },

    deleteExpense(state, action: PayloadAction<number>) {
      state.expenses = state.expenses.filter(
        (expense) => expense.id !== action.payload
      );
    },

    setSearchTerm(state, action: PayloadAction<string>) {
      state.searchTerm = action.payload;
    },

    setCategoryFilter(state, action: PayloadAction<string>) {
      state.categoryFilter = action.payload;
    },

    setSortBy(state, action: PayloadAction<"date" | "amount">) {
      state.sortBy = action.payload;
    },

    setSortOrder(
      state,
      action: PayloadAction<"ascending" | "descending">
    ) {
      state.sortOrder = action.payload;
    },
  },
});

export const {
  addExpense,
  updateExpense,
  deleteExpense,
  setSearchTerm,
  setCategoryFilter,
  setSortBy,
  setSortOrder,
} = expenseSlice.actions;

export default expenseSlice.reducer;