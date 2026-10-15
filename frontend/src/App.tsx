import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { useSelector } from "react-redux";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import type { RootState } from "./store/store";
import { getBudgets } from "./services/budgetService";
import Expenses from "./pages/Expenses";
import Budgets from "./pages/Budgets";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import { useAuth } from "./context/AuthContext";

import "./App.css";

type Page =
  | "Dashboard"
  | "Expenses"
  | "Budgets"
  | "Reports"
  | "Settings";

function ProtectedLayout() {
  const { user, isAuthenticated, signout } = useAuth();
  const navigate = useNavigate();

  const [activePage, setActivePage] = useState<Page>("Dashboard");
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [budgetLoading, setBudgetLoading] = useState(true);

  const expenses = useSelector(
    (state: RootState) => state.expenses.expenses
  );

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    let cancelled = false;

    async function loadMonthlyBudget() {
      setBudgetLoading(true);

      try {
        const budgets = await getBudgets();

        const currentBudget = budgets.find(
          (budget) =>
            Number(budget.month) === currentMonth + 1 &&
            Number(budget.year) === currentYear
        );

        if (!cancelled) {
          setMonthlyBudget(
            currentBudget ? Number(currentBudget.amount) : 0
          );
        }
      } catch (error) {
        console.error("Failed to load monthly budget:", error);

        if (!cancelled) {
          setMonthlyBudget(0);
        }
      } finally {
        if (!cancelled) {
          setBudgetLoading(false);
        }
      }
    }

    if (isAuthenticated) {
      loadMonthlyBudget();
    }

    return () => {
      cancelled = true;
    };
  }, [activePage, isAuthenticated, currentMonth, currentYear]);

  const monthlyExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);

    return (
      !Number.isNaN(expenseDate.getTime()) &&
      expenseDate.getMonth() === currentMonth &&
      expenseDate.getFullYear() === currentYear
    );
  });

  const totalSpent = monthlyExpenses.reduce(
    (total, expense) => total + Number(expense.amount || 0),
    0
  );

  const spendingByCategory = monthlyExpenses.reduce<
    Record<string, number>
  >((totals, expense) => {
    const category = expense.category || "Other";

    totals[category] =
      (totals[category] || 0) + Number(expense.amount || 0);

    return totals;
  }, {});

  const highestExpense = monthlyExpenses.reduce(
    (highest, expense) =>
      Math.max(highest, Number(expense.amount || 0)),
    0
  );

  const formatRWF = (amount: number) =>
    `RWF ${amount.toLocaleString("en-US")}`;

  // Calculate spending for every month of the current year.
  const monthlySpendingTrend = Array.from(
    { length: 12 },
    (_, monthIndex) => {
      const amount = expenses
        .filter((expense) => {
          const expenseDate = new Date(expense.date);

          return (
            !Number.isNaN(expenseDate.getTime()) &&
            expenseDate.getMonth() === monthIndex &&
            expenseDate.getFullYear() === currentYear
          );
        })
        .reduce(
          (total, expense) =>
            total + Number(expense.amount || 0),
          0
        );

      return {
        month: new Date(
          currentYear,
          monthIndex,
          1
        ).toLocaleString("en-US", { month: "short" }),
        amount,
      };
    }
  );

  const remainingBudget = monthlyBudget - totalSpent;

  const budgetProgress =
    monthlyBudget > 0
      ? Math.min((totalSpent / monthlyBudget) * 100, 100)
      : 0;

  const budgetUsagePercentage =
    monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0;

  const budgetStatus =
    monthlyBudget <= 0
      ? "No budget set"
      : totalSpent > monthlyBudget
        ? "Over budget"
        : budgetUsagePercentage >= 80
          ? "Approaching limit"
          : "Within budget";

  const recentExpenses = [...expenses]
    .filter((expense) => !Number.isNaN(new Date(expense.date).getTime()))
    .sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    .slice(0, 5);

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  const navigation: Page[] = [
    "Dashboard",
    "Expenses",
    "Budgets",
    "Reports",
    "Settings",
  ];

  function handleSignout() {
    signout();
    navigate("/signin");
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">R</div>
          <div>
            <h2>Retain</h2>
            <p>Personal Finance</p>
          </div>
        </div>

        <p className="menu-label">MAIN MENU</p>

        <nav className="navigation">
          {navigation.map((page) => (
            <button
              key={page}
              type="button"
              className={`nav-item ${
                activePage === page ? "active" : ""
              }`}
              onClick={() => setActivePage(page)}
            >
              <span className="nav-icon">
                {page === "Dashboard" && "▦"}
                {page === "Expenses" && "↗"}
                {page === "Budgets" && "◷"}
                {page === "Reports" && "▤"}
                {page === "Settings" && "⚙"}
              </span>
              {page}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-avatar">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>

          <div>
            <strong>{user?.name || "My Account"}</strong>
            <p>{user?.email || "Personal User"}</p>

            <button
              type="button"
              className="signout-button"
              onClick={handleSignout}
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <p className="breadcrumb">
              My Workspace / {activePage}
            </p>
            <h2>{activePage}</h2>
          </div>

          <div className="topbar-right">
            <span className="currency-label">Currency: RWF</span>
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
        </header>

        {activePage === "Dashboard" && (
          <section className="page-content">
            <div className="welcome-section">
              <div>
                <p className="eyebrow">
                  YOUR FINANCIAL OVERVIEW
                </p>
                <h1>Welcome, {user?.name || "User"}!</h1>
                <p>
                  Here is an overview of your personal finances.
                </p>
              </div>

              <button
                type="button"
                className="primary-button"
                onClick={() => setActivePage("Expenses")}
              >
                + Add Expense
              </button>
            </div>

            <div className="summary-grid">
              <article className="summary-card">
                <div className="card-heading">
                  <span>Monthly Budget</span>
                  <span className="card-icon gold">◷</span>
                </div>
                <h2>
                  {budgetLoading
                    ? "Loading..."
                    : formatRWF(monthlyBudget)}
                </h2>
                <p className="muted-text">
                  Saved budget for this month
                </p>
              </article>

              <article className="summary-card">
                <div className="card-heading">
                  <span>Total Spent</span>
                  <span className="card-icon blue">↗</span>
                </div>
                <h2>{formatRWF(totalSpent)}</h2>
                <p className="muted-text">
                  Expenses recorded this month
                </p>
              </article>

              <article className="summary-card">
                <div className="card-heading">
                  <span>Remaining Budget</span>
                  <span className="card-icon green">✓</span>
                </div>
                <h2>{formatRWF(remainingBudget)}</h2>
                <p className="muted-text">
                  {monthlyBudget > 0
                    ? "Remaining from your saved budget"
                    : "Save a monthly budget to track your balance"}
                </p>
              </article>

              <article className="summary-card">
                <div className="card-heading">
                  <span>Highest Expense</span>
                  <span className="card-icon red">↑</span>
                </div>
                <h2>{formatRWF(highestExpense)}</h2>
                <p className="muted-text">
                  Largest expense this month
                </p>
              </article>
            </div>

            <div className="dashboard-grid">
              <article className="content-card budget-overview">
                <div className="section-heading">
                  <div>
                    <h3>Budget Overview</h3>
                    <p>Monthly spending progress</p>
                  </div>

                  <span
                    className={`status-badge ${
                      budgetLoading
                        ? ""
                        : monthlyBudget <= 0
                          ? "no-budget"
                          : totalSpent > monthlyBudget
                            ? "over-budget"
                            : budgetUsagePercentage >= 80
                              ? "approaching-limit"
                              : "within-budget"
                    }`}
                  >
                    {budgetLoading ? "Loading..." : budgetStatus}
                  </span>
                </div>

                <div className="budget-numbers">
                  <strong>{formatRWF(totalSpent)} spent</strong>
                  <span>
                    of{" "}
                    {budgetLoading
                      ? "Loading..."
                      : formatRWF(monthlyBudget)}
                  </span>
                </div>

                <div className="progress-track">
                  <div
                    className="progress-value"
                    style={{
                      width: `${budgetProgress}%`,
                      background:
                        monthlyBudget > 0 &&
                        totalSpent > monthlyBudget
                          ? "#dc2626"
                          : budgetUsagePercentage >= 80
                            ? "#d97706"
                            : undefined,
                    }}
                  />
                </div>

                <p className="progress-caption">
                  {monthlyBudget > 0
                    ? `${Math.round(budgetUsagePercentage)}% of your saved budget used`
                    : "Create a budget to track your spending progress"}
                </p>

                {!budgetLoading && monthlyBudget > 0 && (
                  <div
                    role="status"
                    style={{
                      marginTop: "18px",
                      padding: "14px 16px",
                      borderRadius: "10px",
                      background:
                        totalSpent > monthlyBudget
                          ? "#fef2f2"
                          : budgetUsagePercentage >= 80
                            ? "#fffbeb"
                            : "#f0fdf4",
                      border: `1px solid ${
                        totalSpent > monthlyBudget
                          ? "#fecaca"
                          : budgetUsagePercentage >= 80
                            ? "#fde68a"
                            : "#bbf7d0"
                      }`,
                      color:
                        totalSpent > monthlyBudget
                          ? "#991b1b"
                          : budgetUsagePercentage >= 80
                            ? "#92400e"
                            : "#166534",
                    }}
                  >
                    <strong>
                      {totalSpent > monthlyBudget
                        ? "Budget exceeded"
                        : budgetUsagePercentage >= 80
                          ? "Budget warning"
                          : "You are on track"}
                    </strong>

                    <p style={{ margin: "6px 0 0" }}>
                      {totalSpent > monthlyBudget
                        ? `You have exceeded your monthly budget by ${formatRWF(
                            totalSpent - monthlyBudget
                          )}. Review your expenses to get back on track.`
                        : budgetUsagePercentage >= 80
                          ? `You have used ${Math.round(
                              budgetUsagePercentage
                            )}% of your monthly budget. Only ${formatRWF(
                              remainingBudget
                            )} remains.`
                          : `You have ${formatRWF(
                              remainingBudget
                            )} remaining in your monthly budget.`}
                    </p>
                  </div>
                )}
              </article>

              <article className="content-card quick-actions">
                <h3>Quick Actions</h3>
                <p>Manage your money in a few clicks.</p>

                <button
                  type="button"
                  className="action-link"
                  onClick={() => setActivePage("Expenses")}
                >
                  <span>＋</span>
                  <span>
                    <strong>Add an expense</strong>
                    <small>Record a purchase or payment</small>
                  </span>
                  <span>→</span>
                </button>

                <button
                  type="button"
                  className="action-link"
                  onClick={() => setActivePage("Budgets")}
                >
                  <span>◷</span>
                  <span>
                    <strong>Manage budgets</strong>
                    <small>Plan your monthly spending</small>
                  </span>
                  <span>→</span>
                </button>
              </article>
            </div>

            <article
              className="content-card dashboard-trend"
              style={{ marginTop: "24px" }}
            >
              <div className="section-heading">
                <div>
                  <h3>Monthly Spending Trend</h3>
                  <p>
                    Compare your spending across {currentYear}.
                  </p>
                </div>
              </div>

              <div
                style={{
                  width: "100%",
                  height: "300px",
                  marginTop: "20px",
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlySpendingTrend}
                    margin={{
                      top: 10,
                      right: 12,
                      left: 12,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                    />

                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
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
                        formatRWF(Number(value ?? 0)),
                        "Total spent",
                      ]}
                      labelFormatter={(label) => `Month: ${label}`}
                    />

                    <Bar
                      dataKey="amount"
                      name="Total spent"
                      fill="#d4a72c"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={42}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <p className="muted-text">
                Months without recorded expenses appear as zero.
                Only expenses dated in {currentYear} are included.
              </p>
            </article>

            <article
              className="content-card recent-expenses"
              style={{ marginTop: "24px" }}
            >
              <div className="section-heading">
                <div>
                  <h3>Recent Expenses</h3>
                  <p>Your five most recent recorded expenses</p>
                </div>

                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setActivePage("Expenses")}
                >
                  View All
                </button>
              </div>

              {recentExpenses.length === 0 ? (
                <p className="muted-text">
                  No expenses recorded yet. Add your first expense to
                  see it here.
                </p>
              ) : (
                <div className="recent-expenses-list">
                  {recentExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="recent-expense-row"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "16px",
                        padding: "14px 0",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      <div>
                        <strong>
                          {"description" in expense &&
                          typeof expense.description === "string"
                            ? expense.description
                            : "title" in expense &&
                                typeof expense.title === "string"
                              ? expense.title
                              : expense.category || "Expense"}
                        </strong>

                        <p
                          className="muted-text"
                          style={{ margin: "5px 0 0" }}
                        >
                          {expense.category || "Other"} ·{" "}
                          {new Date(expense.date).toLocaleDateString()}
                        </p>
                      </div>

                      <strong>
                        {formatRWF(Number(expense.amount || 0))}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </section>
        )}

        {activePage === "Expenses" && (
          <section className="page-content">
            <Expenses />
          </section>
        )}

        {activePage === "Budgets" && (
          <section className="page-content">
            <Budgets />
          </section>
        )}

        {activePage === "Reports" && (
          <section className="page-content">
            <h1>Reports</h1>
            <p>
              Review your spending patterns and financial progress.
            </p>

            <div className="summary-grid">
              <article className="summary-card">
                <div className="card-heading">
                  <span>Total Spent This Month</span>
                  <span className="card-icon blue">↗</span>
                </div>
                <h2>{formatRWF(totalSpent)}</h2>
                <p className="muted-text">
                  All recorded expenses this month
                </p>
              </article>

              <article className="summary-card">
                <div className="card-heading">
                  <span>Monthly Budget</span>
                  <span className="card-icon gold">◷</span>
                </div>
                <h2>
                  {budgetLoading
                    ? "Loading..."
                    : formatRWF(monthlyBudget)}
                </h2>
                <p className="muted-text">
                  Your saved monthly budget
                </p>
              </article>

              <article className="summary-card">
                <div className="card-heading">
                  <span>Remaining Budget</span>
                  <span className="card-icon green">✓</span>
                </div>
                <h2>{formatRWF(remainingBudget)}</h2>
                <p className="muted-text">
                  Budget minus monthly expenses
                </p>
              </article>
            </div>

            <article
              className="content-card"
              style={{ marginTop: "24px" }}
            >
              <h3>Highest Expense This Month</h3>
              <h2>{formatRWF(highestExpense)}</h2>
              <p>
                Largest single expense recorded this month.
              </p>
            </article>

            <article
              className="content-card"
              style={{ marginTop: "24px" }}
            >
              <h3>Spending by Category</h3>
              <p>
                See how much you have spent in each category this month.
              </p>

              {Object.keys(spendingByCategory).length === 0 ? (
                <p>No expenses recorded for this month yet.</p>
              ) : (
                Object.entries(spendingByCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, amount]) => {
                    const percentage =
                      totalSpent > 0
                        ? (amount / totalSpent) * 100
                        : 0;

                    return (
                      <div
                        key={category}
                        style={{
                          padding: "14px 0",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "16px",
                            marginBottom: "8px",
                          }}
                        >
                          <strong>{category}</strong>
                          <strong>{formatRWF(amount)}</strong>
                        </div>

                        <div
                          style={{
                            height: "8px",
                            background: "#eee",
                            borderRadius: "8px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${percentage}%`,
                              background: "#d4a72c",
                              borderRadius: "8px",
                            }}
                          />
                        </div>

                        <p className="muted-text">
                          {percentage.toFixed(1)}% of monthly spending
                        </p>
                      </div>
                    );
                  })
              )}
            </article>
          </section>
        )}

        {activePage === "Settings" && (
          <section className="page-content">
            <h1>Settings</h1>
            <p>Manage your Retain account preferences.</p>

            <article className="content-card">
              <h3>Account Settings</h3>
              <p>
                <strong>Name:</strong> {user?.name}
              </p>
              <p>
                <strong>Email:</strong> {user?.email}
              </p>
              <p>
                <strong>Role:</strong> {user?.role}
              </p>
            </article>
          </section>
        )}
      </main>
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/signin"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <Signin />
        }
      />

      <Route
        path="/signup"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <Signup />
        }
      />

      <Route
        path="/"
        element={
          isAuthenticated ? (
            <ProtectedLayout />
          ) : (
            <Navigate to="/signin" replace />
          )
        }
      />

      <Route
        path="*"
        element={
          <main className="auth-page">
            <div className="auth-card">
              <h1>Page not found</h1>
              <p>The page you requested does not exist.</p>
              <Link to="/">Return to Retain</Link>
            </div>
          </main>
        }
      />
    </Routes>
  );
}

function App() {
  return <AppRoutes />;
}

export default App;