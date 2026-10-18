import { useEffect, useState, type FormEvent } from "react";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
  type Category,
} from "../services/categoryService";
import { getErrorMessage } from "../services/api";

// Name of the fallback category kept by the backend. It cannot be renamed or deleted.
const DEFAULT_CATEGORY = "Uncategorized";

interface CategoryManagerProps {
  // Called after any change so the parent can refresh its insights.
  onChange?: () => void;
}

// Admin-only tool to create, rename and delete expense categories.
export default function CategoryManager({ onChange }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadCategories() {
    try {
      setCategories(await getCategories());
    } catch (err) {
      setError(getErrorMessage(err, "Could not load categories."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  function showResult(text: string) {
    setMessage(text);
    setError("");
    onChange?.();
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newName.trim();

    if (!name) {
      setError("Please enter a category name.");
      return;
    }

    setBusy(true);
    try {
      const created = await createCategory({ name });
      setCategories((current) =>
        [...current, created].sort((a, b) => a.name.localeCompare(b.name))
      );
      setNewName("");
      showResult(`"${created.name}" was added.`);
    } catch (err) {
      setError(getErrorMessage(err, "Could not create the category."));
    } finally {
      setBusy(false);
    }
  }

  async function handleRename(category: Category) {
    const name = editingName.trim();

    if (!name) {
      setError("Category name cannot be empty.");
      return;
    }

    setBusy(true);
    try {
      const updated = await updateCategory(category.id, { name });
      setCategories((current) =>
        current
          .map((item) => (item.id === updated.id ? updated : item))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);
      showResult(`"${category.name}" was renamed to "${updated.name}".`);
    } catch (err) {
      setError(getErrorMessage(err, "Could not rename the category."));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(category: Category) {
    const confirmed = window.confirm(
      `Delete "${category.name}"? Expenses in this category will be moved to "${DEFAULT_CATEGORY}".`
    );

    if (!confirmed) {
      return;
    }

    setBusy(true);
    try {
      await deleteCategory(category.id);
      setCategories((current) =>
        current.filter((item) => item.id !== category.id)
      );
      showResult(
        `"${category.name}" was deleted. Its expenses are now in "${DEFAULT_CATEGORY}".`
      );
    } catch (err) {
      setError(getErrorMessage(err, "Could not delete the category."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="content-panel">
      <h2>Manage Categories</h2>
      <p>
        Categories are shared by every user. Deleting one moves its expenses to
        "{DEFAULT_CATEGORY}".
      </p>

      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="form-success">
          {message}
        </p>
      )}

      <form className="category-create-form" onSubmit={handleCreate}>
        <label htmlFor="new-category">
          New category
          <input
            id="new-category"
            type="text"
            maxLength={100}
            placeholder="e.g. Subscriptions"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
          />
        </label>
        <button type="submit" className="primary-button" disabled={busy}>
          Add Category
        </button>
      </form>

      {loading ? (
        <p>Loading categories...</p>
      ) : categories.length === 0 ? (
        <p>No categories yet.</p>
      ) : (
        <ul className="category-admin-list">
          {categories.map((category) => {
            const isDefault = category.name === DEFAULT_CATEGORY;
            const isEditing = editingId === category.id;

            return (
              <li key={category.id} className="category-admin-item">
                {isEditing ? (
                  <input
                    aria-label={`New name for ${category.name}`}
                    value={editingName}
                    maxLength={100}
                    onChange={(event) => setEditingName(event.target.value)}
                    autoFocus
                  />
                ) : (
                  <span>
                    {category.name}
                    {isDefault && <small> (default)</small>}
                  </span>
                )}

                <div className="expense-item-actions">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleRename(category)}
                      >
                        Save
                      </button>
                      <button type="button" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={busy || isDefault}
                        onClick={() => {
                          setEditingId(category.id);
                          setEditingName(category.name);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="danger-button"
                        disabled={busy || isDefault}
                        onClick={() => handleDelete(category)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
