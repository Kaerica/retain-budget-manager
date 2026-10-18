import api from "./api";
import {
  normalizeExpense,
  type ApiExpense,
  type Expense,
} from "../store/expenseSlice";

// Monthly summary returned by GET /api/expenses/summary/.
export type BudgetStatus = "within" | "approaching" | "over" | "no_budget";

export interface CategoryTotal {
  category: string;
  total: number;
  count: number;
}

export interface ExpenseSummary {
  month: number;
  year: number;
  total_spent: number;
  budget: number | null;
  remaining_budget: number | null;
  budget_status: BudgetStatus;
  highest_expense: Expense | null;
  spending_by_category: CategoryTotal[];
  recent_expenses: Expense[];
}

// Retrieves one of the signed-in user's expenses.
export async function getExpense(id: number): Promise<Expense> {
  const response = await api.get<ApiExpense>(`expenses/${id}/`);
  return normalizeExpense(response.data);
}

// Retrieves the dashboard summary for a month (defaults to the current month).
export async function getExpenseSummary(
  month?: number,
  year?: number
): Promise<ExpenseSummary> {
  const response = await api.get<
    Omit<ExpenseSummary, "highest_expense" | "recent_expenses"> & {
      highest_expense: ApiExpense | null;
      recent_expenses: ApiExpense[];
    }
  >("expenses/summary/", {
    params: { month, year },
  });

  const data = response.data;

  // Django sends decimals as strings, so convert them to numbers.
  return {
    ...data,
    total_spent: Number(data.total_spent),
    budget: data.budget === null ? null : Number(data.budget),
    remaining_budget:
      data.remaining_budget === null ? null : Number(data.remaining_budget),
    highest_expense: data.highest_expense
      ? normalizeExpense(data.highest_expense)
      : null,
    spending_by_category: data.spending_by_category.map((item) => ({
      ...item,
      total: Number(item.total),
    })),
    recent_expenses: data.recent_expenses.map(normalizeExpense),
  };
}
