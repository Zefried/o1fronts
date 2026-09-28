import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../api/axios";
import "./Styles/AiContextAdd.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlatCategory {
  id: number;
  name: string;
  label: string;
  depth: number;
}

interface ServiceOption {
  id: number;
  name: string;
  category_id: number | null;
}

interface AttributeOption {
  id: number;
  name: string;
  category_id: number | null;
}

interface ApiError {
  response?: { data?: { message?: string } };
  message?: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const AiContextAdd = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<FlatCategory[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [attributes, setAttributes] = useState<AttributeOption[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);

  const [businessId, setBusinessId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [attributeDefinition, setAttributeDefinition] = useState("");
  const [context, setContext] = useState("");
  const [prompt, setPrompt] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ── Load dropdowns ──
  useEffect(() => {
    const init = async () => {
      try {
        const [catRes, svcRes, attrRes] = await Promise.all([
          api.get("/admin/categories/flat"),
          api.get("/admin/services"),
          api.get("/admin/attributes"),
        ]);
        if (catRes.data.status)  setCategories(catRes.data.data);
        if (svcRes.data.status)  setServices(svcRes.data.data);
        if (attrRes.data.status) setAttributes(attrRes.data.data);
      } catch {
        setError("Failed to load options.");
      } finally {
        setLoadingInit(false);
      }
    };
    init();
  }, []);

  // ── Cascade ──
  const filteredServices = categoryId
    ? services.filter((s) => s.category_id === Number(categoryId))
    : services;

  const filteredAttributes = categoryId
    ? attributes.filter((a) => a.category_id === Number(categoryId))
    : attributes;

  const handleCategoryChange = (val: string) => {
    setCategoryId(val);
    setServiceName("");
    setAttributeDefinition("");
    setError("");
  };

  const handleReset = () => {
    setCategoryId("");
    setServiceName("");
    setAttributeDefinition("");
    setBusinessId("");
    setContext("");
    setPrompt("");
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!businessId.trim())   { setError("Business ID is required."); return; }
    if (!categoryId)          { setError("Please select a category first."); return; }
    if (!serviceName)         { setError("Service name is required."); return; }
    if (!attributeDefinition) { setError("Attribute definition is required."); return; }
    if (!context.trim())      { setError("Context is required."); return; }
    if (!prompt.trim())       { setError("Prompt is required."); return; }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.post("/admin/ai-contexts", {
        business_id: businessId.trim(),
        service_name: serviceName,
        attribute_definition: attributeDefinition,
        context: context.trim(),
        prompt: prompt.trim(),
      });

      if (res.data.status) {
        setSuccess("✅ Context created successfully!");
        setTimeout(() => navigate("/dashboard/ai-contexts"), 1200);
      } else {
        setError(res.data.message || "Failed to create context.");
      }
    } catch (err: unknown) {
      const e = err as ApiError;
      setError(e?.response?.data?.message || e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingInit) {
    return (
      <div className="aca">
        <div className="aca__loading">
          <div className="aca__spinner" />
          <span>Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="aca">
      <div className="aca__header">
        <div>
          <h1 className="aca__title">Add AI Context</h1>
          <p className="aca__subtitle">Create a new context record for the AI chatbot.</p>
        </div>
        <button className="aca__back" onClick={() => navigate("/dashboard/ai-contexts")}>
          ← Back to Contexts
        </button>
      </div>

      <div className="aca__card">
        <form onSubmit={handleSubmit} noValidate>

          {/* Business ID */}
          <div className="aca__group">
            <label className="aca__label" htmlFor="aca-business-id">
              Business ID <span className="aca__required">*</span>
            </label>
            <input
              id="aca-business-id"
              type="text"
              className="aca__input"
              placeholder="e.g. AX21Interior"
              value={businessId}
              onChange={(e) => { setBusinessId(e.target.value); setError(""); }}
            />
          </div>

          {/* Step 1 — Category */}
          <div className="aca__group">
            <label className="aca__label" htmlFor="aca-category">
              <span className="aca__step">1</span> Category <span className="aca__required">*</span>
            </label>
            <select
              id="aca-category"
              className="aca__select"
              value={categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="">— Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            <span className="aca__hint">Select a category to filter services and attributes.</span>
          </div>

          {/* Step 2 — Service + Attribute side by side */}
          <div className="aca__row">
            <div className="aca__group">
              <label className="aca__label" htmlFor="aca-service">
                <span className="aca__step">2</span> Service Name <span className="aca__required">*</span>
              </label>
              <select
                id="aca-service"
                className={`aca__select ${!categoryId ? "aca__select--disabled" : ""}`}
                value={serviceName}
                onChange={(e) => { setServiceName(e.target.value); setError(""); }}
                disabled={!categoryId}
              >
                <option value="">
                  {!categoryId
                    ? "— Select category first"
                    : filteredServices.length === 0
                    ? "— No services for this category"
                    : "— Select service"}
                </option>
                {filteredServices.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="aca__group">
              <label className="aca__label" htmlFor="aca-attribute">
                <span className="aca__step">3</span> Attribute Definition <span className="aca__required">*</span>
              </label>
              <select
                id="aca-attribute"
                className={`aca__select ${!categoryId ? "aca__select--disabled" : ""}`}
                value={attributeDefinition}
                onChange={(e) => { setAttributeDefinition(e.target.value); setError(""); }}
                disabled={!categoryId}
              >
                <option value="">
                  {!categoryId
                    ? "— Select category first"
                    : filteredAttributes.length === 0
                    ? "— No attributes for this category"
                    : "— Select attribute"}
                </option>
                {filteredAttributes.map((a) => (
                  <option key={a.id} value={a.name}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Context */}
          <div className="aca__group">
            <label className="aca__label" htmlFor="aca-context">
              Context <span className="aca__required">*</span>
            </label>
            <textarea
              id="aca-context"
              className="aca__textarea aca__textarea--mono"
              rows={7}
              placeholder={"pricing_unit: running_ft\nprice_per_unit: 5000\nmin_price: 150000\nmax_price: 500000"}
              value={context}
              onChange={(e) => { setContext(e.target.value); setError(""); }}
            />
            <span className="aca__hint">Plain key: value pairs the AI will read.</span>
          </div>

          {/* Prompt */}
          <div className="aca__group">
            <label className="aca__label" htmlFor="aca-prompt">
              Prompt <span className="aca__required">*</span>
            </label>
            <textarea
              id="aca-prompt"
              className="aca__textarea"
              rows={4}
              placeholder="Short instruction for the AI on how to use the context above..."
              value={prompt}
              onChange={(e) => { setPrompt(e.target.value); setError(""); }}
            />
            <span className="aca__hint">Keep it short and include a constraint (e.g. "Do not invent…").</span>
          </div>

          {error   && <p className="aca__error">{error}</p>}
          {success && <p className="aca__success">{success}</p>}

          <div className="aca__actions">
            <button
              id="aca-submit"
              type="submit"
              className="aca__btn aca__btn--primary"
              disabled={loading}
            >
              {loading ? "Saving…" : "Save Context"}
            </button>
            <button
              type="button"
              className="aca__btn aca__btn--reset"
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
