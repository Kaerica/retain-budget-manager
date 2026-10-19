
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { getBudgets, saveBudget } from "../services/budgetService";
import { formatCurrency, getSavedCurrency } from "../utils/currency";

function Budgets() {
  const expenses = useSelector(
    (state: RootState) => state.expenses.expenses
  );

  // Starts empty: each user sets their own budget (300000 is only shown as an example).
  const [amount, setAmount] = useState("");
  const [savedAmount, setSavedAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();
  const currency = getSavedCurrency();

  useEffect(() => {
    async function loadBudget() {
      try {
        setError("");

        const budgets = await getBudgets();
        const currentBudget = budgets.find(
          (budget) => budget.month === month && budget.year === year
        );

        if (currentBudget) {
          setAmount(String(currentBudget.amount));
          setSavedAmount(Number(currentBudget.amount));
        } else {
          setSavedAmount(null);
        }
      } catch {
        setError(
          "Could not load your budget. Please sign in and try again."
        );
      } finally {
        setLoading(false);
      }
    }

    loadBudget();
  }, [month, year]);

  const monthlyExpenses = expenses
    .filter((expense) => {
      const expenseDate = new Date(`${expense.date}T00:00:00`);

      return (
        expenseDate.getMonth() + 1 === month &&
        expenseDate.getFullYear() === year
      );
    })
    .reduce((total, expense) => total + Number(expense.amount), 0);

  const budgetAmount = Number(amount) || 0;
  const remaining = budgetAmount - monthlyExpenses;
  const percentage =
    budgetAmount > 0
      ? Math.min((monthlyExpenses / budgetAmount) * 100, 100)
      : 0;

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    const value = Number(amount);

    if (!Number.isFinite(value) || value <= 0) {
      setError("Please enter a budget amount greater than zero.");
      return;
    }

    try {
      setSaving(true);

      const savedBudget = await saveBudget({
        amount: value,
        month,
        year,
      });

      setAmount(String(savedBudget.amount));
      setSavedAmount(Number(savedBudget.amount));
      setMessage("Your monthly budget was saved successfully.");
    } catch {
      setError(
        "Could not save your budget. Please check that you are signed in and try again."
      );
    } finally {
      setSaving(false);
    }
  }

  const monthName = today.toLocaleDateString("en", {
    month: "long",
    year: "numeric",
  });

  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "22px",
  };

  if (loading) {
    return (
      <main style={{ padding: "32px", color: "#1e293b" }}>
        <h1>Monthly Budget</h1>
        <p>Loading your budget...</p>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "clamp(16px, 4vw, 32px) clamp(4px, 3vw, 24px)",
        color: "#1e293b",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      <header style={{ marginBottom: "28px" }}>
        <p
          style={{
            color: "#b8860b",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          Your financial plan
        </p>

        <h1 style={{ marginBottom: "8px" }}>Monthly Budget</h1>

        <p style={{ color: "#64748b" }}>
          Set your spending limit and keep track of your money.
        </p>

        <p style={{ fontWeight: 600 }}>{monthName}</p>
      </header>

      {error && (
        <div
          role="alert"
          style={{
            background: "#fef2f2",
            color: "#b91c1c",
            padding: "14px",
            borderRadius: "8px",
            marginBottom: "18px",
          }}
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          style={{
            background: "#ecfdf5",
            color: "#047857",
            padding: "14px",
            borderRadius: "8px",
            marginBottom: "18px",
          }}
        >
          {message}
        </div>
      )}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "18px",
          marginBottom: "24px",
        }}
      >
        <div style={cardStyle}>
          <p style={{ color: "#64748b", marginTop: 0 }}>Monthly budget</p>
          <h2>{budgetAmount > 0 ? formatCurrency(budgetAmount) : "Not set"}</h2>
          <p style={{ color: "#64748b", marginBottom: 0 }}>
            {budgetAmount > 0
              ? "Your planned spending limit"
              : "Enter your budget below to start tracking"}
          </p>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "#64748b", marginTop: 0 }}>Money spent</p>
          <h2 style={{ color: "#b45309" }}>
            {formatCurrency(monthlyExpenses)}
          </h2>
          <p style={{ color: "#64748b", marginBottom: 0 }}>
            Expenses recorded this month
          </p>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "#64748b", marginTop: 0 }}>Money remaining</p>
          <h2 style={{ color: remaining < 0 ? "#dc2626" : "#047857" }}>
            {formatCurrency(remaining)}
          </h2>
          <p style={{ color: "#64748b", marginBottom: 0 }}>
            {remaining < 0
              ? "You have exceeded your budget."
              : "Available within your budget"}
          </p>
        </div>
      </section>

      <section style={{ ...cardStyle, marginBottom: "24px" }}>
        <h2 style={{ marginTop: 0 }}>Set or edit your budget</h2>

        <p style={{ color: "#64748b" }}>
          Enter the amount you want to spend during {monthName}.
        </p>

        <form onSubmit={handleSave}>
          <label
            htmlFor="budget-amount"
            style={{
              display: "block",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            Monthly budget amount ({currency})
          </label>

          <input
            id="budget-amount"
            type="number"
            min="1"
            step="1"
            placeholder="e.g. 300000"
            aria-describedby="budget-example"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              setMessage("");
            }}
            required
            style={{
              width: "100%",
              maxWidth: "420px",
              boxSizing: "border-box",
              padding: "12px",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              fontSize: "16px",
              marginBottom: "8px",
            }}
          />

          <p
            id="budget-example"
            style={{
              margin: "0 0 16px",
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "2px 8px",
                marginRight: "6px",
                borderRadius: "999px",
                background: "#fef3c7",
                color: "#92400e",
                fontWeight: 700,
              }}
            >
              Example
            </span>
            {formatCurrency(300000)} — type your own amount for {monthName}.
          </p>

          <div>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: "#172554",
                color: "#ffffff",
                border: 0,
                borderRadius: "8px",
                padding: "12px 22px",
                fontWeight: 600,
                cursor: saving ? "wait" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving
                ? "Saving..."
                : savedAmount !== null
                  ? "Update Budget"
                  : "Save Budget"}
            </button>
          </div>
        </form>
      </section>

      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Spending progress</h2>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "10px",
          }}
        >
          <span>{percentage.toFixed(1)}% of budget used</span>
          <span>{formatCurrency(monthlyExpenses)} spent</span>
        </div>

        <div
          style={{
            width: "100%",
            height: "14px",
            background: "#e2e8f0",
            borderRadius: "20px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${percentage}%`,
              height: "100%",
              background:
                percentage >= 100
                  ? "#dc2626"
                  : percentage >= 80
                    ? "#d97706"
                    : "#059669",
              borderRadius: "20px",
              transition: "width 0.3s ease",
            }}
          />
        </div>

        <p style={{ color: "#64748b", marginBottom: 0 }}>
          {budgetAmount <= 0
            ? "Set a budget to track your spending progress."
            : percentage >= 100
              ? "You have reached or exceeded your spending limit."
              : percentage >= 80
                ? "You are approaching your budget limit."
                : "You are within your planned spending limit."}
        </p>
      </section>
    </main>
  );
}

export default Budgets;
