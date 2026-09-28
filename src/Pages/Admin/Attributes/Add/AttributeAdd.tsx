import { useState, useEffect } from "react";
import api from "../../../../api/axios";
import "./Styles/AttributeAdd.css";

interface FlatCategory {
  id: number;
  name: string;
  label: string;
  depth: number;
}

interface ApiError {
  response?: { data?: { message?: string } };
  message?: string;
}

export const AttributeAdd = () => {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [description, setDescription] = useState("");

  const [categories, setCategories] = useState<FlatCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api.get("/admin/categories/flat")
      .then((res) => { if (res.data.status) setCategories(res.data.data); })
      .catch(() => {})
      .finally(() => setLoadingCats(false));
  }, []);

  const handleReset = () => {
    setName(""); setCategoryId(""); setDescription("");
    setError(""); setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) { setError("Attribute name is required."); return; }

    setLoading(true); setError(""); setSuccess("");
    try {
      const payload: { name: string; category_id?: number; description?: string } = {
        name: name.trim(),
      };
      if (categoryId) payload.category_id = Number(categoryId);
      if (description.trim()) payload.description = description.trim();

      const res = await api.post("/admin/attributes", payload);
      if (res.data.status) {
        setName(""); setCategoryId(""); setDescription(""); setError("");
        setSuccess("✅ Attribute created successfully!");
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(res.data.message || "Failed to create attribute.");
      }
    } catch (err: unknown) {
      const e = err as ApiError;
      setError(e?.response?.data?.message || e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="aa">
      <div className="aa__header">
        <h1 className="aa__title">Add Attribute</h1>
        <p className="aa__subtitle">
          Define a new attribute (e.g. Price, Warranty) and link it to a category.
        </p>
      </div>

      <div className="aa__card">
        <form onSubmit={handleSubmit} noValidate>
          {/* Name */}
          <div className="aa__group">
            <label className="aa__label" htmlFor="attr-name">
              Attribute Name <span className="aa__required">*</span>
            </label>
            <input
              id="attr-name"
              type="text"
              className="aa__input"
              placeholder="e.g. Price, Warranty, Payment Process"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
            />
          </div>

          {/* Category */}
          <div className="aa__group">
            <label className="aa__label" htmlFor="attr-category">
              Category
            </label>
            <select
              id="attr-category"
              className="aa__select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={loadingCats}
            >
              <option value="">— Global (applies to all categories)</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
            <span className="aa__hint">
              Leave blank to make this attribute available globally.
            </span>
          </div>

          {/* Description */}
          <div className="aa__group">
            <label className="aa__label" htmlFor="attr-desc">
              Description
            </label>
            <textarea
              id="attr-desc"
              className="aa__textarea"
              placeholder="What does this attribute capture?"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {error   && <p className="aa__error">{error}</p>}
          {success && <p className="aa__success aa__success--anim">{success}</p>}

          <div className="aa__actions">
            <button id="attr-add-submit" type="submit" className="aa__btn aa__btn--primary" disabled={loading}>
              {loading ? "Saving..." : "Save Attribute"}
            </button>
            <button type="button" className="aa__btn aa__btn--reset" onClick={handleReset} disabled={loading}>
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
