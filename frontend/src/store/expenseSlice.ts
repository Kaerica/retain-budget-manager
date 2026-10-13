
import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import api from "../services/api";

export interface Expense {
  id: number;
  title: string;
  category: string;
  amount: number;
  date: string;
}

export type ExpenseInput = Omit<Expense, "id">;

interface ExpenseState {
  expenses: Expense[];
  searchTerm: string;
  categoryFilter: string;
  sortBy: "date" | "amount";
  sortOrder: "ascending" | "descending";
  loading: boolean;
  error: string | null;
}

function normalizeExpense(data: {
  id: number;
  title: string;
  category: string;
  amount: number | string;
  date: string;
}): Expense {
  return {
    ...data,
    amount: Number(data.amount),
  };
}

export const fetchExpenses = createAsyncThunk(
  "expenses/fetchExpenses",
  async () => {
    const response = await api.get("expenses/");
    return (response.data as Array<{
      id: number;
      title: string;
      category: string;
      amount: number | string;
      date: string;
    }>).map(normalizeExpense);
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
  sortBy: "date",
  sortOrder: "descending",
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
  setSortBy,
  setSortOrder,
  clearExpenseError,
} = expenseSlice.actions;

export default expenseSlice.reducer;
