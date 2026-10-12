
import { useState } from "react";

export default function Expenses() {
  const [expenseName, setExpenseName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    alert(
      `Expense: ${expenseName}\nAmount: RWF ${amount}\nCategory: ${category}`
    );
  }

  return (
    <main className="page-content">
      <h1>Expenses</h1>
      <p>Record and manage your personal spending.</p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="expenseName">Expense name</label>
          <input
            id="expenseName"
            type="text"
            placeholder="e.g. Groceries"
            value={expenseName}
            onChange={(event) => setExpenseName(event.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="amount">Amount (RWF)</label>
          <input
            id="amount"
            type="number"
            min="1"
            placeholder="e.g. 5000"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="Food">Food</option>
            <option value="Transport">Transport</option>
            <option value="Education">Education</option>
            <option value="Housing">Housing</option>
            <option value="Health">Health</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <button type="submit">Add Expense</button>
      </form>
    </main>
  );
}
