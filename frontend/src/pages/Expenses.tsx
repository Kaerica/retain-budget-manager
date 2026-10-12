
import { useState } from "react";

interface Expense {
  id: number;
  title: string;
  category: string;
  amount: number;
  date: string;
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !amount || Number(amount) <= 0 || !date) {
      return;
    }

    const newExpense: Expense = {
      id: Date.now(),
      title: title.trim(),
      category,
      amount: Number(amount),
      date,
    };

    setExpenses((currentExpenses) => [
      newExpense,
      ...currentExpenses,
    ]);

    setTitle("");
    setCategory("Food");
    setAmount("");
    setDate(new Date().toISOString().slice(0, 10));
  }

  function handleDelete(id: number) {
    setExpenses((currentExpenses) =>
      currentExpenses.filter((expense) => expense.id !== id)
    );
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
          <p>Record and manage your daily spending.</p>
        </div>
      </div>

      <div className="summary-grid">
        <article className="summary-card">
          <div className="summary-card-top">
            <span>Total Recorded Expenses</span>
            <span className="summary-icon">↗</span>
          </div>
          <h2>RWF {totalExpenses.toLocaleString()}</h2>
          <p>Your total spending recorded in this session.</p>
        </article>

        <article className="summary-card">
          <div className="summary-card-top">
            <span>Number of Expenses</span>
            <span className="summary-icon">▤</span>
          </div>
          <h2>{expenses.length}</h2>
          <p>Expenses you have added.</p>
        </article>
      </div>

      <article className="content-panel">
        <h2>Add a New Expense</h2>
        <p>Enter the details of your purchase or payment.</p>

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

          <button type="submit">Add Expense</button>
        </form>
      </article>

      <article className="content-panel" style={{ marginTop: "24px" }}>
        <h2>Recent Expenses</h2>
        <p>Your newly recorded expenses appear here.</p>

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

                <strong>
                  RWF {expense.amount.toLocaleString()}
                </strong>

                <button
                  type="button"
                  onClick={() => handleDelete(expense.id)}
                  aria-label={`Delete ${expense.title}`}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
