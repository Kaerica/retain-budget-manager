
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store/store";
import {
  fetchExpenses,
  createExpense,
  saveExpense,
  removeExpense,
  setSearchTerm,
  setCategoryFilter,
  setSortBy,
  setSortOrder,
  clearExpenseError,
  type Expense,
} from "../store/expenseSlice";

export default function Expenses() {
  const dispatch = useDispatch<AppDispatch>();

  const {
    expenses,
    searchTerm,
    categoryFilter,
    sortBy,
    sortOrder,
    loading,
    error: apiError,
  } = useSelector((state: RootState) => state.expenses);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchExpenses());
  }, [dispatch]);

  function resetForm() {
    setTitle("");
    setCategory("Food");
    setAmount("");
    setDate(new Date().toISOString().slice(0, 10));
    setEditingId(null);
    setError("");
    dispatch(clearExpenseError());
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    dispatch(clearExpenseError());

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

    setSubmitting(true);

    try {
      if (editingId !== null) {
        await dispatch(
          saveExpense({
            id: editingId,
            title: title.trim(),
            category,
            amount: numericAmount,
            date,
          })
        ).unwrap();
      } else {
        await dispatch(
          createExpense({
            title: title.trim(),
            category,
            amount: numericAmount,
            date,
          })
        ).unwrap();
      }

      resetForm();
    } catch {
      setError(
        editingId !== null
          ? "Could not update the expense. Please try again."
          : "Could not save the expense. Please check your connection and sign-in."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(expense: Expense) {
    setEditingId(expense.id);
    setTitle(expense.title);
    setCategory(expense.category);
    setAmount(String(expense.amount));
    setDate(expense.date);
    setError("");
    dispatch(clearExpenseError());
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: number) {
    setError("");
    dispatch(clearExpenseError());

    try {
      await dispatch(removeExpense(id)).unwrap();

      if (editingId === id) {
        resetForm();
      }
    } catch {
      setError("Could not delete the expense. Please try again.");
    }
  }

  const filteredExpenses = useMemo(() => {
    const filtered = expenses.filter((expense) => {
      const matchesSearch =
        expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === "All" || expense.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });

    return [...filtered].sort((a, b) => {
      const comparison =
        sortBy === "amount"
          ? a.amount - b.amount
          : a.date.localeCompare(b.date);

      return sortOrder === "ascending" ? comparison : -comparison;
    });
  }, [expenses, searchTerm, categoryFilter, sortBy, sortOrder]);

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
          <p>Record, update, search, and organize your spending.</p>
        </div>
      </div>

      <div className="summary-grid">
        <article className="summary-card">
          <div className="summary-card-top">
            <span>Total Recorded Expenses</span>
            <span className="summary-icon">↗</span>
          </div>
          <h2>RWF {totalExpenses.toLocaleString()}</h2>
          <p>Total spending saved to your account.</p>
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

        {(error || apiError) && (
          <p role="alert" className="form-error">
            {error || apiError}
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
            <button type="submit" disabled={submitting}>
              {submitting
                ? "Saving..."
                : editingId !== null
                  ? "Save Changes"
                  : "Add Expense"}
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
        <p>Search and organize your recorded expenses.</p>

        <div className="expense-filters">
          <label htmlFor="expense-search">
            Search
            <input
              id="expense-search"
              type="search"
              placeholder="Search by name or category..."
              value={searchTerm}
              onChange={(event) => dispatch(setSearchTerm(event.target.value))}
            />
          </label>

          <label htmlFor="category-filter">
            Filter by category
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(event) =>
                dispatch(setCategoryFilter(event.target.value))
              }
            >
              <option value="All">All categories</option>
              <option value="Food">Food</option>
              <option value="Transport">Transport</option>
              <option value="Education">Education</option>
              <option value="Housing">Housing</option>
              <option value="Health">Health</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Other">Other</option>
            </select>
          </label>

          <label htmlFor="sort-by">
            Sort by
            <select
              id="sort-by"
              value={sortBy}
              onChange={(event) =>
                dispatch(setSortBy(event.target.value as "date" | "amount"))
              }
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
            </select>
          </label>

          <label htmlFor="sort-order">
            Order
            <select
              id="sort-order"
              value={sortOrder}
              onChange={(event) =>
                dispatch(
                  setSortOrder(
                    event.target.value as "ascending" | "descending"
                  )
                )
              }
            >
              <option value="descending">Highest / Newest first</option>
              <option value="ascending">Lowest / Oldest first</option>
            </select>
          </label>
        </div>

        <p>
          Showing {filteredExpenses.length} of {expenses.length} expenses.
        </p>

        {loading ? (
          <p>Loading expenses...</p>
        ) : filteredExpenses.length === 0 ? (
          <p>No matching expenses found.</p>
        ) : (
          <div className="expense-list">
            {filteredExpenses.map((expense) => (
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
