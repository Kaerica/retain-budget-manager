
import {
  createAsyncThunk,
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import api from "../services/api";

export const PAYMENT_METHODS = [
  "Cash",
  "Mobile Money",
  "Card",
  "Bank Transfer",
  "Other",
] as const;

export interface Expense {
  id: number;
  title: string;
  category: string;
  amount: number;
  date: string;
  // Optional so older code that creates expenses without them still works.
  payment_method?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export type ExpenseInput = Omit<Expense, "id" | "created_at" | "updated_at">;

export type SortBy = "date" | "amount";
export type SortOrder = "ascending" | "descending";

interface ExpenseState {
  expenses: Expense[];
  searchTerm: string;
  categoryFilter: string;
  paymentMethodFilter: string;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
  sortBy: SortBy;
  sortOrder: SortOrder;
  currentPage: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
}

// Shape of an expense as returned by the Django API (amount is a string).
export interface ApiExpense {
  id: number;
  title: string;
  category: string;
  amount: number | string;
  date: string;
  payment_method?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export function normalizeExpense(data: ApiExpense): Expense {
  return {
    ...data,
    amount: Number(data.amount),
  };
}

export const fetchExpenses = createAsyncThunk(
  "expenses/fetchExpenses",
  async () => {
    const response = await api.get("expenses/");
    return (response.data as ApiExpense[]).map(normalizeExpense);
  }
);

export const createExpense = createAsyncThunk(
  "expenses/createExpense",
  async (expense: ExpenseInput) => {
    const response = await api.post("expenses/", expense);
    return normalizeExpense(response.data);
  }
);

export const saveExpense = createAsyncThunk(
  "expenses/saveExpense",
  async (expense: Expense) => {
    const response = await api.put(`expenses/${expense.id}/`, {
      title: expense.title,
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
      payment_method: expense.payment_method ?? "",
      description: expense.description ?? "",
    });
    return normalizeExpense(response.data);
  }
);

export const removeExpense = createAsyncThunk(
  "expenses/removeExpense",
  async (id: number) => {
    await api.delete(`expenses/${id}/`);
    return id;
  }
);

const initialState: ExpenseState = {
  expenses: [],
  searchTerm: "",
  categoryFilter: "All",
  paymentMethodFilter: "All",
  startDate: "",
  endDate: "",
  minAmount: "",
  maxAmount: "",
  sortBy: "date",
  sortOrder: "descending",
  currentPage: 1,
  pageSize: 10,
  loading: false,
  error: null,
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
      state.currentPage = 1;
    },

    setCategoryFilter(state, action: PayloadAction<string>) {
      state.categoryFilter = action.payload;
      state.currentPage = 1;
    },

    setPaymentMethodFilter(state, action: PayloadAction<string>) {
      state.paymentMethodFilter = action.payload;
      state.currentPage = 1;
    },

    setStartDate(state, action: PayloadAction<string>) {
      state.startDate = action.payload;
      state.currentPage = 1;
    },

    setEndDate(state, action: PayloadAction<string>) {
      state.endDate = action.payload;
      state.currentPage = 1;
    },

    clearDateFilters(state) {
      state.startDate = "";
      state.endDate = "";
      state.currentPage = 1;
    },

    setMinAmount(state, action: PayloadAction<string>) {
      state.minAmount = action.payload;
      state.currentPage = 1;
    },

    setMaxAmount(state, action: PayloadAction<string>) {
      state.maxAmount = action.payload;
      state.currentPage = 1;
    },

    setSortBy(state, action: PayloadAction<SortBy>) {
      state.sortBy = action.payload;
    },

    setSortOrder(state, action: PayloadAction<SortOrder>) {
      state.sortOrder = action.payload;
    },

    setCurrentPage(state, action: PayloadAction<number>) {
      state.currentPage = Math.max(1, action.payload);
    },

    setPageSize(state, action: PayloadAction<number>) {
      state.pageSize = action.payload;
      state.currentPage = 1;
    },

    resetFilters(state) {
      state.searchTerm = initialState.searchTerm;
      state.categoryFilter = initialState.categoryFilter;
      state.paymentMethodFilter = initialState.paymentMethodFilter;
      state.startDate = initialState.startDate;
      state.endDate = initialState.endDate;
      state.minAmount = initialState.minAmount;
      state.maxAmount = initialState.maxAmount;
      state.sortBy = initialState.sortBy;
      state.sortOrder = initialState.sortOrder;
      state.currentPage = 1;
    },

    clearExpenseError(state) {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = action.payload;
      })
      .addCase(fetchExpenses.rejected, (state) => {
        state.loading = false;
        state.error = "Could not load expenses. Please sign in and try again.";
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.expenses.unshift(action.payload);
      })
      .addCase(createExpense.rejected, (state) => {
        state.error = "Could not save the expense.";
      })
      .addCase(saveExpense.fulfilled, (state, action) => {
        const index = state.expenses.findIndex(
          (expense) => expense.id === action.payload.id
        );

        if (index !== -1) {
          state.expenses[index] = action.payload;
        }
      })
      .addCase(saveExpense.rejected, (state) => {
        state.error = "Could not update the expense.";
      })
      .addCase(removeExpense.fulfilled, (state, action) => {
        state.expenses = state.expenses.filter(
          (expense) => expense.id !== action.payload
        );
      })
      .addCase(removeExpense.rejected, (state) => {
        state.error = "Could not delete the expense.";
      });
  },
});

