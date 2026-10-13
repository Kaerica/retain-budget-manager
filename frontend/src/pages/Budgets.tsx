
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";

const STORAGE_KEY = "retain-monthly-budget";

export default function Budgets() {
  const expenses = useSelector(
    (state: RootState) => state.expenses.expenses
  );

  const [budgetInput, setBudgetInput] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) ?? "300000";
  });

  const [budget, setBudget] = useState(() => {
    return Number(localStorage.getItem(STORAGE_KEY) ?? "300000");
  });

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const spent = expenses
    .filter((expense) => {
      const date = new Date(expense.date);
      return (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      );
    })
    .reduce((total, expense) => total + expense.amount, 0);

  const remaining = budget - spent;
  const percentage =
    budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(budget));
  }, [budget]);

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const amount = Number(budgetInput);

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Please enter a budget greater than zero.");
      return;
    }

    setBudget(amount);
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

          <button type="submit">Save Budget</button>
        </form>

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
              {spent > budget
                ? "Over budget"
                : percentage >= 80
                  ? "Approaching budget limit"
                  : "Within budget"}
            </strong>
          </p>
        </div>
      </div>
    </section>
  );
}
