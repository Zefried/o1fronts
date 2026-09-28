import { useState, useEffect, useCallback } from "react";
import api from "../../../../api/axios";
import "./Styles/AttributeView.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Attribute {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  status: "active" | "inactive";
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

// ─── Edit Modal ───────────────────────────────────────────────────────────────

const EditModal = ({
  attr, categories, onClose, onSaved, addToast,
}: {
  attr: Attribute;
  categories: FlatCategory[];
  onClose: () => void;
  onSaved: () => void;
  addToast: (t: Toast["type"], m: string) => void;
}) => {
  const [name, setName] = useState(attr.name);
  const [categoryId, setCategoryId] = useState<string>(attr.category_id ? String(attr.category_id) : "");
  const [description, setDescription] = useState(attr.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) { setError("Attribute name is required."); return; }
    setSaving(true); setError("");
    try {
      const res = await api.put(`/admin/attributes/${attr.id}`, {
        name: name.trim(),
        category_id: categoryId ? Number(categoryId) : null,
        description: description.trim() || null,
      });
      if (res.data.status) { addToast("success", "✅ Attribute updated!"); onSaved(); onClose(); }
      else setError(res.data.message || "Update failed.");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setError(err?.response?.data?.message || err?.message || "Something went wrong.");
    } finally { setSaving(false); }
  };

  return (
    <div className="av-modal-overlay" onClick={onClose}>
      <div className="av-modal" onClick={(e) => e.stopPropagation()}>
        <div className="av-modal__header">
          <h2 className="av-modal__title">Edit Attribute</h2>
          <button className="av-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="av-modal__body">
          <div className="av-form__group">
            <label className="av-form__label" htmlFor="edit-attr-name">Name <span className="av-required">*</span></label>
            <input id="edit-attr-name" className="av-form__input" type="text" value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }} />
          </div>
          <div className="av-form__group">
            <label className="av-form__label" htmlFor="edit-attr-cat">Category</label>
            <select id="edit-attr-cat" className="av-form__select" value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">— Global</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div className="av-form__group">
            <label className="av-form__label" htmlFor="edit-attr-desc">Description</label>
            <textarea id="edit-attr-desc" className="av-form__textarea" rows={3}
              value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {error && <p className="av-form__error">{error}</p>}
        </div>
        <div className="av-modal__footer">
          <button id={`attr-edit-save-${attr.id}`} className="av-btn av-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button className="av-btn av-btn--ghost" onClick={onClose} disabled={saving}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ─── Delete Modal ─────────────────────────────────────────────────────────────

