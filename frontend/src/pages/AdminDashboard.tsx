import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import StatCard from "../components/StatCard";
import { Link } from "react-router-dom";
import {
  getAdminInsights,
  type AdminInsights,
  type CategoryInsight,
} from "../services/adminService";
import { getErrorMessage } from "../services/api";
import { formatCurrency } from "../utils/currency";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

interface CategoryRankingProps {
  title: string;
  description: string;
  categories: CategoryInsight[];
}

function CategoryRanking({ title, description, categories }: CategoryRankingProps) {
  return (
    <article className="content-panel">
      <h2>{title}</h2>
      <p>{description}</p>

      {categories.length === 0 ? (
        <p className="muted-text">No categories yet.</p>
      ) : (
        <ol className="admin-ranking">
          {categories.map((item) => (
            <li key={item.category}>
              <span>{item.category}</span>
              <strong>
                {item.count} {item.count === 1 ? "expense" : "expenses"}
              </strong>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}

// Admin-only page: platform insights and category management.
export default function AdminDashboard() {
  const [insights, setInsights] = useState<AdminInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadInsights = useCallback(async () => {
    try {
      setError("");
      setInsights(await getAdminInsights());
    } catch (err) {
      setError(getErrorMessage(err, "Could not load platform insights."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInsights();
  }, [loadInsights]);

  const chartData = (insights?.spending_per_category ?? [])
    .map((item) => ({ category: item.category, amount: Number(item.total) }))
    .filter((item) => item.amount > 0);

  return (
    <section className="page-content">
      <div className="welcome-section">
        <div>
          <p className="eyebrow">ADMINISTRATION</p>
          <h1>Admin Dashboard</h1>
          <p>Platform insights and expense category management.</p>
        </div>

        <div className="expense-form-actions">
          <Link to="/admin/categories" className="primary-button">
            Manage Categories
          </Link>
          <button type="button" onClick={() => void loadInsights()}>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}

      {loading && !insights ? (
        <p>Loading insights...</p>
      ) : insights ? (
        <>
          <div className="summary-grid admin-stats">
            <StatCard
              label="Registered Users"
              value={insights.total_users}
              description="Total accounts on Retain."
              icon="◎"
            />
            <StatCard
              label="Expenses Recorded"
              value={insights.total_expenses}
              description="All expenses from all users."
              icon="▤"
            />
            <StatCard
              label="Total Expense Value"
              value={formatCurrency(Number(insights.total_expense_value))}
              description="Sum of every recorded expense."
              icon="↗"
            />
            <StatCard
              label="Expenses This Month"
              value={insights.expenses_this_month}
              description={`Worth ${formatCurrency(
                Number(insights.expense_value_this_month)
              )}.`}
              icon="◷"
            />
          </div>

          <article className="content-panel">
            <h2>Total Spending per Category</h2>
            <p>Combined spending of all users in each category.</p>

            {chartData.length === 0 ? (
              <p className="muted-text">No spending recorded yet.</p>
            ) : (
              <div className="admin-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 12, left: 12, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="category"
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={75}
                      tickFormatter={(value: number) =>
                        value.toLocaleString("en-US")
                      }
                    />
                    <Tooltip
                      formatter={(value) => [
                        formatCurrency(Number(value ?? 0)),
                        "Total spent",
                      ]}
                    />
                    <Bar
                      dataKey="amount"
                      name="Total spent"
                      fill="#243b64"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={42}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Expenses</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {insights.spending_per_category.map((item) => (
                    <tr key={item.category}>
                      <td>{item.category}</td>
                      <td>{item.count}</td>
                      <td>{formatCurrency(Number(item.total))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <div className="admin-two-columns">
            <CategoryRanking
              title="Top 5 Categories"
              description="Most-used categories by number of expenses."
              categories={insights.top_categories}
            />
            <CategoryRanking
              title="Bottom 5 Categories"
              description="Least-used categories by number of expenses."
              categories={insights.bottom_categories}
            />
          </div>

          <div className="admin-two-columns">
            <article className="content-panel">
              <h2>Recently Added Expenses</h2>
              <p>The latest expenses recorded on the platform.</p>

              {insights.recent_expenses.length === 0 ? (
                <p className="muted-text">No expenses yet.</p>
              ) : (
                <div className="expense-list">
                  {insights.recent_expenses.map((expense) => (
                    <div className="expense-item" key={expense.id}>
                      <div>
                        <strong>{expense.title}</strong>
                        <p>
                          {expense.category} · {expense.user} ·{" "}
                          {formatDate(expense.date)}
                        </p>
                      </div>
                      <strong>{formatCurrency(Number(expense.amount))}</strong>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="content-panel">
              <h2>Recently Registered Users</h2>
              <p>The newest Retain accounts.</p>

              {insights.recent_users.length === 0 ? (
                <p className="muted-text">No users yet.</p>
              ) : (
                <div className="expense-list">
                  {insights.recent_users.map((account) => (
                    <div className="expense-item" key={account.id}>
                      <div>
                        <strong>
                          {account.name}
                          {account.role === "admin" && (
                            <span className="role-badge">Admin</span>
                          )}
                        </strong>
                        <p>
                          {account.email} · joined {formatDate(account.date_joined)}
                        </p>
                      </div>
                      <span className="muted-text">
                        {account.expense_count} expenses
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </div>
        </>
      ) : null}
    </section>
  );
}
