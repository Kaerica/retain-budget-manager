
import { useState } from "react";
import Expenses from "./pages/Expenses";
import "./App.css";

type Page = "Dashboard" | "Expenses" | "Budgets" | "Reports" | "Settings";

function App() {
  const [activePage, setActivePage] = useState<Page>("Dashboard");

  const navigation: Page[] = [
    "Dashboard",
    "Expenses",
    "Budgets",
    "Reports",
    "Settings",
  ];

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
          <div className="profile-avatar">U</div>
          <div>
            <strong>My Account</strong>
            <p>Personal User</p>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <p className="breadcrumb">My Workspace / {activePage}</p>
            <h2>{activePage}</h2>
          </div>

          <div className="topbar-right">
            <span className="currency-label">Currency: RWF</span>
            <div className="user-avatar">U</div>
          </div>
        </header>

        {activePage === "Dashboard" && (
          <section className="page-content">
            <div className="welcome-section">
              <div>
                <p className="eyebrow">YOUR FINANCIAL OVERVIEW</p>
                <h1>Welcome back!</h1>
                <p>
                  Here is an overview of your personal finances.
                </p>
              </div>

              <button
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
                <h2>RWF 185,500</h2>
                <p className="muted-text">Example monthly spending</p>
              </article>

              <article className="summary-card">
                <div className="card-heading">
                  <span>Remaining Budget</span>
                  <span className="card-icon green">✓</span>
                </div>
                <h2>RWF 114,500</h2>
                <p className="muted-text">Example remaining balance</p>
              </article>

              <article className="summary-card">
                <div className="card-heading">
                  <span>Highest Expense</span>
                  <span className="card-icon red">↑</span>
                </div>
                <h2>RWF 65,000</h2>
                <p className="muted-text">Example highest expense</p>
              </article>
            </div>

            <div className="dashboard-grid">
              <article className="content-card budget-overview">
                <div className="section-heading">
                  <div>
                    <h3>Budget Overview</h3>
                    <p>Example monthly budget progress</p>
                  </div>
                  <span className="status-badge">On track</span>
                </div>

                <div className="budget-numbers">
                  <strong>RWF 185,500 spent</strong>
                  <span>of RWF 300,000</span>
                </div>

                <div className="progress-track">
                  <div className="progress-value" />
                </div>

                <p className="progress-caption">62% of example budget used</p>
              </article>

              <article className="content-card quick-actions">
                <h3>Quick Actions</h3>
                <p>Manage your money in a few clicks.</p>

                <button
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

        {activePage === "Expenses" && <Expenses />}

        {activePage === "Budgets" && (
          <section className="page-content">
            <h1>Budgets</h1>
            <p>Plan how much you want to spend each month.</p>
            <article className="content-card">
              <h3>Monthly Budgets</h3>
              <p>
                The budget creation form will be our next step.
              </p>
            </article>
          </section>
        )}

        {activePage === "Reports" && (
          <section className="page-content">
            <h1>Reports</h1>
            <p>Review your spending patterns and financial progress.</p>
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
              <p>Account settings will be added in a later step.</p>
            </article>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
