
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

type Currency = "RWF" | "USD" | "EUR";

export default function Settings() {
  const { user, signout, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currency, setCurrency] = useState<Currency>("RWF");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingCurrency, setSavingCurrency] = useState(false);

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

  useEffect(() => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
  }, [user]);

  function savePreferences() {
    setSavingCurrency(true);
    setMessage("");
    setError("");

    try {
      localStorage.setItem("retain-currency", currency);
      setMessage(`Currency preference saved successfully: ${currency}.`);
    } catch {
      setError("Unable to save your currency preference. Please try again.");
    } finally {
      setSavingCurrency(false);
    }
  }

  async function handleProfileSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!name.trim() || !email.trim()) {
      setError("Please enter your name and email.");
      return;
    }

    try {
      setSaving(true);

      await updateProfile(name.trim(), email.trim());

      setMessage("Your profile has been updated successfully.");
    } catch (err: unknown) {
      const apiError = err as {
        response?: {
          data?: {
            detail?: string;
            email?: string[];
            name?: string[];
          };
        };
        message?: string;
      };

      const detail = apiError.response?.data?.detail;
      const emailError = apiError.response?.data?.email?.[0];
      const nameError = apiError.response?.data?.name?.[0];

      setError(
        detail ||
          emailError ||
          nameError ||
          apiError.message ||
          "Unable to update your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-content">
      <h1>Settings</h1>
      <p>Manage your Retain account preferences.</p>

      <article className="content-card">
        <h3>Account Information</h3>
        <p>
          <strong>Name:</strong> {user?.name ?? "Not available"}
        </p>
        <p>
          <strong>Email:</strong> {user?.email ?? "Not available"}
        </p>
        <p>
          <strong>Role:</strong> {user?.role ?? "user"}
        </p>
      </article>

      <article className="content-card">
        <h3>Edit Profile</h3>
        <p>Update the name and email connected to your account.</p>

        <form onSubmit={handleProfileSubmit}>
          <div className="form-group">
            <label htmlFor="profile-name">Full name</label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile-email">Email address</label>
            <input
              id="profile-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>

        {message && (
          <p role="status" className="success-message">
            {message}
          </p>
        )}

        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
      </article>

      <article className="content-card">
        <h3>Currency Preferences</h3>
        <p>Choose your preferred currency for Retain.</p>

        <div className="form-group">
          <label htmlFor="currency">Currency</label>
          <select
            id="currency"
            value={currency}
            onChange={(event) =>
              setCurrency(event.target.value as Currency)
            }
          >
            <option value="RWF">Rwandan Franc (RWF)</option>
            <option value="USD">US Dollar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
          </select>
        </div>

        <button
          type="button"
          onClick={savePreferences}
          disabled={savingCurrency}
        >
          {savingCurrency ? "Saving..." : "Save Currency"}
        </button>

        <p>
          <strong>Selected currency:</strong> {currency}
        </p>

        {message.includes("Currency preference") && (
          <p role="status" className="success-message">
            {message}
          </p>
        )}
      </article>

      <article className="content-card">
        <h3>Account Actions</h3>
        <p>Sign out of your Retain account on this device.</p>

        <button type="button" onClick={signout}>
          Sign Out
        </button>
      </article>
    </div>
  );
}
