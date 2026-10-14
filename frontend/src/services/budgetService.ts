
import api from "./api";

export interface Budget {
  id: number;
  amount: number;
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetInput {
  amount: number;
  month: number;
  year: number;
}

export async function getBudgets(): Promise<Budget[]> {
  const response = await api.get<Budget[]>("budgets/");
  return response.data;
}

export async function saveBudget(
  budget: BudgetInput
): Promise<Budget> {
  const response = await api.post<Budget>("budgets/", budget);
  return response.data;
}
