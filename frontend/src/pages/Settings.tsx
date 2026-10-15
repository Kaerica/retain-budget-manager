
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

type Currency = "RWF" | "USD" | "EUR";

export default function Settings() {
  const { user, signout } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currency, setCurrency] = useState<Currency>("RWF");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedCurrency = localStorage.getItem("retain-currency");

    if (
      savedCurrency === "RWF" ||
      savedCurrency === "USD" ||
      savedCurrency === "EUR"
    ) {
      setCurrency(savedCurrency);
    }
  }, []);

  function savePreferences() {
    localStorage.setItem("retain-currency", currency);
    setMessage("Currency preference saved successfully.");
  }

  function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(
      "Profile editing is ready, but changes must be connected to the backend to save your account information."
    );
  }

  return (
    <section className="page">
      <h1>Settings</h1>
      <p>Manage your Retain account preferences.</p>

      <div className="settings-card">
        <h2>Account Information</h2>

        <div className="settings-row">
          <span>Full name</span>
          <strong>{user?.name ?? "Not available"}</strong>
        </div>

        <div className="settings-row">
          <span>Email address</span>
          <strong>{user?.email ?? "Not available"}</strong>
        </div>

        <div className="settings-row">
          <span>Account role</span>
          <strong>{user?.role ?? "user"}</strong>
        </div>
      </div>

      <div className="settings-card">
        <h2>Edit Profile</h2>

        <form onSubmit={handleProfileSubmit}>
          <label htmlFor="profile-name">Full name</label>
          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />

          <label htmlFor="profile-email">Email address</label>
          <input
            id="profile-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <button type="submit">Update Profile</button>
        </form>
      </div>

      <div className="settings-card">
        <h2>Currency Preferences</h2>
        <p>Choose the currency you want to use in Retain.</p>

        <label htmlFor="currency">Display currency</label>
        <select
          id="currency"
          value={currency}
          onChange={(event) => {
            setCurrency(event.target.value as Currency);
            setMessage("");
          }}
        >
          <option value="RWF">RWF — Rwandan Franc</option>
          <option value="USD">USD — US Dollar</option>
          <option value="EUR">EUR — Euro</option>
        </select>

        <button type="button" onClick={savePreferences}>
          Save Preferences
        </button>
      </div>

      {message && <p role="status">{message}</p>}

      <div className="settings-card">
        <h2>Account Actions</h2>
        <p>Sign out when you have finished managing your expenses.</p>

        <button
          type="button"
          className="settings-signout"
          onClick={signout}
        >
          Sign Out
        </button>
      </div>
    </section>
  );
}
