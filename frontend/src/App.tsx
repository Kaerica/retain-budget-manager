
import { useState } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { useSelector } from "react-redux";

import type { RootState } from "./store/store";
import Expenses from "./pages/Expenses";
import Budgets from "./pages/Budgets";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import { useAuth } from "./context/AuthContext";

import "./App.css";

type Page = "Dashboard" | "Expenses" | "Budgets" | "Reports" | "Settings";

function ProtectedLayout() {
  const { user, isAuthenticated, signout } = useAuth();
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState<Page>("Dashboard");

  const expenses = useSelector(
    (state: RootState) => state.expenses.expenses
  );

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

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

  const highestExpense = monthlyExpenses.reduce(
    (highest, expense) =>
      Math.max(highest, Number(expense.amount || 0)),
    0
  );

  const formatRWF = (amount: number) =>
    `RWF ${amount.toLocaleString("en-US")}`;

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
                <p className="eyebrow">YOUR FINANCIAL OVERVIEW</p>
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
                <h2>RWF 300,000</h2>
                <p className="muted-text">Example monthly budget</p>
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
                <h2>{formatRWF(300000 - totalSpent)}</h2>
                <p className="muted-text">
                  Based on the example RWF 300,000 budget
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

                  <span className="status-badge">
                    {totalSpent > 300000
                      ? "Over budget"
                      : totalSpent >= 240000
                        ? "Approaching limit"
                        : "Within budget"}
                  </span>
                </div>

                <div className="budget-numbers">
                  <strong>{formatRWF(totalSpent)} spent</strong>
                  <span>of RWF 300,000</span>
                </div>

                <div className="progress-track">
                  <div
                    className="progress-value"
                    style={{
                      width: `${Math.min(
                        (totalSpent / 300000) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>

                <p className="progress-caption">
                  {Math.round((totalSpent / 300000) * 100)}% of the
                  example budget used
                </p>
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

            <article className="content-card">
              <h3>Spending Reports</h3>
              <p>Reports will be added in a later step.</p>
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
