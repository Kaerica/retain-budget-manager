
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import type { RootState } from "./store/store";
import { getBudgets } from "./services/budgetService";
import Expenses from "./pages/Expenses";
import Budgets from "./pages/Budgets";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import { useAuth } from "./context/AuthContext";
import { formatCurrency, getSavedCurrency } from "./utils/currency";

import "./App.css";

type Page =
  | "Dashboard"
  | "Expenses"
  | "Budgets"
  | "Reports"
  | "Settings";

type DashboardPeriod = "month" | "year";

const CHART_COLORS = [
  "#d4a72c",
  "#243b64",
  "#16a34a",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#ea580c",
  "#64748b",
];

function ProtectedLayout() {
  const { user, isAuthenticated, signout } = useAuth();
  const navigate = useNavigate();

  const [activePage, setActivePage] = useState<Page>("Dashboard");
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [budgetLoading, setBudgetLoading] = useState(true);
  const [dashboardPeriod, setDashboardPeriod] =
    useState<DashboardPeriod>("month");

  const expenses = useSelector(
    (state: RootState) => state.expenses.expenses
  );

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

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

  const isValidExpenseDate = (date: string | Date) => {
    return !Number.isNaN(new Date(date).getTime());
  };

  const getExpenseAmount = (amount: number | string) => {
    const parsedAmount = Number(amount);
    return Number.isFinite(parsedAmount) ? parsedAmount : 0;
  };

  // Spending for the current month.
  const monthlyExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);

    return (
      isValidExpenseDate(expense.date) &&
      expenseDate.getMonth() === currentMonth &&
      expenseDate.getFullYear() === currentYear
    );
  });

  const monthlyTotalSpent = monthlyExpenses.reduce(
    (total, expense) =>
      total + getExpenseAmount(expense.amount),
    0
  );

  // Spending for the previous calendar month.
  const previousMonthDate = new Date(
    currentYear,
    currentMonth - 1,
    1
  );

  const previousMonth = previousMonthDate.getMonth();
  const previousMonthYear = previousMonthDate.getFullYear();

  const previousMonthExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);

    return (
      isValidExpenseDate(expense.date) &&
      expenseDate.getMonth() === previousMonth &&
      expenseDate.getFullYear() === previousMonthYear
    );
  });

  const previousMonthTotal = previousMonthExpenses.reduce(
    (total, expense) =>
      total + getExpenseAmount(expense.amount),
    0
  );

  const spendingDifference =
    monthlyTotalSpent - previousMonthTotal;

  const spendingChangePercentage =
    previousMonthTotal > 0
      ? (spendingDifference / previousMonthTotal) * 100
      : null;

  // All expenses from the current calendar year.
  const yearlyExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);

    return (
      isValidExpenseDate(expense.date) &&
      expenseDate.getFullYear() === currentYear
    );
  });

  // The dashboard filter changes the spending summaries and category chart.
  const displayedExpenses =
    dashboardPeriod === "month"
      ? monthlyExpenses
      : yearlyExpenses;

  const totalSpent = displayedExpenses.reduce(
    (total, expense) =>
      total + getExpenseAmount(expense.amount),
    0
  );

  const spendingByCategory = displayedExpenses.reduce<
    Record<string, number>
  >((totals, expense) => {
    const category = expense.category || "Other";

    totals[category] =
      (totals[category] || 0) +
      getExpenseAmount(expense.amount);

    return totals;
  }, {});

  const categoryChartData = Object.entries(spendingByCategory)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const highestExpense = displayedExpenses.reduce(
    (highest, expense) =>
      Math.max(highest, getExpenseAmount(expense.amount)),
    0
  );

  const formatRWF = (amount: number) => formatCurrency(amount);

  // Twelve-month chart for the current calendar year.
  const monthlySpendingTrend = Array.from(
    { length: 12 },
    (_, monthIndex) => {
      const amount = expenses
        .filter((expense) => {
          const expenseDate = new Date(expense.date);

          return (
            isValidExpenseDate(expense.date) &&
            expenseDate.getMonth() === monthIndex &&
            expenseDate.getFullYear() === currentYear
          );
        })
        .reduce(
          (total, expense) =>
            total + getExpenseAmount(expense.amount),
          0
        );

      return {
        month: new Date(currentYear, monthIndex, 1).toLocaleString(
          "en-US",
          { month: "short" }
        ),
        amount,
      };
    }
  );

  // Budget calculations always use current-month spending.
  const remainingBudget = monthlyBudget - monthlyTotalSpent;

  const budgetProgress =
    monthlyBudget > 0
      ? Math.min((monthlyTotalSpent / monthlyBudget) * 100, 100)
      : 0;

  const budgetUsagePercentage =
    monthlyBudget > 0
      ? (monthlyTotalSpent / monthlyBudget) * 100
      : 0;

  const budgetStatus =
    monthlyBudget <= 0
      ? "No budget set"
      : monthlyTotalSpent > monthlyBudget
        ? "Over budget"
        : budgetUsagePercentage >= 80
          ? "Approaching limit"
          : "Within budget";

  const recentExpenses = [...expenses]
    .filter((expense) => isValidExpenseDate(expense.date))
    .sort(
      (a, b) =>
        new Date(b.date).getTime() -
        new Date(a.date).getTime()
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
            <span className="currency-label">
              Currency: {getSavedCurrency()}
            </span>
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

            {/* Dashboard spending period filter */}
            <div className="dashboard-filter">
              <span>View spending:</span>

              <div
                className="dashboard-filter-options"
                role="group"
                aria-label="Choose dashboard spending period"
              >
                <button
                  type="button"
                  className={
                    dashboardPeriod === "month" ? "active" : ""
                  }
                  aria-pressed={dashboardPeriod === "month"}
                  onClick={() => setDashboardPeriod("month")}
                >
                  This Month
                </button>

                <button
                  type="button"
                  className={
                    dashboardPeriod === "year" ? "active" : ""
                  }
                  aria-pressed={dashboardPeriod === "year"}
                  onClick={() => setDashboardPeriod("year")}
                >
                  This Year
                </button>
              </div>
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
                  <span>
                    {dashboardPeriod === "month"
                      ? "Total Spent"
                      : "Year-to-Date Spending"}
                  </span>
                  <span className="card-icon blue">↗</span>
                </div>
                <h2>{formatRWF(totalSpent)}</h2>
                <p className="muted-text">
                  {dashboardPeriod === "month"
                    ? "Expenses recorded this month"
                    : `Expenses recorded in ${currentYear}`}
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
                    ? "Based on this month's spending"
                    : "Save a monthly budget to track your balance"}
                </p>
              </article>

              <article className="summary-card">
                <div className="card-heading">
                  <span>
                    {dashboardPeriod === "month"
                      ? "Highest Expense"
                      : "Highest Expense This Year"}
                  </span>
                  <span className="card-icon red">↑</span>
                </div>
                <h2>{formatRWF(highestExpense)}</h2>
                <p className="muted-text">
                  Largest expense in the selected period
                </p>
              </article>

              <article className="summary-card">
                <div className="card-heading">
                  <span>Spending vs Last Month</span>
                  <span
                    className={`card-icon ${
                      spendingDifference > 0
                        ? "red"
                        : spendingDifference < 0
                          ? "green"
                          : "gold"
                    }`}
                  >
                    {spendingDifference > 0
                      ? "↑"
                      : spendingDifference < 0
                        ? "↓"
                        : "="}
                  </span>
                </div>

                <h2>
                  {spendingChangePercentage === null
                    ? "N/A"
                    : `${Math.abs(
                        spendingChangePercentage
                      ).toFixed(1)}%`}
                </h2>

                <p className="muted-text">
                  {previousMonthTotal === 0
                    ? "No spending recorded last month for comparison"
                    : spendingDifference > 0
                      ? `${formatRWF(
                          spendingDifference
                        )} more than last month`
                      : spendingDifference < 0
                        ? `${formatRWF(
                            Math.abs(spendingDifference)
                          )} less than last month`
                        : "Same spending as last month"}
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
                          : monthlyTotalSpent > monthlyBudget
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
                  <strong>
                    {formatRWF(monthlyTotalSpent)} spent
                  </strong>
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
                        monthlyTotalSpent > monthlyBudget
                          ? "#dc2626"
                          : budgetUsagePercentage >= 80
                            ? "#d97706"
                            : undefined,
                    }}
                  />
                </div>

                <p className="progress-caption">
                  {monthlyBudget > 0
                    ? `${Math.round(
                        budgetUsagePercentage
                      )}% of your saved budget used`
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
                        monthlyTotalSpent > monthlyBudget
                          ? "#fef2f2"
                          : budgetUsagePercentage >= 80
                            ? "#fffbeb"
                            : "#f0fdf4",
                      border: `1px solid ${
                        monthlyTotalSpent > monthlyBudget
                          ? "#fecaca"
                          : budgetUsagePercentage >= 80
                            ? "#fde68a"
                            : "#bbf7d0"
                      }`,
                      color:
                        monthlyTotalSpent > monthlyBudget
                          ? "#991b1b"
                          : budgetUsagePercentage >= 80
                            ? "#92400e"
                            : "#166534",
                    }}
                  >
                    <strong>
                      {monthlyTotalSpent > monthlyBudget
                        ? "Budget exceeded"
                        : budgetUsagePercentage >= 80
                          ? "Budget warning"
                          : "You are on track"}
                    </strong>

                    <p style={{ margin: "6px 0 0" }}>
                      {monthlyTotalSpent > monthlyBudget
                        ? `You have exceeded your monthly budget by ${formatRWF(
                            monthlyTotalSpent - monthlyBudget
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
              className="content-card dashboard-category-chart"
              style={{ marginTop: "24px" }}
            >
              <div className="section-heading">
                <div>
                  <h3>Spending by Category</h3>
                  <p>
                    {dashboardPeriod === "month"
                      ? "Category breakdown for this month."
                      : `Category breakdown for ${currentYear}.`}
                  </p>
                </div>
              </div>

              {categoryChartData.length === 0 ? (
                <p className="muted-text" style={{ marginTop: "20px" }}>
                  No expenses recorded for this period yet. Add expenses
                  to see your category breakdown.
                </p>
              ) : (
                <>
                  <div
                    style={{
                      width: "100%",
                      height: "320px",
                      marginTop: "16px",
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          dataKey="amount"
                          nameKey="category"
                          cx="50%"
                          cy="45%"
                          outerRadius={100}
                          innerRadius={55}
                          paddingAngle={3}
                          label={({ percent }) =>
                            `${((percent ?? 0) * 100).toFixed(0)}%`
                          }
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell
                              key={entry.category}
                              fill={
                                CHART_COLORS[
                                  index % CHART_COLORS.length
                                ]
                              }
                            />
                          ))}
                        </Pie>

                        <Tooltip
                          formatter={(value) => [
                            formatRWF(Number(value ?? 0)),
                            "Amount spent",
                          ]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ marginTop: "12px" }}>
                    {categoryChartData.map((item, index) => (
                      <div
                        key={item.category}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "12px",
                          padding: "12px 0",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <span
                            aria-hidden="true"
                            style={{
                              width: "12px",
                              height: "12px",
                              minWidth: "12px",
                              borderRadius: "3px",
                              backgroundColor:
                                CHART_COLORS[
                                  index % CHART_COLORS.length
                                ],
                            }}
                          />
                          <span>{item.category}</span>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <strong>{formatRWF(item.amount)}</strong>
                          <p
                            className="muted-text"
                            style={{ margin: "4px 0 0" }}
                          >
                            {item.percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
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
                        {formatRWF(getExpenseAmount(expense.amount))}
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
            <Reports />
          </section>
        )}

        {activePage === "Settings" && (
          <section className="page-content">
            <Settings />
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
