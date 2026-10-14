
import { useEffect, useState, type FormEvent } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { getBudgets, saveBudget } from "../services/budgetService";

export default function Budgets() {
  const expenses = useSelector(
    (state: RootState) => state.expenses.expenses
  );

  const [budgetInput, setBudgetInput] = useState("");
  const [budget, setBudget] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  useEffect(() => {
    let cancelled = false;

    async function loadBudget() {
      setLoading(true);
      setError("");

      try {
        const budgets = await getBudgets();

        const currentBudget = budgets.find(
          (item) =>
            item.month === currentMonth + 1 &&
            item.year === currentYear
        );

        if (!cancelled) {
          const amount = currentBudget
            ? Number(currentBudget.amount)
            : 0;

          setBudget(amount);
          setBudgetInput(amount > 0 ? String(amount) : "");
        }
      } catch {
        if (!cancelled) {
          setError(
            "Could not load your budget. Please sign in again and retry."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBudget();

    return () => {
      cancelled = true;
    };
  }, [currentMonth, currentYear]);

  const spent = expenses
    .filter((expense) => {
      const date = new Date(`${expense.date}T00:00:00`);

      return (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      );
    })
    .reduce((total, expense) => total + expense.amount, 0);

  const remaining = budget - spent;
  const percentage =
    budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const amount = Number(budgetInput);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a budget greater than zero.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const savedBudget = await saveBudget({
        amount,
        month: currentMonth + 1,
        year: currentYear,
      });

      setBudget(Number(savedBudget.amount));
      setBudgetInput(String(savedBudget.amount));
      setMessage("Your monthly budget has been saved successfully.");
    } catch {
      setError(
        "Could not save your budget. Please check your sign-in and try again."
      );
    } finally {
      setSaving(false);
    }
  }

  const money = (amount: number) =>
    new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <section className="page">
      <h1>Monthly Budget</h1>
      <p>Set a monthly spending limit and track your progress.</p>

      <div className="budget-card">
        <h2>Your monthly budget</h2>

        <p>
          Budget period:{" "}
          <strong>
            {today.toLocaleDateString("en", {
              month: "long",
              year: "numeric",
            })}
          </strong>
        </p>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        {message && (
          <p role="status">
            {message}
          </p>
        )}

        <form onSubmit={handleSave}>
          <label htmlFor="monthly-budget">
            Budget amount (RWF)
          </label>

          <input
            id="monthly-budget"
            type="number"
            min="1"
            step="1"
            value={budgetInput}
            onChange={(event) => setBudgetInput(event.target.value)}
            required
          />

          <button type="submit" disabled={loading || saving}>
            {loading
              ? "Loading..."
              : saving
                ? "Saving..."
                : "Save Budget"}
          </button>
        </form>

        {loading ? (
          <p>Loading your budget...</p>
        ) : (
          <div className="budget-summary">
            <p>
              Monthly limit: <strong>{money(budget)}</strong>
            </p>

            <p>
              Total spent: <strong>{money(spent)}</strong>
            </p>

            <p>
              Remaining: <strong>{money(remaining)}</strong>
            </p>

            <div
              className="budget-progress"
              role="progressbar"
              aria-label="Monthly budget used"
              aria-valuenow={Math.round(percentage)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="budget-progress-fill"
                style={{ width: `${percentage}%` }}
              />
            </div>

            <p>{percentage.toFixed(1)}% of your budget used</p>

            <p>
              Status:{" "}
              <strong>
                {budget <= 0
                  ? "No budget set"
                  : spent > budget
                    ? "Over budget"
                    : percentage >= 80
                      ? "Approaching budget limit"
                      : "Within budget"}
              </strong>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
