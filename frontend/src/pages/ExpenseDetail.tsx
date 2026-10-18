import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";

import type { AppDispatch, RootState } from "../store/store";
import { removeExpense, type Expense } from "../store/expenseSlice";
import { getExpense } from "../services/expenseService";
import { getErrorMessage } from "../services/api";
import { formatCurrency } from "../utils/currency";

function formatDateTime(value?: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-GB");
}

// Shows every detail of a single expense: /expenses/:id
export default function ExpenseDetail() {
  const { id } = useParams<{ id: string }>();
  const expenseId = Number(id);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // Use the expense from Redux when it is already loaded.
  const storedExpense = useSelector((state: RootState) =>
    state.expenses.expenses.find((item) => item.id === expenseId)
  );

  const [expense, setExpense] = useState<Expense | null>(storedExpense ?? null);
  const [loading, setLoading] = useState(!storedExpense);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!Number.isInteger(expenseId) || expenseId <= 0) {
      setError("This expense does not exist.");
      setLoading(false);
      return;
    }

    let active = true;

    // Always load the latest copy from the API (includes notes and timestamps).
    getExpense(expenseId)
      .then((data) => {
        if (active) {
          setExpense(data);
          setError("");
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(getErrorMessage(err, "Could not load this expense."));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [expenseId]);

  async function handleDelete() {
    if (!expense || !window.confirm(`Delete "${expense.title}"?`)) {
      return;
    }

    setDeleting(true);
    try {
      await dispatch(removeExpense(expense.id)).unwrap();
      navigate("/expenses");
    } catch {
      setError("Could not delete the expense. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <section className="page-content">
      <div className="welcome-section">
        <div>
          <p className="eyebrow">EXPENSE DETAILS</p>
          <h1>{expense?.title ?? "Expense"}</h1>
          <p>Everything recorded for this expense.</p>
        </div>

        <Link to="/expenses" className="primary-button">
          ← Back to expenses
        </Link>
      </div>

      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}

      {loading && !expense ? (
        <p>Loading expense...</p>
      ) : expense ? (
        <article className="content-panel expense-detail">
          <dl className="expense-detail-list">
            <div>
              <dt>Amount</dt>
              <dd className="expense-detail-amount">
                {formatCurrency(Number(expense.amount))}
              </dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{expense.category}</dd>
            </div>
            <div>
              <dt>Date</dt>
              <dd>{expense.date}</dd>
            </div>
            <div>
              <dt>Payment method</dt>
              <dd>{expense.payment_method || "Not specified"}</dd>
            </div>
            <div className="expense-detail-wide">
              <dt>Notes</dt>
              <dd>{expense.description || "No notes added."}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatDateTime(expense.created_at)}</dd>
            </div>
            <div>
              <dt>Last updated</dt>
              <dd>{formatDateTime(expense.updated_at)}</dd>
            </div>
          </dl>

          <div className="expense-form-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate(`/expenses?edit=${expense.id}`)}
            >
              Edit Expense
            </button>
            <button
              type="button"
              className="danger-button"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Expense"}
            </button>
          </div>
        </article>
      ) : null}
    </section>
  );
}
