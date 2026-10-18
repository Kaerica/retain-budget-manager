import { useEffect, useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
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
  setPaymentMethodFilter,
  setStartDate,
  setEndDate,
  setMinAmount,
  setMaxAmount,
  setCurrentPage,
  setPageSize,
  resetFilters,
  clearDateFilters as clearDateFilterState,
  clearExpenseError,
  selectFilteredExpenses,
  selectPaginatedExpenses,
  selectTotalPages,
  PAYMENT_METHODS,
  type Expense,
  type SortBy,
  type SortOrder,
} from "../store/expenseSlice";
import Pagination from "../components/Pagination";

import {
  getCategories,
  type Category,
} from "../services/categoryService";

import { formatCurrency, getSavedCurrency } from "../utils/currency";

export default function Expenses() {
  const dispatch = useDispatch<AppDispatch>();

  const {
    expenses,
    searchTerm,
    categoryFilter,
    sortBy,
    sortOrder,
    paymentMethodFilter,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    currentPage,
    pageSize,
    loading,
    error: apiError,
  } = useSelector((state: RootState) => state.expenses);

  // Searching, filtering, sorting and paging are all computed by Redux selectors.
  const filteredExpenses = useSelector(selectFilteredExpenses);
  const paginatedExpenses = useSelector(selectPaginatedExpenses);
  const totalPages = useSelector(selectTotalPages);

  const [searchParams, setSearchParams] = useSearchParams();

  const currency = getSavedCurrency();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryLoadError, setCategoryLoadError] = useState("");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchExpenses());
  }, [dispatch]);

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      setCategoriesLoading(true);
      setCategoryLoadError("");

      try {
        const data = await getCategories();

        if (active) {
          setCategories(data);

          setCategory((current) => {
            if (data.some((item) => item.name === current)) {
              return current;
            }

            return data[0]?.name ?? "";
          });
        }
      } catch {
        if (active) {
          setCategoryLoadError(
            "Could not load categories. Check your sign-in and connection."
          );
        }
      } finally {
        if (active) {
          setCategoriesLoading(false);
        }
      }
    }

    void loadCategories();

    return () => {
      active = false;
    };
  }, []);

  function resetForm() {
    setTitle("");
    setCategory(categories[0]?.name ?? "");
    setAmount("");
    setDate(new Date().toISOString().slice(0, 10));
    setPaymentMethod(PAYMENT_METHODS[0]);
    setNotes("");
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

    if (!category) {
      setError("Please create or select a category first.");
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
            payment_method: paymentMethod,
            description: notes.trim(),
          })
        ).unwrap();
      } else {
        await dispatch(
          createExpense({
            title: title.trim(),
            category,
            amount: numericAmount,
            date,
            payment_method: paymentMethod,
            description: notes.trim(),
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
    setPaymentMethod(expense.payment_method || PAYMENT_METHODS[0]);
    setNotes(expense.description ?? "");
    setError("");
    dispatch(clearExpenseError());
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Opening /expenses?edit=<id> (from the details page) starts editing that expense.
  const editParam = searchParams.get("edit");

  useEffect(() => {
    if (!editParam || expenses.length === 0) {
      return;
    }

    const expenseToEdit = expenses.find(
      (expense) => expense.id === Number(editParam)
    );

    if (expenseToEdit) {
      handleEdit(expenseToEdit);
    }

    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editParam, expenses]);

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

  const totalExpenses = filteredExpenses.reduce(
    (total, expense) => total + Number(expense.amount || 0),
    0
  );

  function clearDateFilters() {
    dispatch(clearDateFilterState());
  }

  function exportExpensesToCSV() {
    if (filteredExpenses.length === 0) {
      alert("There are no matching expenses to export.");
      return;
    }

    const headers = [
      "Title",
      "Category",
      `Amount (${currency})`,
      "Date",
      "Payment Method",
      "Notes",
    ];

    const escapeCSV = (value: unknown) => {
      const text = String(value ?? "");
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = filteredExpenses.map((expense) => [
      expense.title,
      expense.category,
      expense.amount,
      expense.date,
      expense.payment_method ?? "",
      expense.description ?? "",
    ]);

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "retain-expenses.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <section className="page-content">
      <div className="welcome-section">
        <div>
          <p className="eyebrow">PERSONAL FINANCE</p>
          <h1>Expenses</h1>
          <p>Record, update, search, and organize your spending.</p>
        </div>

        <button type="button" onClick={exportExpensesToCSV}>
          Export CSV
        </button>
      </div>

      <div className="summary-grid">
        <article className="summary-card">
          <div className="summary-card-top">
            <span>Filtered Spending Total</span>
            <span className="summary-icon">↗</span>
          </div>
          <h2>{formatCurrency(totalExpenses)}</h2>
          <p>Total spending matching your current filters.</p>
        </article>

        <article className="summary-card">
          <div className="summary-card-top">
            <span>Matching Expenses</span>
            <span className="summary-icon">▤</span>
          </div>
          <h2>{filteredExpenses.length}</h2>
          <p>Number of expenses matching your filters.</p>
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

        {categoryLoadError && (
          <p role="alert" className="form-error">
            {categoryLoadError}
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
            Amount ({currency})
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
              disabled={categoriesLoading || categories.length === 0}
              required
            >
              {categoriesLoading ? (
                <option value="">Loading categories...</option>
              ) : categories.length === 0 ? (
                <option value="">No categories available</option>
              ) : (
                categories.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))
              )}
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

          <label htmlFor="expense-payment-method">
            Payment Method
            <select
              id="expense-payment-method"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              required
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </label>

          <label htmlFor="expense-notes" className="expense-notes-field">
            Notes (optional)
            <textarea
              id="expense-notes"
              rows={3}
              maxLength={1000}
              placeholder="Anything you want to remember about this expense"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>

          <div className="expense-form-actions">
            <button
              type="submit"
              disabled={
                submitting ||
                categoriesLoading ||
                categories.length === 0
              }
            >
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
        <p>Search, filter, and organize your recorded expenses.</p>

        <div className="expense-filters">
          <label htmlFor="expense-search">
            Search
            <input
              id="expense-search"
              type="search"
              placeholder="Search by name, category, payment or notes..."
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
              {categories.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label htmlFor="payment-filter">
            Filter by payment method
            <select
              id="payment-filter"
              value={paymentMethodFilter}
              onChange={(event) =>
                dispatch(setPaymentMethodFilter(event.target.value))
              }
            >
              <option value="All">All payment methods</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </label>

          <label htmlFor="start-date">
            Start date
            <input
              id="start-date"
              type="date"
              max={endDate || undefined}
              value={startDate}
              onChange={(event) => dispatch(setStartDate(event.target.value))}
            />
          </label>

          <label htmlFor="end-date">
            End date
            <input
              id="end-date"
              type="date"
              min={startDate || undefined}
              value={endDate}
              onChange={(event) => dispatch(setEndDate(event.target.value))}
            />
          </label>

          <label htmlFor="min-amount">
            Min amount ({currency})
            <input
              id="min-amount"
              type="number"
              min="0"
              placeholder="0"
              value={minAmount}
              onChange={(event) => dispatch(setMinAmount(event.target.value))}
            />
          </label>

          <label htmlFor="max-amount">
            Max amount ({currency})
            <input
              id="max-amount"
              type="number"
              min="0"
              placeholder="Any"
              value={maxAmount}
              onChange={(event) => dispatch(setMaxAmount(event.target.value))}
            />
          </label>

          <label htmlFor="sort-by">
            Sort by
            <select
              id="sort-by"
              value={sortBy}
              onChange={(event) =>
                dispatch(setSortBy(event.target.value as SortBy))
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
                  setSortOrder(event.target.value as SortOrder)
                )
              }
            >
              <option value="descending">Highest / Newest first</option>
              <option value="ascending">Lowest / Oldest first</option>
            </select>
          </label>
        </div>

        <div className="expense-form-actions">
          <button type="button" onClick={clearDateFilters}>
            Clear Date Filters
          </button>

          <button type="button" onClick={() => dispatch(resetFilters())}>
            Reset All Filters
          </button>

          <button type="button" onClick={exportExpensesToCSV}>
            Export Filtered CSV
          </button>
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
            {paginatedExpenses.map((expense) => (
              <div className="expense-item" key={expense.id}>
                <div>
                  <strong>
                    <Link to={`/expenses/${expense.id}`}>{expense.title}</Link>
                  </strong>
                  <p>
                    {expense.category} · {expense.date}
                    {expense.payment_method ? ` · ${expense.payment_method}` : ""}
                  </p>
                </div>

                <strong>
                  {formatCurrency(Number(expense.amount))}
                </strong>

                <div className="expense-item-actions">
                  <Link
                    to={`/expenses/${expense.id}`}
                    className="view-link"
                    aria-label={`View ${expense.title}`}
                  >
                    View
                  </Link>

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

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredExpenses.length}
          pageSize={pageSize}
          onPageChange={(page) => dispatch(setCurrentPage(page))}
          onPageSizeChange={(size) => dispatch(setPageSize(size))}
        />
      </article>
    </section>
  );
}