export const {
  addExpense,
  updateExpense,
  deleteExpense,
  setSearchTerm,
  setCategoryFilter,
  setPaymentMethodFilter,
  setStartDate,
  setEndDate,
  clearDateFilters,
  setMinAmount,
  setMaxAmount,
  setSortBy,
  setSortOrder,
  setCurrentPage,
  setPageSize,
  resetFilters,
  clearExpenseError,
} = expenseSlice.actions;

// ---------- Selectors ----------
// All searching, filtering and sorting is computed from Redux state here,
// so every component sees the same filtered list.

type StateWithExpenses = { expenses: ExpenseState };

const selectExpenseState = (state: StateWithExpenses) => state.expenses;

export const selectFilteredExpenses = createSelector(
  [selectExpenseState],
  (expenseState): Expense[] => {
    const {
      expenses,
      searchTerm,
      categoryFilter,
      paymentMethodFilter,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      sortBy,
      sortOrder,
    } = expenseState;

    const search = searchTerm.trim().toLowerCase();
    const min = minAmount === "" ? null : Number(minAmount);
    const max = maxAmount === "" ? null : Number(maxAmount);

    const filtered = expenses.filter((expense) => {
      const matchesSearch =
        !search ||
        expense.title.toLowerCase().includes(search) ||
        expense.category.toLowerCase().includes(search) ||
        (expense.payment_method ?? "").toLowerCase().includes(search) ||
        (expense.description ?? "").toLowerCase().includes(search);

      const matchesCategory =
        categoryFilter === "All" || expense.category === categoryFilter;

      const matchesPaymentMethod =
        paymentMethodFilter === "All" ||
        (expense.payment_method ?? "") === paymentMethodFilter;

      const matchesStartDate = !startDate || expense.date >= startDate;
      const matchesEndDate = !endDate || expense.date <= endDate;

      const amount = Number(expense.amount);
      const matchesMin = min === null || !Number.isFinite(min) || amount >= min;
      const matchesMax = max === null || !Number.isFinite(max) || amount <= max;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesPaymentMethod &&
        matchesStartDate &&
        matchesEndDate &&
        matchesMin &&
        matchesMax
      );
    });

    return [...filtered].sort((a, b) => {
      const comparison =
        sortBy === "amount"
          ? Number(a.amount) - Number(b.amount)
          : a.date.localeCompare(b.date);

      return sortOrder === "ascending" ? comparison : -comparison;
    });
  }
);

export const selectTotalPages = createSelector(
  [selectFilteredExpenses, (state: StateWithExpenses) => state.expenses.pageSize],
  (filtered, pageSize) => Math.max(1, Math.ceil(filtered.length / pageSize))
);

export const selectPaginatedExpenses = createSelector(
  [
    selectFilteredExpenses,
    (state: StateWithExpenses) => state.expenses.currentPage,
    (state: StateWithExpenses) => state.expenses.pageSize,
  ],
  (filtered, currentPage, pageSize) => {
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const page = Math.min(currentPage, totalPages);
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }
);

export default expenseSlice.reducer;
