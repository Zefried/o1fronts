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
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [name, setName] = useState("");
  const [bulkServices, setBulkServices] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [businessId, setBusinessId] = useState<string>("");
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
    setMode("single");
    setName("");
    setBulkServices("");
    setCategoryId("");
    setBusinessId("");
    setDescription("");
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (mode === "single") {
      if (!name.trim()) {
        setError("Service name is required.");
        return;
      }
    } else {
      if (!bulkServices.trim()) {
        setError("Please provide at least one service.");
        return;
      }
      if (!categoryId) {
        setError("Category is required for bulk creation.");
        return;
      }
    }

    if (!businessId.trim()) {
      setError("Business ID is required.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      let res;
      if (mode === "single") {
        const payload: { name: string; category_id?: number; business_id: string; description?: string } = {
          name: name.trim(),
          business_id: businessId.trim(),
        };
        if (categoryId) payload.category_id = Number(categoryId);
        if (description.trim()) payload.description = description.trim();

        res = await api.post("/admin/services", payload);
      } else {
        res = await api.post("/admin/services/bulk", {
          services: bulkServices.trim(),
          category_id: Number(categoryId),
          business_id: businessId.trim(),
        });
      }

      if (res.data.status) {
        setName("");
        setBulkServices("");
        setCategoryId("");
        setBusinessId("");
        setDescription("");
        setError("");
        setSuccess(res.data.message || "✅ Service(s) created successfully!");
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(res.data.message || "Failed to create service(s).");
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
          {/* Mode Toggle */}
          <div className="sa__group" style={{ marginBottom: '1.5rem' }}>
            <span className="sa__label">Mode:</span>
            <div className="sa__mode-toggle">
              <button
                type="button"
                className={`sa__mode-btn ${mode === "single" ? "sa__mode-btn--active" : ""}`}
                onClick={() => { setMode("single"); setError(""); }}
              >
                Single Service
              </button>
              <button
                type="button"
                className={`sa__mode-btn ${mode === "bulk" ? "sa__mode-btn--active" : ""}`}
                onClick={() => { setMode("bulk"); setError(""); }}
              >
                Bulk Upload
              </button>
            </div>
          </div>

          {/* Business ID */}
          <div className="sa__group">
            <label className="sa__label" htmlFor="svc-businessId">
              Business ID <span className="sa__required">*</span>
            </label>
            <input
              id="svc-businessId"
              type="text"
              className="sa__input"
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
              placeholder="e.g. BUS-QVTE1BKU"
            />
          </div>

          {/* Category */}
          <div className="sa__group">
            <label className="sa__label" htmlFor="svc-category">
              Category {mode === "bulk" && <span className="sa__required">*</span>}
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
            <span className="sa__hint">
              {mode === "bulk" 
                ? "Required — all bulk services will be grouped under this category." 
                : "Optional — group this service under a category."}
            </span>
          </div>

          {mode === "single" ? (
            <>
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
            </>
          ) : (
            <>
              {/* Bulk Services Input */}
              <div className="sa__group">
                <label className="sa__label" htmlFor="svc-bulk">
                  Services (Comma or new-line separated) <span className="sa__required">*</span>
                </label>
                <textarea
                  id="svc-bulk"
                  className="sa__textarea"
                  placeholder="Service A, Service B&#10;Service C"
                  rows={6}
                  value={bulkServices}
                  onChange={(e) => { setBulkServices(e.target.value); setError(""); }}
                />
              </div>
            </>
          )}

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
