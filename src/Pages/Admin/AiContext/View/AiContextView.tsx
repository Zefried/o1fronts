import { useState, useEffect, useCallback } from "react";
import api from "../../../../api/axios";
import "./Styles/AiContextView.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AiContext {
  id: number;
  business_id: string;
  service_name: string;
  attribute_definition: string;
  context: string;
  prompt: string;
  images?: Array<{ id: number; image_url: string; image_name: string }>;
}

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

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

// ─── Toast Hook ───────────────────────────────────────────────────────────────

let toastId = 0;
const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((type: Toast["type"], message: string) => {
    const id = ++toastId;
    setToasts((p) => [...p, { id, type, message }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);
  return { toasts, addToast };
};

// ─── Add Modal ────────────────────────────────────────────────────────────────

const AddModal = ({
  categories,
  services,
  attributes,
  onClose,
  onSaved,
  addToast,
}: {
  categories: FlatCategory[];
  services: ServiceOption[];
  attributes: AttributeOption[];
  onClose: () => void;
  onSaved: () => void;
  addToast: (t: Toast["type"], m: string) => void;
}) => {
  const [businessId, setBusinessId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [attributeDefinition, setAttributeDefinition] = useState("");
  const [context, setContext] = useState("");
  const [prompt, setPrompt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ── Filtered by selected category ──
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

  const handleSave = async () => {
    if (!businessId.trim())    { setError("Business ID is required."); return; }
    if (!categoryId)           { setError("Please select a category first."); return; }
    if (!serviceName)          { setError("Service name is required."); return; }
    if (!attributeDefinition)  { setError("Attribute definition is required."); return; }
    if (!context.trim())       { setError("Context is required."); return; }
    if (!prompt.trim())        { setError("Prompt is required."); return; }

    setSaving(true);
    setError("");
    try {
      const res = await api.post("/admin/ai-contexts", {
        business_id: businessId.trim(),
        service_name: serviceName,
        attribute_definition: attributeDefinition,
        context: context.trim(),
        prompt: prompt.trim(),
      });
      if (res.data.status) {
        addToast("success", "✅ Context created!");
        onSaved();
        onClose();
      } else {
        setError(res.data.message || "Create failed.");
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setError(err?.response?.data?.message || err?.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="acv-modal-overlay" onClick={onClose}>
      <div className="acv-modal acv-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="acv-modal__header">
          <h2 className="acv-modal__title">Add AI Context</h2>
          <button className="acv-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="acv-modal__body">

          {/* Business ID */}
          <div className="acv-form__group">
            <label className="acv-form__label" htmlFor="add-business-id">
              Business ID <span className="acv-required">*</span>
            </label>
            <input
              id="add-business-id"
              className="acv-form__input"
              type="text"
              placeholder="e.g. AX21Interior"
              value={businessId}
              onChange={(e) => { setBusinessId(e.target.value); setError(""); }}
            />
          </div>

          {/* Step 1 — Category */}
          <div className="acv-form__group">
            <label className="acv-form__label" htmlFor="add-category">
              <span className="acv-step-num">1</span> Category <span className="acv-required">*</span>
            </label>
            <select
              id="add-category"
              className="acv-form__select"
              value={categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="">— Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Step 2 — Service + Attribute */}
          <div className="acv-form__row">
            <div className="acv-form__group">
              <label className="acv-form__label" htmlFor="add-service-name">
                <span className="acv-step-num">2</span> Service Name <span className="acv-required">*</span>
              </label>
              <select
                id="add-service-name"
                className={`acv-form__select ${!categoryId ? "acv-form__select--disabled" : ""}`}
                value={serviceName}
                onChange={(e) => { setServiceName(e.target.value); setError(""); }}
                disabled={!categoryId}
              >
                <option value="">
                  {!categoryId ? "— Select category first" : filteredServices.length === 0 ? "— No services for this category" : "— Select service"}
                </option>
                {filteredServices.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="acv-form__group">
              <label className="acv-form__label" htmlFor="add-attr-def">
                <span className="acv-step-num">3</span> Attribute Definition <span className="acv-required">*</span>
              </label>
              <select
                id="add-attr-def"
                className={`acv-form__select ${!categoryId ? "acv-form__select--disabled" : ""}`}
                value={attributeDefinition}
                onChange={(e) => { setAttributeDefinition(e.target.value); setError(""); }}
                disabled={!categoryId}
              >
                <option value="">
                  {!categoryId ? "— Select category first" : filteredAttributes.length === 0 ? "— No attributes for this category" : "— Select attribute"}
                </option>
                {filteredAttributes.map((a) => (
                  <option key={a.id} value={a.name}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Context */}
          <div className="acv-form__group">
            <label className="acv-form__label" htmlFor="add-context">
              Context <span className="acv-required">*</span>
            </label>
            <textarea
              id="add-context"
              className="acv-form__textarea"
              rows={6}
              placeholder={"pricing_unit: running_ft\nprice_per_unit: 5000\nmin_price: 150000"}
              value={context}
              onChange={(e) => { setContext(e.target.value); setError(""); }}
            />
          </div>

          {/* Prompt */}
          <div className="acv-form__group">
            <label className="acv-form__label" htmlFor="add-prompt">
              Prompt <span className="acv-required">*</span>
            </label>
            <textarea
              id="add-prompt"
              className="acv-form__textarea"
              rows={4}
              placeholder="Short instruction for the AI on how to use the context above..."
              value={prompt}
              onChange={(e) => { setPrompt(e.target.value); setError(""); }}
            />
          </div>

          {error && <p className="acv-form__error">{error}</p>}
        </div>
        <div className="acv-modal__footer">
          <button id="ctx-add-save" className="acv-btn acv-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Create Context"}
          </button>
          <button className="acv-btn acv-btn--ghost" onClick={onClose} disabled={saving}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ─── Edit Modal ───────────────────────────────────────────────────────────────

const EditModal = ({
  record,
  categories,
  services,
  attributes,
  onClose,
  onSaved,
  addToast,
}: {
  record: AiContext;
  categories: FlatCategory[];
  services: ServiceOption[];
  attributes: AttributeOption[];
  onClose: () => void;
  onSaved: () => void;
  addToast: (t: Toast["type"], m: string) => void;
}) => {
  // Pre-select category from the existing service_name
  const initCatId = () => {
    const svc = services.find((s) => s.name === record.service_name);
    return svc?.category_id ? String(svc.category_id) : "";
  };

  const [businessId, setBusinessId] = useState(record.business_id);
  const [categoryId, setCategoryId] = useState(initCatId);
  const [serviceName, setServiceName] = useState(record.service_name);
  const [attributeDefinition, setAttributeDefinition] = useState(record.attribute_definition);
  const [context, setContext] = useState(record.context);
  const [prompt, setPrompt] = useState(record.prompt);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

  const handleSave = async () => {
    if (!businessId.trim())    { setError("Business ID is required."); return; }
    if (!serviceName)          { setError("Service name is required."); return; }
    if (!attributeDefinition)  { setError("Attribute definition is required."); return; }
    if (!context.trim())       { setError("Context is required."); return; }
    if (!prompt.trim())        { setError("Prompt is required."); return; }

    setSaving(true);
    setError("");
    try {
      const res = await api.put(`/admin/ai-contexts/${record.id}`, {
        business_id: businessId.trim(),
        service_name: serviceName,
        attribute_definition: attributeDefinition,
        context: context.trim(),
        prompt: prompt.trim(),
      });
      if (res.data.status) {
        addToast("success", "✅ Context updated!");
        onSaved();
        onClose();
      } else {
        setError(res.data.message || "Update failed.");
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setError(err?.response?.data?.message || err?.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="acv-modal-overlay" onClick={onClose}>
      <div className="acv-modal acv-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="acv-modal__header">
          <h2 className="acv-modal__title">Edit AI Context</h2>
          <button className="acv-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="acv-modal__body">

          {/* Business ID */}
          <div className="acv-form__group">
            <label className="acv-form__label" htmlFor="edit-business-id">
              Business ID <span className="acv-required">*</span>
            </label>
            <input
              id="edit-business-id"
              className="acv-form__input"
              type="text"
              value={businessId}
              onChange={(e) => { setBusinessId(e.target.value); setError(""); }}
            />
          </div>

          {/* Step 1 — Category */}
          <div className="acv-form__group">
            <label className="acv-form__label" htmlFor="edit-category">
              <span className="acv-step-num">1</span> Category
            </label>
            <select
              id="edit-category"
              className="acv-form__select"
              value={categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="">— All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Step 2 — Service + Attribute */}
          <div className="acv-form__row">
            <div className="acv-form__group">
              <label className="acv-form__label" htmlFor="edit-service-name">
                <span className="acv-step-num">2</span> Service Name <span className="acv-required">*</span>
              </label>
              <select
                id="edit-service-name"
                className="acv-form__select"
                value={serviceName}
                onChange={(e) => { setServiceName(e.target.value); setError(""); }}
              >
                <option value="">— Select service</option>
                {filteredServices.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="acv-form__group">
              <label className="acv-form__label" htmlFor="edit-attr-def">
                <span className="acv-step-num">3</span> Attribute Definition <span className="acv-required">*</span>
              </label>
              <select
                id="edit-attr-def"
                className="acv-form__select"
                value={attributeDefinition}
                onChange={(e) => { setAttributeDefinition(e.target.value); setError(""); }}
              >
                <option value="">— Select attribute</option>
                {filteredAttributes.map((a) => (
                  <option key={a.id} value={a.name}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Context */}
          <div className="acv-form__group">
            <label className="acv-form__label" htmlFor="edit-context">
              Context <span className="acv-required">*</span>
            </label>
            <textarea
              id="edit-context"
              className="acv-form__textarea"
              rows={6}
              value={context}
              onChange={(e) => { setContext(e.target.value); setError(""); }}
            />
          </div>

          {/* Prompt */}
          <div className="acv-form__group">
            <label className="acv-form__label" htmlFor="edit-prompt">
              Prompt <span className="acv-required">*</span>
            </label>
            <textarea
              id="edit-prompt"
              className="acv-form__textarea"
              rows={4}
              value={prompt}
              onChange={(e) => { setPrompt(e.target.value); setError(""); }}
            />
          </div>

          {error && <p className="acv-form__error">{error}</p>}
        </div>
        <div className="acv-modal__footer">
          <button
            id={`ctx-edit-save-${record.id}`}
            className="acv-btn acv-btn--primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button className="acv-btn acv-btn--ghost" onClick={onClose} disabled={saving}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ─── Delete Modal ─────────────────────────────────────────────────────────────

const DeleteModal = ({
  record,
  onClose,
  onDeleted,
  addToast,
}: {
  record: AiContext;
  onClose: () => void;
  onDeleted: () => void;
  addToast: (t: Toast["type"], m: string) => void;
}) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await api.delete(`/admin/ai-contexts/${record.id}`);
      if (res.data.status) {
        addToast("success", "🗑️ Context deleted!");
        onDeleted();
        onClose();
      } else {
        addToast("error", res.data.message || "Delete failed.");
        onClose();
      }
    } catch {
      addToast("error", "Something went wrong.");
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="acv-modal-overlay" onClick={onClose}>
      <div className="acv-modal acv-modal--danger" onClick={(e) => e.stopPropagation()}>
        <div className="acv-modal__header">
          <h2 className="acv-modal__title">Delete Context</h2>
          <button className="acv-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="acv-modal__body">
          <div className="acv-delete-icon">🗑️</div>
          <p className="acv-delete-msg">
            Delete context for <strong>"{record.service_name} → {record.attribute_definition}"</strong>?
          </p>
          <p className="acv-delete-warn">⚠️ This will permanently remove this AI context record.</p>
        </div>
        <div className="acv-modal__footer">
          <button
            id={`ctx-delete-confirm-${record.id}`}
            className="acv-btn acv-btn--danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Yes, Delete"}
          </button>
          <button className="acv-btn acv-btn--ghost" onClick={onClose} disabled={deleting}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ─── Images Modal ─────────────────────────────────────────────────────────────

const ImagesModal = ({
  record,
  onClose,
}: {
  record: AiContext;
  onClose: () => void;
}) => {
  const images = record.images || [];

  return (
    <div className="acv-modal-overlay">
      <div className="acv-modal acv-modal--images">
        <div className="acv-modal-header">
          <h2 className="acv-modal-title">Images for {record.service_name}</h2>
          <button className="acv-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="acv-modal-body">
          {images.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--acv-text-muted)" }}>No images uploaded.</p>
          ) : (
            <div className="acv-images-grid">
              {images.map((img) => {
                const imgUrl = `http://127.0.0.1:8000/storage/${img.image_url}`;
                return (
                  <div key={img.id} className="acv-image-item">
                    <img src={imgUrl} alt={img.image_name} className="acv-image-thumb" />
                    <a href={imgUrl} target="_blank" rel="noreferrer" className="acv-image-link" title={img.image_name}>
                      View Link
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="acv-modal-footer">
          <button className="acv-btn acv-btn--secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const AiContextView = () => {
  const [records, setRecords] = useState<AiContext[]>([]);
  const [categories, setCategories] = useState<FlatCategory[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [attributes, setAttributes] = useState<AttributeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<AiContext | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AiContext | null>(null);
  const [imagesTarget, setImagesTarget] = useState<AiContext | null>(null);

  const { toasts, addToast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ctxRes, catRes, svcRes, attrRes] = await Promise.all([
        api.get("/admin/ai-contexts"),
        api.get("/admin/categories/flat"),
        api.get("/admin/services"),
        api.get("/admin/attributes"),
      ]);
      if (ctxRes.data.status)  setRecords(ctxRes.data.data);
      if (catRes.data.status)  setCategories(catRes.data.data);
      if (svcRes.data.status)  setServices(svcRes.data.data);
      if (attrRes.data.status) setAttributes(attrRes.data.data);
    } catch {
      addToast("error", "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = records.filter((r) =>
    r.business_id.toLowerCase().includes(search.toLowerCase()) ||
    r.service_name.toLowerCase().includes(search.toLowerCase()) ||
    r.attribute_definition.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="acv">
      {/* Toast Stack */}
      <div className="acv-toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`acv-toast acv-toast--${t.type}`}>{t.message}</div>
        ))}
      </div>

      {/* Header */}
      <div className="acv-header">
        <div>
          <h1 className="acv-title">AI Contexts</h1>
          <p className="acv-subtitle">Manage service + attribute context data for the AI chatbot.</p>
        </div>
        <button id="ctx-add-btn" className="acv-btn acv-btn--primary" onClick={() => setShowAdd(true)}>
          + Add Context
        </button>
      </div>

      {/* Stats */}
      <div className="acv-stats">
        <div className="acv-stat">
          <span className="acv-stat__value">{records.length}</span>
          <span className="acv-stat__label">Total</span>
        </div>
        <div className="acv-stat">
          <span className="acv-stat__value acv-stat__value--blue">
            {[...new Set(records.map((r) => r.service_name))].length}
          </span>
          <span className="acv-stat__label">Services</span>
        </div>
        <div className="acv-stat">
          <span className="acv-stat__value acv-stat__value--purple">
            {[...new Set(records.map((r) => r.attribute_definition))].length}
          </span>
          <span className="acv-stat__label">Attributes</span>
        </div>
      </div>

      {/* Search */}
      <div className="acv-search-wrap">
        <input
          id="ctx-search"
          type="text"
          className="acv-search"
          placeholder="Search by business ID, service, or attribute…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="acv-card">
        {loading ? (
          <div className="acv-loading">
            <div className="acv-spinner" />
            <span>Loading contexts…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="acv-empty">
            <p className="acv-empty__icon">🤖</p>
            <p className="acv-empty__msg">
              {search ? "No contexts match your search." : "No AI contexts yet."}
            </p>
            {!search && (
              <button className="acv-btn acv-btn--primary" onClick={() => setShowAdd(true)}>
                Add first context
              </button>
            )}
          </div>
        ) : (
          <div className="acv-table-wrap">
            <table className="acv-table">
              <thead>
                <tr>
                  <th className="acv-th">#</th>
                  <th className="acv-th">Business ID</th>
                  <th className="acv-th">Service</th>
                  <th className="acv-th">Attribute</th>
                  <th className="acv-th">Context</th>
                  <th className="acv-th">Prompt</th>
                  <th className="acv-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="acv-row">
                    <td className="acv-td acv-td--id">{r.id}</td>
                    <td className="acv-td">
                      <span className="acv-business-badge">{r.business_id}</span>
                    </td>
                    <td className="acv-td">
                      <span className="acv-service-name">{r.service_name}</span>
                    </td>
                    <td className="acv-td">
                      <span className="acv-attr-badge">{r.attribute_definition}</span>
                    </td>
                    <td className="acv-td acv-td--text">
                      <span className="acv-truncate" title={r.context}>
                        {r.context.length > 80 ? r.context.slice(0, 80) + "…" : r.context}
                      </span>
                    </td>
                    <td className="acv-td acv-td--text">
                      <span className="acv-truncate" title={r.prompt}>
                        {r.prompt.length > 70 ? r.prompt.slice(0, 70) + "…" : r.prompt}
                      </span>
                    </td>
                    <td className="acv-td">
                      <div className="acv-actions">
                        {r.images && r.images.length > 0 && (
                          <button
                            id={`ctx-images-${r.id}`}
                            className="acv-action-btn acv-action-btn--images"
                            onClick={() => setImagesTarget(r)}
                            title="View Images"
                          >
                            🖼️ <span style={{ fontSize: "12px", marginLeft: "2px" }}>({r.images.length})</span>
                          </button>
                        )}
                        <button
                          id={`ctx-edit-${r.id}`}
                          className="acv-action-btn acv-action-btn--edit"
                          onClick={() => setEditTarget(r)}
                          title="Edit"
                        >✏️</button>
                        <button
                          id={`ctx-delete-${r.id}`}
                          className="acv-action-btn acv-action-btn--delete"
                          onClick={() => setDeleteTarget(r)}
                          title="Delete"
                        >🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAdd && (
        <AddModal
          categories={categories}
          services={services}
          attributes={attributes}
          onClose={() => setShowAdd(false)}
          onSaved={fetchData}
          addToast={addToast}
        />
      )}
      {editTarget && (
        <EditModal
          record={editTarget}
          categories={categories}
          services={services}
          attributes={attributes}
          onClose={() => setEditTarget(null)}
          onSaved={fetchData}
          addToast={addToast}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          record={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={fetchData}
          addToast={addToast}
        />
      )}
      {imagesTarget && (
        <ImagesModal
          record={imagesTarget}
          onClose={() => setImagesTarget(null)}
        />
      )}
    </div>
  );
};