const DeleteModal = ({
  attr, onClose, onDeleted, addToast,
}: {
  attr: Attribute;
  onClose: () => void;
  onDeleted: () => void;
  addToast: (t: Toast["type"], m: string) => void;
}) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await api.delete(`/admin/attributes/${attr.id}`);
      if (res.data.status) { addToast("success", "🗑️ Attribute deleted!"); onDeleted(); }
      else addToast("error", res.data.message || "Delete failed.");
    } catch { addToast("error", "Something went wrong."); }
    finally { setDeleting(false); onClose(); }
  };

  return (
    <div className="av-modal-overlay" onClick={onClose}>
      <div className="av-modal av-modal--danger" onClick={(e) => e.stopPropagation()}>
        <div className="av-modal__header">
          <h2 className="av-modal__title">Delete Attribute</h2>
          <button className="av-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="av-modal__body">
          <div className="av-delete-icon">🗑️</div>
          <p className="av-delete-msg">Delete <strong>"{attr.name}"</strong>?</p>
          <p className="av-delete-warn">⚠️ All fields and data tied to this attribute will also be removed.</p>
        </div>
        <div className="av-modal__footer">
          <button id={`attr-delete-confirm-${attr.id}`} className="av-btn av-btn--danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting…" : "Yes, Delete"}
          </button>
          <button className="av-btn av-btn--ghost" onClick={onClose} disabled={deleting}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const AttributeView = () => {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [categories, setCategories] = useState<FlatCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("");

  const [editTarget, setEditTarget] = useState<Attribute | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Attribute | null>(null);

  const { toasts, addToast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [attrRes, catRes] = await Promise.all([
        api.get("/admin/attributes"),
        api.get("/admin/categories/flat"),
      ]);
      if (attrRes.data.status) setAttributes(attrRes.data.data);
      if (catRes.data.status) setCategories(catRes.data.data);
    } catch { addToast("error", "Failed to load attributes."); }
    finally { setLoading(false); }
  }, [addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggle = async (attr: Attribute) => {
    setTogglingId(attr.id);
    try {
      const res = await api.patch(`/admin/attributes/${attr.id}/toggle`);
      if (res.data.status) {
        addToast("success", `Status → ${res.data.data.status === "active" ? "Active ✅" : "Inactive ⛔"}`);
        fetchData();
      } else addToast("error", res.data.message || "Toggle failed.");
    } catch { addToast("error", "Something went wrong."); }
    finally { setTogglingId(null); }
  };

  const filtered = attributes.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.category?.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === ""
      ? true
      : filterCat === "global"
      ? a.category_id === null
      : a.category_id === Number(filterCat);
    return matchSearch && matchCat;
  });

  const activeCount = attributes.filter((a) => a.status === "active").length;
  const globalCount = attributes.filter((a) => a.category_id === null).length;

  return (
    <div className="av">
      {/* Toasts */}
      <div className="av-toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`av-toast av-toast--${t.type}`}>{t.message}</div>
        ))}
      </div>

      {/* Header */}
      <div className="av-header">
        <div>
          <h1 className="av-title">Attribute Definitions</h1>
          <p className="av-subtitle">Define attributes (Price, Warranty, etc.) for your categories.</p>
        </div>
        <a href="/dashboard/attributes/add" className="av-btn av-btn--primary">+ Add Attribute</a>
      </div>

      {/* Stats */}
      <div className="av-stats">
        <div className="av-stat"><span className="av-stat__value">{attributes.length}</span><span className="av-stat__label">Total</span></div>
        <div className="av-stat"><span className="av-stat__value av-stat__value--green">{activeCount}</span><span className="av-stat__label">Active</span></div>
        <div className="av-stat"><span className="av-stat__value av-stat__value--purple">{globalCount}</span><span className="av-stat__label">Global</span></div>
        <div className="av-stat"><span className="av-stat__value">{attributes.length - globalCount}</span><span className="av-stat__label">Category-specific</span></div>
      </div>

      {/* Filters */}
      <div className="av-filters">
        <input id="attr-search" className="av-search" type="text" placeholder="Search by name or category…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <select id="attr-filter-cat" className="av-filter-select" value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}>
          <option value="">All categories</option>
          <option value="global">Global only</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="av-card">
        {loading ? (
          <div className="av-loading"><div className="av-spinner" /><span>Loading attributes…</span></div>
        ) : filtered.length === 0 ? (
          <div className="av-empty">
            <p className="av-empty__icon">🏷️</p>
            <p className="av-empty__msg">{search || filterCat ? "No attributes match your filters." : "No attributes yet."}</p>
            {!search && !filterCat && (
              <a href="/dashboard/attributes/add" className="av-btn av-btn--primary">Add your first attribute</a>
            )}
          </div>
        ) : (
          <div className="av-table-wrap">
            <table className="av-table">
              <thead>
                <tr>
                  <th className="av-th">Name</th>
                  <th className="av-th">Category</th>
                  <th className="av-th">Description</th>
                  <th className="av-th">Status</th>
                  <th className="av-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((attr) => (
                  <tr key={attr.id} className="av-row">
                    <td className="av-td av-td--name">
                      <span className="av-name">{attr.name}</span>
                      <code className="av-slug">{attr.slug}</code>
                    </td>
                    <td className="av-td">
                      {attr.category
                        ? <span className="av-cat-badge">{attr.category.name}</span>
                        : <span className="av-global-badge">🌐 Global</span>}
                    </td>
                    <td className="av-td av-td--desc">
                      {attr.description
                        ? <span className="av-desc" title={attr.description}>
                            {attr.description.length > 60 ? attr.description.slice(0, 60) + "…" : attr.description}
                          </span>
                        : <span className="av-none">—</span>}
                    </td>
                    <td className="av-td">
                      <button
                        id={`attr-toggle-${attr.id}`}
                        className={`av-badge ${attr.status === "active" ? "av-badge--active" : "av-badge--inactive"} ${togglingId === attr.id ? "av-badge--loading" : ""}`}
                        onClick={() => handleToggle(attr)} disabled={togglingId === attr.id}>
                        {togglingId === attr.id ? "…" : attr.status === "active" ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="av-td">
                      <div className="av-actions">
                        <button id={`attr-edit-${attr.id}`} className="av-action-btn av-action-btn--edit"
                          onClick={() => setEditTarget(attr)} title="Edit">✏️</button>
                        <button id={`attr-delete-${attr.id}`} className="av-action-btn av-action-btn--delete"
                          onClick={() => setDeleteTarget(attr)} title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editTarget && (
        <EditModal attr={editTarget} categories={categories}
          onClose={() => setEditTarget(null)} onSaved={fetchData} addToast={addToast} />
      )}
      {deleteTarget && (
        <DeleteModal attr={deleteTarget}
          onClose={() => setDeleteTarget(null)} onDeleted={fetchData} addToast={addToast} />
      )}
    </div>
  );
};
