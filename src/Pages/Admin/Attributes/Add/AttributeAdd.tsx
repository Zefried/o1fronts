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
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [name, setName] = useState("");
  const [bulkAttributes, setBulkAttributes] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [businessId, setBusinessId] = useState<string>("");
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
    setMode("single");
    setName(""); setCategoryId(""); setBusinessId(""); setDescription(""); setBulkAttributes("");
    setError(""); setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (mode === "single") {
      if (!name.trim()) { setError("Attribute name is required."); return; }
    } else {
      if (!bulkAttributes.trim()) { setError("Please provide at least one attribute."); return; }
      if (!categoryId) { setError("Category selection is required for bulk upload."); return; }
    }

    if (!businessId.trim()) { setError("Business ID is required."); return; }

    setLoading(true); setError(""); setSuccess("");
    try {
      let res;
      if (mode === "single") {
        const payload: { name: string; category_id?: number; business_id: string; description?: string } = {
          name: name.trim(),
          business_id: businessId.trim(),
        };
        if (categoryId) payload.category_id = Number(categoryId);
        if (description.trim()) payload.description = description.trim();

        res = await api.post("/admin/attributes", payload);
      } else {
        res = await api.post("/admin/attributes/bulk", {
          attributes: bulkAttributes.trim(),
          category_id: Number(categoryId),
          business_id: businessId.trim(),
        });
      }

      if (res.data.status) {
        setName(""); setCategoryId(""); setBusinessId(""); setDescription(""); setBulkAttributes(""); setError("");
        setSuccess(res.data.message || "✅ Attribute(s) created successfully!");
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(res.data.message || "Failed to create attribute(s).");
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
          {/* Mode Toggle */}
          <div className="aa__group" style={{ marginBottom: '1.5rem' }}>
            <span className="aa__label">Mode:</span>
            <div className="aa__mode-toggle">
              <button
                type="button"
                className={`aa__mode-btn ${mode === "single" ? "aa__mode-btn--active" : ""}`}
                onClick={() => { setMode("single"); setError(""); }}
              >
                Single Attribute
              </button>
              <button
                type="button"
                className={`aa__mode-btn ${mode === "bulk" ? "aa__mode-btn--active" : ""}`}
                onClick={() => { setMode("bulk"); setError(""); }}
              >
                Bulk Upload
              </button>
            </div>
          </div>

          {mode === "single" ? (
            <>
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
            </>
          ) : (
            <>
              {/* Bulk Attributes Input */}
              <div className="aa__group">
                <label className="aa__label" htmlFor="attr-bulk">
                  Attributes (Comma or new-line separated) <span className="aa__required">*</span>
                </label>
                <textarea
                  id="attr-bulk"
                  className="aa__textarea"
                  placeholder="Price, Warranty&#10;Color"
                  rows={6}
                  value={bulkAttributes}
                  onChange={(e) => { setBulkAttributes(e.target.value); setError(""); }}
                />
              </div>
            </>
          )}

          {/* Business ID */}
          <div className="aa__group">
            <label className="aa__label" htmlFor="attr-businessId">
              Business ID <span className="aa__required">*</span>
            </label>
            <input
              id="attr-businessId"
              type="text"
              className="aa__input"
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
              placeholder="e.g. BUS-QVTE1BKU"
            />
          </div>

          {/* Category */}
          <div className="aa__group">
            <label className="aa__label" htmlFor="attr-category">
              Category {mode === "bulk" && <span className="aa__required">*</span>}
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
              {mode === "bulk"
                ? "Required — all bulk attributes will be grouped under this category."
                : "Leave blank to make this attribute available globally."}
            </span>
          </div>

          {/* Description */}
          {mode === "single" && (
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
          )}

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
