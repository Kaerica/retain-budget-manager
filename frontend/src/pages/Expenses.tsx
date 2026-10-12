import { useEffect, useState } from "react";

interface Expense {
  id: number;
  title: string;
  category: string;
  amount: number;
  date: string;
}

const STORAGE_KEY = "retain-expenses";

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as Expense[]) : [];
    } catch {
      return [];
    }
  });

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses]);

  function resetForm() {
    setTitle("");
    setCategory("Food");
    setAmount("");
    setDate(new Date().toISOString().slice(0, 10));
    setEditingId(null);
    setError("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const numericAmount = Number(amount);

    if (!title.trim()) {
      setError("Please enter an expense name.");
      return;
    }

    if (!amount || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Please enter an amount greater than zero.");
      return;
    }

    if (!date) {
      setError("Please select an expense date.");
      return;
    }

    if (editingId !== null) {
      setExpenses((current) =>
        current.map((expense) =>
          expense.id === editingId
            ? {
                ...expense,
                title: title.trim(),
                category,
                amount: numericAmount,
                date,
              }
            : expense
        )
      );
    } else {
      const newExpense: Expense = {
        id: Date.now(),
        title: title.trim(),
        category,
        amount: numericAmount,
        date,
      };

      setExpenses((current) => [newExpense, ...current]);
    }

    resetForm();
  }

  function handleEdit(expense: Expense) {
    setEditingId(expense.id);
    setTitle(expense.title);
    setCategory(expense.category);
    setAmount(String(expense.amount));
    setDate(expense.date);
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(id: number) {
    setExpenses((current) =>
      current.filter((expense) => expense.id !== id)
    );

    if (editingId === id) {
      resetForm();
    }
  }

  const totalExpenses = expenses.reduce(
    (total, expense) => total + expense.amount,
    0
  );

  return (
    <section className="page-content">
      <div className="welcome-section">
        <div>
          <p className="eyebrow">PERSONAL FINANCE</p>
          <h1>Expenses</h1>
          <p>Record, update, and manage your daily spending.</p>
        </div>
      </div>

      <div className="summary-grid">
        <article className="summary-card">
          <div className="summary-card-top">
            <span>Total Recorded Expenses</span>
            <span className="summary-icon">↗</span>
          </div>
          <h2>RWF {totalExpenses.toLocaleString()}</h2>
          <p>Total spending recorded in this browser.</p>
        </article>

        <article className="summary-card">
          <div className="summary-card-top">
            <span>Number of Expenses</span>
            <span className="summary-icon">▤</span>
          </div>
          <h2>{expenses.length}</h2>
          <p>Total expenses you have added.</p>
        </article>
      </div>

      <article className="content-panel">
        <h2>{editingId !== null ? "Edit Expense" : "Add a New Expense"}</h2>
        <p>
          {editingId !== null
            ? "Update the details below and save your changes."
            : "Enter the details of your purchase or payment."}
        </p>

        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}

        <form className="expense-form" onSubmit={handleSubmit}>
          <label htmlFor="expense-title">
            Expense Name
            <input
              id="expense-title"
              type="text"
              placeholder="e.g. Groceries"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </label>

          <label htmlFor="expense-amount">
            Amount (RWF)
            <input
              id="expense-amount"
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 5000"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          </label>

          <label htmlFor="expense-category">
            Category
            <select
              id="expense-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="Food">Food</option>
              <option value="Transport">Transport</option>
              <option value="Education">Education</option>
              <option value="Housing">Housing</option>
              <option value="Health">Health</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Other">Other</option>
            </select>
          </label>

          <label htmlFor="expense-date">
            Date
            <input
              id="expense-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </label>

          <div className="expense-form-actions">
            <button type="submit">
              {editingId !== null ? "Save Changes" : "Add Expense"}
            </button>

            {editingId !== null && (
              <button type="button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </article>

      <article className="content-panel" style={{ marginTop: "24px" }}>
        <h2>Recent Expenses</h2>
        <p>Your recorded expenses appear here.</p>

        {expenses.length === 0 ? (
          <p>No expenses yet. Add your first expense above.</p>
        ) : (
          <div className="expense-list">
            {expenses.map((expense) => (
              <div className="expense-item" key={expense.id}>
                <div>
                  <strong>{expense.title}</strong>
                  <p>
                    {expense.category} · {expense.date}
                  </p>
                </div>

                <strong>RWF {expense.amount.toLocaleString()}</strong>

                <div className="expense-item-actions">
                  <button
                    type="button"
                    onClick={() => handleEdit(expense)}
                    aria-label={`Edit ${expense.title}`}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(expense.id)}
                    aria-label={`Delete ${expense.title}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}