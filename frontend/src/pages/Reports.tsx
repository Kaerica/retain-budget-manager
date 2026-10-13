
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";

export default function Reports() {
  const expenses = useSelector(
    (state: RootState) => state.expenses.expenses
  );

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const monthlyExpenses = expenses.filter((expense) => {
    const date = new Date(expense.date);

    return (
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear
    );
  });

  const categoryTotals = monthlyExpenses.reduce<Record<string, number>>(
    (totals, expense) => {
      totals[expense.category] =
        (totals[expense.category] || 0) + expense.amount;

      return totals;
    },
    {}
  );

  const categories = Object.entries(categoryTotals).sort(
    (a, b) => b[1] - a[1]
  );

  const totalSpent = monthlyExpenses.reduce(
    (total, expense) => total + expense.amount,
    0
  );

  const money = (amount: number) =>
    new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <section className="page">
      <h1>Expense Reports</h1>
      <p>Review your spending for the current month.</p>

      <div className="report-summary">
        <h2>Total monthly spending</h2>
        <p className="report-total">{money(totalSpent)}</p>
        <p>{monthlyExpenses.length} expenses recorded this month</p>
      </div>

      <div className="report-card">
        <h2>Spending by category</h2>

        {categories.length === 0 ? (
          <p>
            No expenses recorded this month. Add an expense to see your
            report.
          </p>
        ) : (
          categories.map(([category, amount]) => {
            const percentage =
              totalSpent > 0 ? (amount / totalSpent) * 100 : 0;

            return (
              <div className="category-report" key={category}>
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

                <p>{percentage.toFixed(1)}% of monthly spending</p>
              </div>
            );
          })
        )}
      </div>

      <div className="report-card">
        <h2>Highest expense</h2>

        {monthlyExpenses.length === 0 ? (
          <p>No expenses recorded this month yet.</p>
        ) : (
          (() => {
            const highestExpense = monthlyExpenses.reduce((highest, item) =>
              item.amount > highest.amount ? item : highest
            );

            return (
              <>
                <p>
                  <strong>{highestExpense.title}</strong>
                </p>
                <p>{money(highestExpense.amount)}</p>
                <p>Category: {highestExpense.category}</p>
              </>
            );
          })()
        )}
      </div>
    </section>
  );
}
