
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user, signout } = useAuth();

  return (
    <section className="page">
      <h1>Settings</h1>
      <p>Manage your account information.</p>

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
