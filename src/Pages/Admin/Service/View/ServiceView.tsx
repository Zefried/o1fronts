import { useState, useEffect, useCallback } from "react";
import api from "../../../../api/axios";
import "./Styles/ServiceView.css";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Service {
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
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);
  return { toasts, addToast };
};

// ─── Edit Modal ───────────────────────────────────────────────────────────────

interface EditModalProps {
  service: Service;
  categories: FlatCategory[];
  onClose: () => void;
  onSaved: () => void;
  addToast: (type: Toast["type"], msg: string) => void;
}

const EditModal = ({ service, categories, onClose, onSaved, addToast }: EditModalProps) => {
  const [name, setName] = useState(service.name);
  const [categoryId, setCategoryId] = useState<string>(
    service.category_id ? String(service.category_id) : ""
  );
  const [description, setDescription] = useState(service.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) { setError("Service name is required."); return; }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: name.trim(),
        category_id: categoryId ? Number(categoryId) : null,
        description: description.trim() || null,
      };
      const res = await api.put(`/admin/services/${service.id}`, payload);
      if (res.data.status) {
        addToast("success", "✅ Service updated successfully!");
        onSaved();
        onClose();
      } else {
        setError(res.data.message || "Update failed.");
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message || e?.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sv-modal-overlay" onClick={onClose}>
      <div className="sv-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sv-modal__header">
          <h2 className="sv-modal__title">Edit Service</h2>
          <button className="sv-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="sv-modal__body">
          <div className="sv-form__group">
            <label className="sv-form__label" htmlFor="edit-svc-name">
              Service Name <span className="sv-required">*</span>
            </label>
            <input
              id="edit-svc-name"
              type="text"
              className="sv-form__input"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
            />
          </div>
          <div className="sv-form__group">
            <label className="sv-form__label" htmlFor="edit-svc-cat">Category</label>
            <select
              id="edit-svc-cat"
              className="sv-form__select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">— None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="sv-form__group">
            <label className="sv-form__label" htmlFor="edit-svc-desc">Description</label>
            <textarea
              id="edit-svc-desc"
              className="sv-form__textarea"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description for AI context…"
            />
          </div>
          {error && <p className="sv-form__error">{error}</p>}
        </div>
        <div className="sv-modal__footer">
          <button
            id={`svc-edit-save-${service.id}`}
            className="sv-btn sv-btn--primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button className="sv-btn sv-btn--ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Delete Modal ─────────────────────────────────────────────────────────────

interface DeleteModalProps {
  service: Service;
  onClose: () => void;
  onDeleted: () => void;
  addToast: (type: Toast["type"], msg: string) => void;
}

const DeleteModal = ({ service, onClose, onDeleted, addToast }: DeleteModalProps) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await api.delete(`/admin/services/${service.id}`);
      if (res.data.status) {
        addToast("success", "🗑️ Service deleted successfully!");
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
    <div className="sv-modal-overlay" onClick={onClose}>
      <div className="sv-modal sv-modal--danger" onClick={(e) => e.stopPropagation()}>
        <div className="sv-modal__header">
          <h2 className="sv-modal__title">Delete Service</h2>
          <button className="sv-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="sv-modal__body">
          <div className="sv-delete-icon">🗑️</div>
          <p className="sv-delete-msg">
            Are you sure you want to delete <strong>"{service.name}"</strong>?
          </p>
          <p className="sv-delete-warn">
            ⚠️ All associated attribute data will also be deleted.
          </p>
        </div>
        <div className="sv-modal__footer">
          <button
            id={`svc-delete-confirm-${service.id}`}
            className="sv-btn sv-btn--danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Yes, Delete"}
          </button>
          <button className="sv-btn sv-btn--ghost" onClick={onClose} disabled={deleting}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Bulk Delete Modal ────────────────────────────────────────────────────────
const BulkDeleteModal = ({ ids, onClose, onDeleted, addToast }: { ids: number[], onClose: () => void, onDeleted: () => void, addToast: (type: Toast["type"], msg: string) => void }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await api.delete(`/admin/services/bulk`, { data: { ids } });
      if (res.data.status) {
        addToast("success", `🗑️ ${res.data.message || "Services deleted successfully!"}`);
        onDeleted();
        onClose();
      } else {
        addToast("error", res.data.message || "Bulk delete failed.");
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
    <div className="sv-modal-overlay" onClick={onClose}>
      <div className="sv-modal sv-modal--danger" onClick={(e) => e.stopPropagation()}>
        <div className="sv-modal__header">
          <h2 className="sv-modal__title">Bulk Delete Services</h2>
          <button className="sv-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="sv-modal__body">
          <div className="sv-delete-icon">🗑️</div>
          <p className="sv-delete-msg">
            Are you sure you want to delete <strong>{ids.length}</strong> selected services?
          </p>
          <p className="sv-delete-warn">
            ⚠️ This action cannot be undone. All associated attribute data will also be deleted.
          </p>
        </div>
        <div className="sv-modal__footer">
          <button
            className="sv-btn sv-btn--danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Yes, Delete All"}
          </button>
          <button className="sv-btn sv-btn--ghost" onClick={onClose} disabled={deleting}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const ServiceView = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<FlatCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  const [editTarget, setEditTarget] = useState<Service | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  const { toasts, addToast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [svcRes, catRes] = await Promise.all([
        api.get("/admin/services"),
        api.get("/admin/categories/flat"),
      ]);
      if (svcRes.data.status) setServices(svcRes.data.data);
      if (catRes.data.status) setCategories(catRes.data.data);
    } catch {
      addToast("error", "Failed to load services.");
    } finally {
      setLoading(false);
      setSelectedIds([]); // Clear selection on reload
    }
  }, [addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggle = async (service: Service) => {
    setTogglingId(service.id);
    try {
      const res = await api.patch(`/admin/services/${service.id}/toggle`);
      if (res.data.status) {
        addToast(
          "success",
          `Status → ${res.data.data.status === "active" ? "Active ✅" : "Inactive ⛔"}`
        );
        fetchData();
      } else {
        addToast("error", res.data.message || "Toggle failed.");
      }
    } catch {
      addToast("error", "Something went wrong.");
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = services.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                        (s.category?.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat ? s.category_id === Number(filterCat) : true;
    return matchSearch && matchCat;
  });

  const activeCount = services.filter((s) => s.status === "active").length;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filtered.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="sv">
      {/* Toast Stack */}
      <div className="sv-toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`sv-toast sv-toast--${t.type}`}>{t.message}</div>
        ))}
      </div>

      {/* Header */}
      <div className="sv-header">
        <div>
          <h1 className="sv-title">Services</h1>
          <p className="sv-subtitle">Manage your services — edit, toggle status, or delete.</p>
        </div>
        <a href="/dashboard/service/add" className="sv-btn sv-btn--primary">
          + Add Service
        </a>
      </div>

      {/* Stats */}
      <div className="sv-stats">
        <div className="sv-stat">
          <span className="sv-stat__value">{services.length}</span>
          <span className="sv-stat__label">Total</span>
        </div>
        <div className="sv-stat">
          <span className="sv-stat__value sv-stat__value--green">{activeCount}</span>
          <span className="sv-stat__label">Active</span>
        </div>
        <div className="sv-stat">
          <span className="sv-stat__value sv-stat__value--red">{services.length - activeCount}</span>
          <span className="sv-stat__label">Inactive</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="sv-search-wrap" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <input
          id="svc-search"
          type="text"
          className="sv-search"
          placeholder="Search by name or category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <select
          className="sv-search"
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          style={{ width: '220px' }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>

        {selectedIds.length > 0 && (
          <button 
            className="sv-btn sv-btn--danger"
            onClick={() => setShowBulkDelete(true)}
          >
            Bulk Delete ({selectedIds.length})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="sv-card">
        {loading ? (
          <div className="sv-loading">
            <div className="sv-spinner" />
            <span>Loading services…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="sv-empty">
            <p className="sv-empty__icon">🛠️</p>
            <p className="sv-empty__msg">
              {search ? "No services match your search." : "No services yet."}
            </p>
            {!search && (
              <a href="/dashboard/service/add" className="sv-btn sv-btn--primary">
                Add your first service
              </a>
            )}
          </div>
        ) : (
          <div className="sv-table-wrap">
            <table className="sv-table">
              <thead>
                <tr>
                  <th className="sv-th" style={{ width: '40px' }}>
                    <input 
                      type="checkbox" 
                      checked={filtered.length > 0 && selectedIds.length === filtered.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="sv-th">Name</th>
                  <th className="sv-th">Category</th>
                  <th className="sv-th">Description</th>
                  <th className="sv-th">Status</th>
                  <th className="sv-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((svc) => (
                  <tr key={svc.id} className="sv-row">
                    <td className="sv-td">
                      <input 
                        type="checkbox"
                        checked={selectedIds.includes(svc.id)}
                        onChange={() => handleSelectOne(svc.id)}
                      />
                    </td>
                    <td className="sv-td sv-td--name">
                      <span className="sv-name">{svc.name}</span>
                      <code className="sv-slug">{svc.slug}</code>
                    </td>
                    <td className="sv-td">
                      {svc.category ? (
                        <span className="sv-category-badge">{svc.category.name}</span>
                      ) : (
                        <span className="sv-none">—</span>
                      )}
                    </td>
                    <td className="sv-td sv-td--desc">
                      {svc.description ? (
                        <span className="sv-desc" title={svc.description}>
                          {svc.description.length > 60
                            ? svc.description.slice(0, 60) + "…"
                            : svc.description}
                        </span>
                      ) : (
                        <span className="sv-none">—</span>
                      )}
                    </td>
                    <td className="sv-td">
                      <button
                        id={`svc-toggle-${svc.id}`}
                        className={`sv-badge ${
                          svc.status === "active" ? "sv-badge--active" : "sv-badge--inactive"
                        } ${togglingId === svc.id ? "sv-badge--loading" : ""}`}
                        onClick={() => handleToggle(svc)}
                        disabled={togglingId === svc.id}
                        title="Click to toggle status"
                      >
                        {togglingId === svc.id
                          ? "…"
                          : svc.status === "active"
                          ? "Active"
                          : "Inactive"}
                      </button>
                    </td>
                    <td className="sv-td">
                      <div className="sv-actions">
                        <button
                          id={`svc-edit-${svc.id}`}
                          className="sv-action-btn sv-action-btn--edit"
                          onClick={() => setEditTarget(svc)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          id={`svc-delete-${svc.id}`}
                          className="sv-action-btn sv-action-btn--delete"
                          onClick={() => setDeleteTarget(svc)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editTarget && (
        <EditModal
          service={editTarget}
          categories={categories}
          onClose={() => setEditTarget(null)}
          onSaved={fetchData}
          addToast={addToast}
        />
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteModal
          service={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={fetchData}
          addToast={addToast}
        />
      )}

      {/* Bulk Delete Modal */}
      {showBulkDelete && (
        <BulkDeleteModal
          ids={selectedIds}
          onClose={() => setShowBulkDelete(false)}
          onDeleted={fetchData}
          addToast={addToast}
        />
      )}
    </div>
  );
};
