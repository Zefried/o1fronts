import { useState, useEffect } from "react";
import api from "../../../../api/axios";
import "./Styles/ServiceAdd.css";

interface Category {
  id: number;
  name: string;
  label: string;
  depth: number;
}

interface ApiError {
  response?: { data?: { message?: string } };
  message?: string;
}

export const ServiceAdd = () => {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [description, setDescription] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/admin/categories/flat");
        if (res.data.status) setCategories(res.data.data);
      } catch {
        // silently fail
      } finally {
        setLoadingCats(false);
      }
    };
    fetchCategories();
  }, []);

  const handleReset = () => {
    setName("");
    setCategoryId("");
    setDescription("");
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Service name is required.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload: { name: string; category_id?: number; description?: string } = {
        name: name.trim(),
      };
      if (categoryId) payload.category_id = Number(categoryId);
      if (description.trim()) payload.description = description.trim();

      const res = await api.post("/admin/services", payload);

      if (res.data.status) {
        setName("");
        setCategoryId("");
        setDescription("");
        setError("");
        setSuccess("✅ Service created successfully!");
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(res.data.message || "Failed to create service.");
      }
    } catch (err: unknown) {
      const e = err as ApiError;
      setError(e?.response?.data?.message || e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sa">
      <div className="sa__header">
        <h1 className="sa__title">Add Service</h1>
        <p className="sa__subtitle">
          Create a new service and optionally link it to a category.
        </p>
      </div>

      <div className="sa__card">
        <form onSubmit={handleSubmit} noValidate>
          {/* Name */}
          <div className="sa__group">
            <label className="sa__label" htmlFor="svc-name">
              Service Name <span className="sa__required">*</span>
            </label>
            <input
              id="svc-name"
              type="text"
              className="sa__input"
              placeholder="e.g. Complete Home Interior - 1BHK"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
            />
          </div>

          {/* Category */}
          <div className="sa__group">
            <label className="sa__label" htmlFor="svc-category">
              Category
            </label>
            <select
              id="svc-category"
              className="sa__select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={loadingCats}
            >
              <option value="">— None</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
            <span className="sa__hint">Optional — group this service under a category.</span>
          </div>

          {/* Description */}
          <div className="sa__group">
            <label className="sa__label" htmlFor="svc-desc">
              Description
            </label>
            <textarea
              id="svc-desc"
              className="sa__textarea"
              placeholder="Brief description of this service…"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <span className="sa__hint">This will be used as context for the AI assistant.</span>
          </div>

          {/* Feedback */}
          {error   && <p className="sa__error">{error}</p>}
          {success && <p className="sa__success sa__success--anim">{success}</p>}

          {/* Actions */}
          <div className="sa__actions">
            <button
              id="svc-add-submit"
              type="submit"
              className="sa__btn sa__btn--primary"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Service"}
            </button>
            <button
              type="button"
              className="sa__btn sa__btn--reset"
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
