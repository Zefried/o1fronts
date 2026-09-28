import { useState, useEffect, useCallback } from "react";
import api from "../../../../api/axios";
import "./Styles/CategoryView.css";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Category {
  id: number;
  name: string;
  slug: string;
  status: "active" | "inactive";
  parent_id: number | null;
  all_children?: Category[];
}

interface FlatCategory {
  id: number;
  name: string;
  label: string;
  depth: number;
  status: string;
}

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

// ─── Toast Manager ────────────────────────────────────────────────────────────

let toastId = 0;

const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (type: Toast["type"], message: string) => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        3500
      );
    },
    []
  );

  return { toasts, addToast };
};

// ─── Edit Modal ───────────────────────────────────────────────────────────────

interface EditModalProps {
  category: Category;
  flatList: FlatCategory[];
  onClose: () => void;
  onSaved: () => void;
  addToast: (type: Toast["type"], msg: string) => void;
}

const EditModal = ({
  category,
  flatList,
  onClose,
  onSaved,
  addToast,
}: EditModalProps) => {
  const [name, setName] = useState(category.name);
  const [parentId, setParentId] = useState<string>(
    category.parent_id ? String(category.parent_id) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload: { name: string; parent_id?: number | null } = {
        name: name.trim(),
        parent_id: parentId ? Number(parentId) : null,
      };
      const res = await api.put(`/admin/categories/${category.id}`, payload);
      if (res.data.status) {
        addToast("success", "✅ Category updated successfully!");
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

  // Exclude self and own descendants from parent dropdown
  const eligible = flatList.filter((c) => c.id !== category.id);

  return (
    <div className="cv-modal-overlay" onClick={onClose}>
      <div className="cv-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cv-modal__header">
          <h2 className="cv-modal__title">Edit Category</h2>
          <button className="cv-modal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="cv-modal__body">
          <div className="cv-form__group">
            <label className="cv-form__label" htmlFor="edit-cat-name">
              Category Name <span className="cv-required">*</span>
            </label>
            <input
              id="edit-cat-name"
              type="text"
              className="cv-form__input"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="Category name"
            />
          </div>

          <div className="cv-form__group">
            <label className="cv-form__label" htmlFor="edit-cat-parent">
              Parent Category
            </label>
            <select
              id="edit-cat-parent"
              className="cv-form__select"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
            >
              <option value="">— None (root category)</option>
              {eligible.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="cv-form__error">{error}</p>}
        </div>

        <div className="cv-modal__footer">
          <button
            id={`edit-save-${category.id}`}
            className="cv-btn cv-btn--primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button className="cv-btn cv-btn--ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

interface DeleteModalProps {
  category: Category;
  onClose: () => void;
  onDeleted: () => void;
  addToast: (type: Toast["type"], msg: string) => void;
}

const DeleteModal = ({ category, onClose, onDeleted, addToast }: DeleteModalProps) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await api.delete(`/admin/categories/${category.id}`);
      if (res.data.status) {
        addToast("success", "🗑️ Category deleted successfully!");
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
    <div className="cv-modal-overlay" onClick={onClose}>
      <div className="cv-modal cv-modal--danger" onClick={(e) => e.stopPropagation()}>
        <div className="cv-modal__header">
          <h2 className="cv-modal__title">Delete Category</h2>
          <button className="cv-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="cv-modal__body">
          <div className="cv-delete-icon">🗑️</div>
          <p className="cv-delete-msg">
            Are you sure you want to delete{" "}
            <strong>"{category.name}"</strong>?
          </p>
          <p className="cv-delete-warn">
            ⚠️ All child categories will also be permanently deleted.
          </p>
        </div>
        <div className="cv-modal__footer">
          <button
            id={`delete-confirm-${category.id}`}
            className="cv-btn cv-btn--danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Yes, Delete"}
          </button>
          <button className="cv-btn cv-btn--ghost" onClick={onClose} disabled={deleting}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Category Row (recursive) ─────────────────────────────────────────────────

interface RowProps {
  category: Category;
  depth: number;
  togglingId: number | null;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
  onToggle: (c: Category) => void;
}

const CategoryRow = ({
  category,
  depth,
  togglingId,
  onEdit,
  onDelete,
  onToggle,
}: RowProps) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = category.all_children && category.all_children.length > 0;

  return (
    <>
      <tr className={`cv-row cv-row--depth-${Math.min(depth, 3)}`}>
        {/* Name cell */}
        <td className="cv-td cv-td--name">
          <div className="cv-name-cell" style={{ paddingLeft: depth * 24 }}>
            {hasChildren ? (
              <button
                className={`cv-expand-btn ${expanded ? "cv-expand-btn--open" : ""}`}
                onClick={() => setExpanded(!expanded)}
                aria-label={expanded ? "Collapse" : "Expand"}
              >
                ▶
              </button>
            ) : (
              <span className="cv-expand-placeholder" />
            )}
            <span className="cv-cat-name">{category.name}</span>
            {hasChildren && (
              <span className="cv-child-count">{category.all_children!.length}</span>
            )}
          </div>
        </td>

        {/* Slug */}
        <td className="cv-td cv-td--slug">
          <code className="cv-slug">{category.slug}</code>
        </td>

        {/* Status toggle */}
        <td className="cv-td cv-td--status">
          <button
            id={`toggle-${category.id}`}
            className={`cv-badge ${
              category.status === "active" ? "cv-badge--active" : "cv-badge--inactive"
            } ${togglingId === category.id ? "cv-badge--loading" : ""}`}
            onClick={() => onToggle(category)}
            disabled={togglingId === category.id}
            title="Click to toggle status"
          >
            {togglingId === category.id
              ? "…"
              : category.status === "active"
              ? "Active"
              : "Inactive"}
          </button>
        </td>

        {/* Actions */}
        <td className="cv-td cv-td--actions">
          <div className="cv-actions">
            <button
              id={`edit-btn-${category.id}`}
              className="cv-action-btn cv-action-btn--edit"
              onClick={() => onEdit(category)}
              title="Edit"
            >
              ✏️
            </button>
            <button
              id={`delete-btn-${category.id}`}
              className="cv-action-btn cv-action-btn--delete"
              onClick={() => onDelete(category)}
              title="Delete"
            >
              🗑️
            </button>
          </div>
        </td>
      </tr>

      {/* Recursive children */}
      {hasChildren &&
        expanded &&
        category.all_children!.map((child) => (
          <CategoryRow
            key={child.id}
            category={child}
            depth={depth + 1}
            togglingId={togglingId}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggle={onToggle}
          />
        ))}
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const CategoryView = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatList, setFlatList] = useState<FlatCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const { toasts, addToast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [treeRes, flatRes] = await Promise.all([
        api.get("/admin/categories"),
        api.get("/admin/categories/flat"),
      ]);
      if (treeRes.data.status) setCategories(treeRes.data.data);
      if (flatRes.data.status) setFlatList(flatRes.data.data);
    } catch {
      addToast("error", "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggle = async (category: Category) => {
    setTogglingId(category.id);
    try {
      const res = await api.patch(`/admin/categories/${category.id}/toggle`);
      if (res.data.status) {
        addToast(
          "success",
          `Status changed to ${res.data.data.status === "active" ? "Active ✅" : "Inactive ⛔"}`
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

  const totalCount = flatList.length;
  const activeCount = flatList.filter((c) => c.status === "active").length;

  return (
    <div className="cv">
      {/* Toast Stack */}
      <div className="cv-toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`cv-toast cv-toast--${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="cv-header">
        <div>
          <h1 className="cv-title">Categories</h1>
          <p className="cv-subtitle">Manage your category tree — edit, toggle status, or delete.</p>
        </div>
        <a href="/dashboard/category/add" className="cv-btn cv-btn--primary cv-add-btn">
          + Add Category
        </a>
      </div>

      {/* Stats */}
      <div className="cv-stats">
        <div className="cv-stat">
          <span className="cv-stat__value">{totalCount}</span>
          <span className="cv-stat__label">Total</span>
        </div>
        <div className="cv-stat">
          <span className="cv-stat__value cv-stat__value--green">{activeCount}</span>
          <span className="cv-stat__label">Active</span>
        </div>
        <div className="cv-stat">
          <span className="cv-stat__value cv-stat__value--red">{totalCount - activeCount}</span>
          <span className="cv-stat__label">Inactive</span>
        </div>
      </div>

      {/* Table */}
      <div className="cv-card">
        {loading ? (
          <div className="cv-loading">
            <div className="cv-spinner" />
            <span>Loading categories…</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="cv-empty">
            <p className="cv-empty__icon">📂</p>
            <p className="cv-empty__msg">No categories yet.</p>
            <a href="/dashboard/category/add" className="cv-btn cv-btn--primary">
              Add your first category
            </a>
          </div>
        ) : (
          <div className="cv-table-wrap">
            <table className="cv-table">
              <thead>
                <tr>
                  <th className="cv-th">Name</th>
                  <th className="cv-th">Slug</th>
                  <th className="cv-th">Status</th>
                  <th className="cv-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <CategoryRow
                    key={cat.id}
                    category={cat}
                    depth={0}
                    togglingId={togglingId}
                    onEdit={setEditTarget}
                    onDelete={setDeleteTarget}
                    onToggle={handleToggle}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editTarget && (
        <EditModal
          category={editTarget}
          flatList={flatList}
          onClose={() => setEditTarget(null)}
          onSaved={fetchData}
          addToast={addToast}
        />
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteModal
          category={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={fetchData}
          addToast={addToast}
        />
      )}
    </div>
  );
};
