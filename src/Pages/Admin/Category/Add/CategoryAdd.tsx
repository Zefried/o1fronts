import { useState, useEffect } from "react";
import api from "../../../../api/axios";
import "./Styles/CategoryAdd.css";

interface FlatCategory {
  id: number;
  name: string;
  label: string;
  depth: number;
  status: string;
}

interface ApiError {
  response?: { data?: { message?: string } };
  message?: string;
}

export const CategoryAdd = () => {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("");

  const [categories, setCategories] = useState<FlatCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch flat list for parent dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/admin/categories/flat");
        if (res.data.status) {
          setCategories(res.data.data);
        }
      } catch {
        // silently fail — dropdown will just be empty
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const handleReset = () => {
    setName("");
    setParentId("");
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload: { name: string; parent_id?: number } = {
        name: name.trim(),
      };

      if (parentId) {
        payload.parent_id = Number(parentId);
      }

      const res = await api.post("/admin/categories", payload);

      if (res.data.status) {
        // Reset fields without clearing success message
        setName("");
        setParentId("");
        setError("");
        setSuccess("✅ Category created successfully!");
        // Auto-dismiss after 4 seconds
        setTimeout(() => setSuccess(""), 4000);
        // Re-fetch dropdown so new category is available as a parent option
        const updated = await api.get("/admin/categories/flat");
        if (updated.data.status) setCategories(updated.data.data);
      } else {
        setError(res.data.message || "Failed to create category.");
      }
    } catch (err: unknown) {
      const e = err as ApiError;
      setError(
        e?.response?.data?.message || e?.message || "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cat-add">
      {/* Header */}
      <div className="cat-add__header">
        <h1 className="cat-add__title">Add Category</h1>
        <p className="cat-add__subtitle">
          Create a new category. You can optionally assign it to a parent
          category.
        </p>
      </div>

      {/* Card */}
      <div className="cat-add__card">
        <form onSubmit={handleSubmit} noValidate>
          {/* Name */}
          <div className="cat-add__group">
            <label className="cat-add__label" htmlFor="cat-name">
              Category Name <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              id="cat-name"
              type="text"
              className="cat-add__input"
              placeholder="e.g. Food, Beverages, Indian"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
            />
          </div>

          {/* Parent */}
          <div className="cat-add__group">
            <label className="cat-add__label" htmlFor="cat-parent">
              Parent Category
            </label>
            <select
              id="cat-parent"
              className="cat-add__select"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              disabled={loadingCategories}
            >
              <option value="">— None (root category)</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
            <span className="cat-add__hint">
              Leave blank to create a top-level category.
            </span>
          </div>

          {/* Feedback */}
          {error && <p className="cat-add__error">{error}</p>}
          {success && <p className="cat-add__success cat-add__success--anim">{success}</p>}

          {/* Actions */}
          <div className="cat-add__actions">
            <button
              id="cat-add-submit"
              type="submit"
              className="cat-add__btn cat-add__btn--primary"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Category"}
            </button>
            <button
              type="button"
              className="cat-add__btn cat-add__btn--reset"
              onClick={handleReset}
              disabled={loading}
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
