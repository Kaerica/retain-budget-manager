
import { useState } from 'react';
import './index.css';

type SummaryCardProps = {
  title: string;
  value: string;
  description: string;
  icon: string;
};

function SummaryCard({
  title,
  value,
  description,
  icon,
}: SummaryCardProps) {
  return (
    <article className="summary-card">
      <div className="summary-card-top">
        <span>{title}</span>
        <span className="summary-icon">{icon}</span>
      </div>
      <h2>{value}</h2>
      <p>{description}</p>
    </article>
  );
}

function App() {
  const [selectedMonth, setSelectedMonth] = useState('October 2026');

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <a className="brand" href="/">
          <span className="brand-icon">R</span>
          <span>Retain</span>
        </a>

        <p className="sidebar-label">WORKSPACE</p>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <a className="nav-link active" href="#dashboard">▦ Dashboard</a>
          <a className="nav-link" href="#expenses">↔ Expenses</a>
          <a className="nav-link" href="#budgets">◷ Budgets</a>
          <a className="nav-link" href="#reports">▥ Reports</a>
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-avatar">E</div>
          <div>
            <strong>Erica</strong>
            <span>Personal account</span>
          </div>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div>
            <span className="eyebrow">PERSONAL FINANCE</span>
            <h1>Dashboard</h1>
          </div>

          <label className="month-picker">
            <span>Month</span>
            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
            >
              <option>October 2026</option>
              <option>September 2026</option>
              <option>August 2026</option>
            </select>
          </label>
        </header>

        <section className="welcome-section">
          <div>
            <p className="eyebrow">YOUR MONEY, YOUR PLAN</p>
            <h2>Welcome back, Erica 👋</h2>
            <p>Understand your spending and make every decision count.</p>
          </div>
          <div className="welcome-decoration" aria-hidden="true">R</div>
        </section>

        <section className="summary-grid" aria-label="Financial summary">
          <SummaryCard
            title="Monthly budget"
            value="RWF 300,000"
            description="Your planned spending limit"
            icon="◷"
          />
          <SummaryCard
            title="Total spent"
            value="RWF 185,500"
            description="61.8% of your monthly budget"
            icon="↗"
          />
          <SummaryCard
            title="Remaining budget"
            value="RWF 114,500"
            description="Available for the rest of the month"
            icon="◈"
          />
          <SummaryCard
            title="Highest expense"
            value="RWF 65,000"
            description="Your largest individual expense"
            icon="↑"
          />
        </section>

        <section className="content-panel">
          <div>
            <p className="eyebrow">GETTING STARTED</p>
            <h2>Your financial overview</h2>
            <p>
              Your dashboard is ready for the next step. Soon, you will be
              able to record expenses, set budgets, and explore spending
              reports.
            </p>
          </div>
          <div className="progress-track" aria-label="Illustrative budget usage">
            <div className="progress-fill" />
          </div>
          <p className="progress-caption">Illustrative budget usage: 61.8%</p>
        </section>

        <footer className="app-footer">
          Retain · Take control of your spending
        </footer>
      </main>
    </div>
  );
}

export default App;
