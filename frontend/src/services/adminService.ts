import api from "./api";
import type { UserRole } from "../context/AuthContext";

// Spending and usage for one category across the whole platform.
export interface CategoryInsight {
  category: string;
  count: number;
  total: number;
}

export interface AdminRecentExpense {
  id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
  payment_method: string;
  created_at: string;
  user: string;
  user_email: string;
}

export interface AdminRecentUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  date_joined: string;
  expense_count: number;
}

// Response of GET /api/admin/insights/ (admin only).
export interface AdminInsights {
  total_users: number;
  total_expenses: number;
  total_expense_value: number;
  expenses_this_month: number;
  expense_value_this_month: number;
  spending_per_category: CategoryInsight[];
  top_categories: CategoryInsight[];
  bottom_categories: CategoryInsight[];
  recent_expenses: AdminRecentExpense[];
  recent_users: AdminRecentUser[];
}

export async function getAdminInsights(): Promise<AdminInsights> {
  const response = await api.get<AdminInsights>("admin/insights/");
  return response.data;
}
