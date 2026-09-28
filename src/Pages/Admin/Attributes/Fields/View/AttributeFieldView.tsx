import { useState, useEffect, useCallback } from "react";
import api from "../../../../../api/axios";
import "./Styles/AttributeFieldView.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AttributeField {
  id: number;
  attribute_definition_id: number;
  attribute_definition_name: string;
  name: string;
  slug: string;
  data_type: string;
  sort_order: number;
  status: "active" | "inactive";
}

interface AttributeDefinition {
  id: number;
  name: string;
  category_id: number | null;
  category?: { id: number; name: string };
}

interface FlatCategory {
  id: number;
  name: string;
  label: string;
  depth: number;
}

interface Toast { id: number; type: "success" | "error"; message: string; }

const DATA_TYPES = ["string", "number", "boolean"];

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

// ─── TypeBadge ────────────────────────────────────────────────────────────────

const TypeBadge = ({ type }: { type: string }) => {
  const map: Record<string, string> = {
    string: "afv-type--string",
    number: "afv-type--number",
    boolean: "afv-type--boolean",
  };
  return <span className={`afv-type-badge ${map[type] ?? ""}`}>{type}</span>;
};

// ─── Edit Modal ───────────────────────────────────────────────────────────────

const EditModal = ({
  field, onClose, onSaved, addToast,
}: {
  field: AttributeField;
  onClose: () => void;
  onSaved: () => void;
  addToast: (t: Toast["type"], m: string) => void;
}) => {
  const [name, setName] = useState(field.name);
  const [dataType, setDataType] = useState(field.data_type);
  const [sortOrder, setSortOrder] = useState(String(field.sort_order));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) { setError("Field name is required."); return; }
    setSaving(true); setError("");
    try {
      const res = await api.put(`/admin/attribute-fields/${field.id}`, {
        name: name.trim(), data_type: dataType, sort_order: Number(sortOrder) || 0,
      });
      if (res.data.status) { addToast("success", "✅ Field updated!"); onSaved(); onClose(); }
      else setError(res.data.message || "Update failed.");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setError(err?.response?.data?.message || err?.message || "Something went wrong.");
    } finally { setSaving(false); }
  };

  return (
    <div className="afv-modal-overlay" onClick={onClose}>
      <div className="afv-modal" onClick={(e) => e.stopPropagation()}>
        <div className="afv-modal__header">
          <h2 className="afv-modal__title">Edit Field</h2>
          <button className="afv-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="afv-modal__body">
          <p className="afv-modal__parent">Attribute: <strong>{field.attribute_definition_name}</strong></p>
          <div className="afv-form__group">
            <label className="afv-form__label" htmlFor="edit-field-name">Field Name <span className="afv-required">*</span></label>
            <input id="edit-field-name" className="afv-form__input" type="text" value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }} />
          </div>
          <div className="afv-form__group">
            <label className="afv-form__label" htmlFor="edit-field-type">Data Type</label>
            <select id="edit-field-type" className="afv-form__select" value={dataType}
              onChange={(e) => setDataType(e.target.value)}>
              {DATA_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div className="afv-form__group">
            <label className="afv-form__label" htmlFor="edit-field-sort">Sort Order</label>
            <input id="edit-field-sort" className="afv-form__input afv-form__input--sm" type="number" min={0}
              value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          </div>
          {error && <p className="afv-form__error">{error}</p>}
        </div>
        <div className="afv-modal__footer">
          <button id={`field-edit-save-${field.id}`} className="afv-btn afv-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button className="afv-btn afv-btn--ghost" onClick={onClose} disabled={saving}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ─── Delete Modal ─────────────────────────────────────────────────────────────

const DeleteModal = ({
  field, onClose, onDeleted, addToast,
}: {
  field: AttributeField;
  onClose: () => void;
  onDeleted: () => void;
  addToast: (t: Toast["type"], m: string) => void;
}) => {
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await api.delete(`/admin/attribute-fields/${field.id}`);
      if (res.data.status) { addToast("success", "🗑️ Field deleted!"); onDeleted(); }
      else addToast("error", res.data.message || "Delete failed.");
    } catch { addToast("error", "Something went wrong."); }
    finally { setDeleting(false); onClose(); }
  };
  return (
    <div className="afv-modal-overlay" onClick={onClose}>
      <div className="afv-modal afv-modal--danger" onClick={(e) => e.stopPropagation()}>
        <div className="afv-modal__header">
          <h2 className="afv-modal__title">Delete Field</h2>
          <button className="afv-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="afv-modal__body">
          <div className="afv-delete-icon">🗑️</div>
          <p className="afv-delete-msg">Delete <strong>"{field.name}"</strong>?</p>
          <p className="afv-delete-warn">⚠️ This will permanently remove this field.</p>
        </div>
        <div className="afv-modal__footer">
          <button id={`field-delete-confirm-${field.id}`} className="afv-btn afv-btn--danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting…" : "Yes, Delete"}
          </button>
          <button className="afv-btn afv-btn--ghost" onClick={onClose} disabled={deleting}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const AttributeFieldView = () => {
  // Data
  const [categories, setCategories] = useState<FlatCategory[]>([]);
  const [allAttributes, setAllAttributes] = useState<AttributeDefinition[]>([]);
  const [fields, setFields] = useState<AttributeField[]>([]);

  // Selection state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedAttributeId, setSelectedAttributeId] = useState<string>("");
  const [selectedAttribute, setSelectedAttribute] = useState<AttributeDefinition | null>(null);

  // UI state
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingFields, setLoadingFields] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<AttributeField | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AttributeField | null>(null);

  // Inline add field
  const [showAddRow, setShowAddRow] = useState(false);
  const [addName, setAddName] = useState("");
  const [addDataType, setAddDataType] = useState("string");
  const [addSortOrder, setAddSortOrder] = useState("0");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  const { toasts, addToast } = useToast();

  // ── Init: load categories + all attributes ────────────────────────────────

  useEffect(() => {
    const init = async () => {
      try {
        const [catRes, attrRes] = await Promise.all([
          api.get("/admin/categories/flat"),
          api.get("/admin/attributes"),
        ]);
        if (catRes.data.status) setCategories(catRes.data.data);
        if (attrRes.data.status) setAllAttributes(attrRes.data.data);
      } catch { addToast("error", "Failed to load data."); }
      finally { setLoadingInit(false); }
    };
    init();
  }, [addToast]);

  // ── Derived: attributes filtered by selected category ─────────────────────

  const filteredAttributes = allAttributes.filter(
    (a) => a.category_id === Number(selectedCategoryId)
  );

  // ── Fetch fields for selected attribute ───────────────────────────────────

  const fetchFields = useCallback(async (attributeId: number) => {
    setLoadingFields(true);
    try {
      const res = await api.get(`/admin/attribute-fields?attribute_id=${attributeId}`);
      if (res.data.status) setFields(res.data.data);
    } catch { addToast("error", "Failed to load fields."); }
    finally { setLoadingFields(false); }
  }, [addToast]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCategoryChange = (catId: string) => {
    setSelectedCategoryId(catId);
    setSelectedAttributeId("");
    setSelectedAttribute(null);
    setFields([]);
    setShowAddRow(false);
    setAddError("");
  };

  const handleAttributeChange = (attrId: string) => {
    setSelectedAttributeId(attrId);
    const attr = allAttributes.find((a) => a.id === Number(attrId)) ?? null;
    setSelectedAttribute(attr);
    setFields([]);
    setShowAddRow(false);
    setAddError("");
    if (attrId) fetchFields(Number(attrId));
  };

  const handleToggle = async (field: AttributeField) => {
    setTogglingId(field.id);
    try {
      const res = await api.patch(`/admin/attribute-fields/${field.id}/toggle`);
      if (res.data.status) {
        addToast("success", `Status → ${res.data.data.status === "active" ? "Active ✅" : "Inactive ⛔"}`);
        fetchFields(Number(selectedAttributeId));
      } else addToast("error", res.data.message || "Toggle failed.");
    } catch { addToast("error", "Something went wrong."); }
    finally { setTogglingId(null); }
  };

  // ── Inline Add Field ──────────────────────────────────────────────────────

  const handleAddField = async () => {
    if (!addName.trim()) { setAddError("Field name is required."); return; }
    setAdding(true); setAddError("");
    try {
      const res = await api.post("/admin/attribute-fields", {
        attribute_definition_id: Number(selectedAttributeId),
        name: addName.trim(),
        data_type: addDataType,
        sort_order: Number(addSortOrder) || 0,
      });
      if (res.data.status) {
        addToast("success", "✅ Field added!");
        setAddName(""); setAddDataType("string"); setAddSortOrder("0");
        setShowAddRow(false);
        fetchFields(Number(selectedAttributeId));
      } else setAddError(res.data.message || "Failed to add field.");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setAddError(err?.response?.data?.message || err?.message || "Something went wrong.");
    } finally { setAdding(false); }
  };

  // ── Derived stats ─────────────────────────────────────────────────────────

  const activeCount = fields.filter((f) => f.status === "active").length;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="afv">
      {/* Toasts */}
      <div className="afv-toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`afv-toast afv-toast--${t.type}`}>{t.message}</div>
        ))}
      </div>

      {/* Header */}
      <div className="afv-header">
        <div>
          <h1 className="afv-title">Attribute Fields</h1>
          <p className="afv-subtitle">Select a Category → Attribute to manage its fields.</p>
        </div>
      </div>

      {/* ── Cascading Selectors ─────────────────────────────── */}
      <div className="afv-selector-card">
        {/* Step 1 — Category */}
        <div className="afv-selector-step">
          <label className="afv-selector-label" htmlFor="sel-category">
            <span className="afv-selector-num">1</span> Category
          </label>
          <select
            id="sel-category"
            className="afv-selector-select"
            value={selectedCategoryId}
            onChange={(e) => handleCategoryChange(e.target.value)}
            disabled={loadingInit}
          >
            <option value="">— Select a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="afv-selector-arrow">→</div>

        {/* Step 2 — Attribute */}
        <div className="afv-selector-step">
          <label className="afv-selector-label" htmlFor="sel-attribute">
            <span className="afv-selector-num">2</span> Attribute Definition
          </label>
          <select
            id="sel-attribute"
            className={`afv-selector-select ${!selectedCategoryId ? "afv-selector-select--disabled" : ""}`}
            value={selectedAttributeId}
            onChange={(e) => handleAttributeChange(e.target.value)}
            disabled={!selectedCategoryId}
          >
            <option value="">
              {!selectedCategoryId
                ? "— Select a category first"
                : filteredAttributes.length === 0
                ? "— No attributes for this category"
                : "— Select an attribute"}
            </option>
            {filteredAttributes.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Empty state — no selection ───────────────────────── */}
      {!selectedAttributeId && (
        <div className="afv-hint-card">
          <span className="afv-hint-icon">🏷️</span>
          <p className="afv-hint-text">
            {!selectedCategoryId
              ? "Select a category to get started."
              : filteredAttributes.length === 0
              ? "No attribute definitions found for this category. Create one first."
              : "Select an attribute definition to view and manage its fields."}
          </p>
        </div>
      )}

      {/* ── Fields section ───────────────────────────────────── */}
      {selectedAttributeId && (
        <>
          {/* Stats */}
          <div className="afv-stats">
            <div className="afv-stat">
              <span className="afv-stat__value">{fields.length}</span>
              <span className="afv-stat__label">Total Fields</span>
            </div>
            <div className="afv-stat">
              <span className="afv-stat__value afv-stat__value--green">{activeCount}</span>
              <span className="afv-stat__label">Active</span>
            </div>
            <div className="afv-stat">
              <span className="afv-stat__value afv-stat__value--purple">
                {selectedAttribute?.name ?? "—"}
              </span>
              <span className="afv-stat__label">Attribute</span>
            </div>
          </div>

          {/* Table card */}
          <div className="afv-group">
            <div className="afv-group__header">
              <span className="afv-group__name">{selectedAttribute?.name}</span>
              <div className="afv-group__right">
                <span className="afv-group__count">
                  {fields.length} field{fields.length !== 1 ? "s" : ""}
                </span>
                <button
                  id="field-add-inline-toggle"
                  className="afv-btn afv-btn--primary afv-btn--sm"
                  onClick={() => { setShowAddRow((v) => !v); setAddError(""); }}
                >
                  {showAddRow ? "✕ Cancel" : "+ Add Field"}
                </button>
              </div>
            </div>

            {/* Inline add row */}
            {showAddRow && (
              <div className="afv-add-row">
                <div className="afv-add-row__fields">
                  <div className="afv-add-row__group">
                    <label className="afv-add-row__label">Field Name *</label>
                    <input
                      id="inline-field-name"
                      className="afv-add-row__input"
                      type="text"
                      placeholder="e.g. Min Price"
                      value={addName}
                      onChange={(e) => { setAddName(e.target.value); setAddError(""); }}
                    />
                  </div>
                  <div className="afv-add-row__group">
                    <label className="afv-add-row__label">Data Type</label>
                    <select
                      id="inline-field-type"
                      className="afv-add-row__select"
                      value={addDataType}
                      onChange={(e) => setAddDataType(e.target.value)}
                    >
                      {DATA_TYPES.map((t) => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="afv-add-row__group afv-add-row__group--sm">
                    <label className="afv-add-row__label">Sort</label>
                    <input
                      id="inline-field-sort"
                      className="afv-add-row__input"
                      type="number"
                      min={0}
                      value={addSortOrder}
                      onChange={(e) => setAddSortOrder(e.target.value)}
                    />
                  </div>
                  <button
                    id="inline-field-save"
                    className="afv-btn afv-btn--primary afv-add-row__save"
                    onClick={handleAddField}
                    disabled={adding}
                  >
                    {adding ? "Saving…" : "Save"}
                  </button>
                </div>
                {addError && <p className="afv-add-row__error">{addError}</p>}
              </div>
            )}

            {/* Fields table */}
            {loadingFields ? (
              <div className="afv-loading"><div className="afv-spinner" /><span>Loading fields…</span></div>
            ) : fields.length === 0 ? (
              <div className="afv-empty">
                <p className="afv-empty__icon">🧩</p>
                <p className="afv-empty__msg">No fields yet for <strong>{selectedAttribute?.name}</strong>.</p>
                <button
                  className="afv-btn afv-btn--primary"
                  onClick={() => setShowAddRow(true)}
                >
                  Add first field
                </button>
              </div>
            ) : (
              <div className="afv-table-wrap">
                <table className="afv-table">
                  <thead>
                    <tr>
                      <th className="afv-th">#</th>
                      <th className="afv-th">Field Name</th>
                      <th className="afv-th">Slug</th>
                      <th className="afv-th">Type</th>
                      <th className="afv-th">Sort</th>
                      <th className="afv-th">Status</th>
                      <th className="afv-th">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...fields]
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((field) => (
                        <tr key={field.id} className="afv-row">
                          <td className="afv-td afv-td--id">{field.id}</td>
                          <td className="afv-td"><span className="afv-field-name">{field.name}</span></td>
                          <td className="afv-td"><code className="afv-slug">{field.slug}</code></td>
                          <td className="afv-td"><TypeBadge type={field.data_type} /></td>
                          <td className="afv-td afv-td--sort">{field.sort_order}</td>
                          <td className="afv-td">
                            <button
                              id={`field-toggle-${field.id}`}
                              className={`afv-badge ${field.status === "active" ? "afv-badge--active" : "afv-badge--inactive"} ${togglingId === field.id ? "afv-badge--loading" : ""}`}
                              onClick={() => handleToggle(field)}
                              disabled={togglingId === field.id}
                            >
                              {togglingId === field.id ? "…" : field.status === "active" ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td className="afv-td">
                            <div className="afv-actions">
                              <button
                                id={`field-edit-${field.id}`}
                                className="afv-action-btn afv-action-btn--edit"
                                onClick={() => setEditTarget(field)}
                                title="Edit"
                              >✏️</button>
                              <button
                                id={`field-delete-${field.id}`}
                                className="afv-action-btn afv-action-btn--delete"
                                onClick={() => setDeleteTarget(field)}
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
        </>
      )}

      {/* Modals */}
      {editTarget && (
        <EditModal
          field={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => fetchFields(Number(selectedAttributeId))}
          addToast={addToast}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          field={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => fetchFields(Number(selectedAttributeId))}
          addToast={addToast}
        />
      )}
    </div>
  );
};
