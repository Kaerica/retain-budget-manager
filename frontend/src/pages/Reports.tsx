import { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";

export default function Reports() {
  const expenses = useSelector(
    (state: RootState) => state.expenses.expenses
  );

  const today = new Date();
  const firstDayOfMonth = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const [startDate, setStartDate] = useState(
    formatDate(firstDayOfMonth)
  );
  const [endDate, setEndDate] = useState(formatDate(today));

  const filteredExpenses = expenses.filter((expense) => {
    const date = new Date(expense.date);

    if (Number.isNaN(date.getTime())) {
      return false;
    }

    const expenseDate = formatDate(date);

    return expenseDate >= startDate && expenseDate <= endDate;
  });

  const categoryTotals = filteredExpenses.reduce<
    Record<string, number>
  >((totals, expense) => {
    totals[expense.category] =
      (totals[expense.category] || 0) + expense.amount;

    return totals;
  }, {});

  const categories = Object.entries(categoryTotals).sort(
    (a, b) => b[1] - a[1]
  );

  const totalSpent = filteredExpenses.reduce(
    (total, expense) => total + expense.amount,
    0
  );

  const expenseCount = filteredExpenses.length;

  const averageExpense =
    expenseCount > 0 ? totalSpent / expenseCount : 0;

  const topCategory =
    categories.length > 0 ? categories[0] : null;

  const highestExpense =
    filteredExpenses.length > 0
      ? filteredExpenses.reduce((highest, item) =>
          item.amount > highest.amount ? item : highest
        )
      : null;

  const money = (amount: number) =>
    new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
      maximumFractionDigits: 0,
    }).format(amount);

  const invalidDateRange =
    Boolean(startDate && endDate && startDate > endDate);

  const escapeCsv = (value: string | number) =>
    `"${String(value).replace(/"/g, '""')}"`;

  const exportReport = () => {
    const rows: (string | number)[][] = [
      ["Retain Expense Report"],
      ["Start Date", startDate],
      ["End Date", endDate],
      [],
      ["Summary"],
      ["Total Spending (RWF)", totalSpent],
      ["Number of Expenses", expenseCount],
      ["Average Expense (RWF)", averageExpense],
      ["Top Spending Category", topCategory?.[0] ?? "N/A"],
      ["Top Category Spending (RWF)", topCategory?.[1] ?? 0],
      [],
      ["Expense Details"],
      ["Date", "Title", "Category", "Amount (RWF)"],
      ...filteredExpenses.map((expense) => [
        formatDate(new Date(expense.date)),
        expense.title,
        expense.category,
        expense.amount,
      ]),
      [],
      ["Spending by Category"],
      ["Category", "Amount (RWF)", "Percentage"],
      ...categories.map(([category, amount]) => [
        category,
        amount,
        totalSpent > 0
          ? `${((amount / totalSpent) * 100).toFixed(1)}%`
          : "0%",
      ]),
    ];

    const csvContent = rows
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `retain-report-${startDate}-to-${endDate}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  return (
    <section className="page">
      <h1>Expense Reports</h1>
      <p>Review your spending for a selected period.</p>

      <div className="report-card">
        <h2>Filter Report by Date</h2>

        <div className="report-date-filters">
          <div>
            <label htmlFor="report-start-date">Start Date</label>
            <input
              id="report-start-date"
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) =>
                setStartDate(event.target.value)
              }
            />
          </div>

          <div>
            <label htmlFor="report-end-date">End Date</label>
            <input
              id="report-end-date"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) =>
                setEndDate(event.target.value)
              }
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setStartDate(formatDate(firstDayOfMonth));
              setEndDate(formatDate(today));
            }}
          >
            Current Month
          </button>
        </div>

        {invalidDateRange && (
          <p className="report-date-error">
            Start date must be before or equal to end date.
          </p>
        )}
      </div>

      {!invalidDateRange && (
        <>
          <div className="report-summary">
            <h2>Total Spending for Selected Period</h2>
            <p className="report-total">{money(totalSpent)}</p>
            <p>
              {expenseCount} expenses recorded during this period
            </p>
          </div>

          <div className="report-stats">
            <div className="report-card">
              <h3>Number of Expenses</h3>
              <p className="report-total">{expenseCount}</p>
              <p>Transactions in this period</p>
            </div>

            <div className="report-card">
              <h3>Average Expense</h3>
              <p className="report-total">
                {money(averageExpense)}
              </p>
              <p>Average per transaction</p>
            </div>

            <div className="report-card">
              <h3>Top Spending Category</h3>
              <p className="report-total">
                {topCategory ? topCategory[0] : "N/A"}
              </p>
              <p>
                {topCategory
                  ? money(topCategory[1])
                  : "No spending recorded"}
              </p>
            </div>
          </div>

          <div className="report-card">
            <h2>Spending by Category</h2>

            {categories.length === 0 ? (
              <p>
                No expenses recorded during this period.
                Try selecting different dates or add an expense.
              </p>
            ) : (
              categories.map(([category, amount]) => {
                const percentage =
                  totalSpent > 0
                    ? (amount / totalSpent) * 100
                    : 0;

                return (
                  <div
                    className="category-report"
                    key={category}
                  >
                    <div className="category-report-heading">
                      <span>{category}</span>
                      <strong>{money(amount)}</strong>
                    </div>

                    <div className="report-progress">
                      <div
                        className="report-progress-fill"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <p>{percentage.toFixed(1)}% of spending</p>
                  </div>
                );
              })
            )}
          </div>

          <div className="report-card">
            <h2>Highest Expense</h2>

            {highestExpense ? (
              <>
                <p>
                  <strong>{highestExpense.title}</strong>
                </p>
                <p>{money(highestExpense.amount)}</p>
                <p>Category: {highestExpense.category}</p>
                <p>
                  Date: {formatDate(new Date(highestExpense.date))}
                </p>
              </>
            ) : (
              <p>No expenses recorded during this period.</p>
            )}
          </div>

          <div className="report-card">
            <h2>Export Report</h2>
            <p>
              Download your summary, expense details, and category
              breakdown for the selected dates.
            </p>
            <button type="button" onClick={exportReport}>
              Export Report to CSV
            </button>
          </div>
        </>
      )}
    </section>
  );
}