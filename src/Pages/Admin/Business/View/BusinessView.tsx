import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Search,
  Plus,
  Mail,
  Phone,
  CalendarDays,
  Edit2,
  X,
  FileText,
  Trash2
} from "lucide-react";
import api from "../../../../api/axios";
import "./BusinessView.css";

interface Business {
  id: number;
  business_id: string;
  name: string;
  email: string;
  phone: string;
  bio: string;
  category_id?: number | null;
  category?: {
    id: number;
    name: string;
  };
  created_at: string;
}

interface FlatCategory {
  id: number;
  label: string;
  status: string;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

interface EditModalProps {
  business: Business;
  onClose: () => void;
  onSaved: () => void;
}

const EditModal = ({ business, onClose, onSaved }: EditModalProps) => {
  const [formData, setFormData] = useState({
    name: business.name,
    email: business.email,
    phone: business.phone,
    bio: business.bio || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setError("Name, email, and phone are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await api.put(`/admin/businesses/${business.id}`, formData);
      if (res.data.status) {
        onSaved();
        onClose();
      } else {
        setError(res.data.message || "Update failed.");
      }
    } catch (err: unknown) {
      const e = err as ApiError;
      setError(e?.response?.data?.message || e?.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="biz-view__modal-overlay" onClick={onClose}>
      <div className="biz-view__modal" onClick={(e) => e.stopPropagation()}>
        <div className="biz-view__modal-header">
          <h2 className="biz-view__modal-title">Edit Business</h2>
          <button className="biz-view__modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="biz-view__modal-body">
          <div className="biz-view__form-group">
            <label className="biz-view__label">Business Name</label>
            <input
              type="text"
              name="name"
              className="biz-view__input"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="biz-view__form-row">
            <div className="biz-view__form-group">
              <label className="biz-view__label">Email</label>
              <input
                type="email"
                name="email"
                className="biz-view__input"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="biz-view__form-group">
              <label className="biz-view__label">Phone</label>
              <input
                type="text"
                name="phone"
                className="biz-view__input"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="biz-view__form-group">
            <label className="biz-view__label">Bio</label>
            <textarea
              name="bio"
              className="biz-view__input biz-view__textarea"
              value={formData.bio}
              onChange={handleChange}
              rows={3}
            />
          </div>

          {error && <p className="biz-view__modal-error">{error}</p>}
        </div>

        <div className="biz-view__modal-footer">
          <button
            className="biz-view__btn biz-view__btn--primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button className="biz-view__btn biz-view__btn--reset" onClick={onClose} disabled={saving}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Delete Modal ─────────────────────────────────────────────────────────────

interface DeleteModalProps {
  business: Business;
  onClose: () => void;
  onDeleted: () => void;
}

const DeleteModal = ({ business, onClose, onDeleted }: DeleteModalProps) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setDeleting(true);
    setError("");
    try {
      const res = await api.delete(`/admin/businesses/${business.id}`);
      if (res.data.status) {
        onDeleted();
        onClose();
      } else {
        setError(res.data.message || "Delete failed.");
      }
    } catch (err: unknown) {
      const e = err as ApiError;
      setError(e?.response?.data?.message || e?.message || "Something went wrong.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="biz-view__modal-overlay" onClick={onClose}>
      <div className="biz-view__modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="biz-view__modal-header">
          <h2 className="biz-view__modal-title" style={{ color: '#dc2626' }}>Delete Business</h2>
          <button className="biz-view__modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="biz-view__modal-body" style={{ textAlign: 'center', padding: '30px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗑️</div>
          <p style={{ margin: '0 0 10px', fontSize: '15px', color: '#374151' }}>
            Are you sure you want to delete <strong>{business.name}</strong>?
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
            This action cannot be undone and will remove all associated data.
          </p>
          {error && <p className="biz-view__modal-error">{error}</p>}
        </div>
        <div className="biz-view__modal-footer" style={{ justifyContent: 'center' }}>
          <button
            className="biz-view__btn"
            style={{ background: '#dc2626', color: '#fff' }}
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Yes, Delete"}
          </button>
          <button className="biz-view__btn biz-view__btn--reset" onClick={onClose} disabled={deleting}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};


export const BusinessView = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editTarget, setEditTarget] = useState<Business | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Business | null>(null);
  const [categories, setCategories] = useState<FlatCategory[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/admin/categories/flat");
        if (res.data.status) {
          setCategories(res.data.data.filter((c: FlatCategory) => c.status === "active"));
        }
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    fetchCategories();
  }, []);

  const fetchBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const url = filterCategory 
        ? `/admin/businesses?category_id=${filterCategory}`
        : "/admin/businesses";

      const response = await api.get(url);

      if (response.data.status) {
        setBusinesses(response.data.data);
      } else {
        setError(
          response.data.message || "Failed to fetch businesses"
        );
      }
    } catch (err: unknown) {
      const e = err as ApiError;

      setError(
        e?.response?.data?.message ||
        e?.message ||
        "Failed to fetch businesses"
      );
    } finally {
      setLoading(false);
    }
  }, [filterCategory]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const filteredBusinesses = businesses.filter((business) => {
    const search = searchTerm.toLowerCase();

    return (
      business?.name?.toLowerCase().includes(search) ||
      business?.email?.toLowerCase().includes(search) ||
      business?.business_id?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="biz-view">
      <div className="biz-view__container">

        {/* Header */}
        <div className="biz-view__header">
          <div className="biz-view__heading">
            <div className="biz-view__title-wrap">
              <Building2 className="biz-view__title-icon" />

              <h1 className="biz-view__title">
                Businesses
              </h1>
            </div>

            <p className="biz-view__subtitle">
              Manage and view all registered business accounts.
            </p>
          </div>

          <div className="biz-view__header-actions">

            {/* Category Filter */}
            <div className="biz-view__search">
              <select
                className="biz-view__search-input"
                style={{ paddingLeft: '14px', cursor: 'pointer' }}
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">All Niches</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="biz-view__search">
              <Search className="biz-view__search-icon" />

              <input
                type="text"
                placeholder="Search businesses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="biz-view__search-input"
              />
            </div>

            {/* Add Business */}
            <Link
              to="/dashboard/businesses/add"
              className="biz-view__add-btn"
            >
              <Plus size={18} />
              <span>Add Business</span>
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="biz-view__error">
            {error}
          </div>
        )}

        {/* Business Table */}
        <div className="biz-view__card">
          <div className="biz-view__table-wrapper">
            <table className="biz-view__table">
              <thead>
                <tr>
                  <th>Business Info</th>
                  <th>Contact</th>
                  <th>Bio</th>
                  <th>Niche</th>
                  <th className="biz-view__action-header">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="biz-view__state">
                        <div className="biz-view__loader" />
                        <span>Loading businesses...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredBusinesses.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="biz-view__state biz-view__state--empty">
                        <div className="biz-view__empty-icon">
                          <Building2 size={28} />
                        </div>

                        <h3>No businesses found</h3>

                        <p>
                          We couldn't find anything matching your search.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBusinesses.map((business) => (
                    <tr
                      key={business.id}
                      className="biz-view__row"
                    >

                      {/* Business Info */}
                      <td>
                        <div className="biz-view__business">
                          <div className="biz-view__avatar">
                            {business.name
                              ?.charAt(0)
                              ?.toUpperCase()}
                          </div>

                          <div className="biz-view__business-info">
                            <h4>{business.name}</h4>

                            <span className="biz-view__business-id">
                              {business.business_id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td>
                        <div className="biz-view__contact">
                          <div>
                            <Mail size={15} />
                            <span>{business.email}</span>
                          </div>

                          <div>
                            <Phone size={15} />
                            <span>{business.phone}</span>
                          </div>
                        </div>
                      </td>
                      
                      {/* Bio */}
                      <td>
                        <div className="biz-view__contact">
                          <div>
                            <FileText size={15} />
                            <span className="truncate max-w-[150px] inline-block" title={business.bio || "No bio"}>
                              {business.bio ? business.bio.length > 30 ? business.bio.substring(0, 30) + "..." : business.bio : <em style={{color: '#9ca3af'}}>No bio</em>}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Niche */}
                      <td>
                        <div className="biz-view__contact">
                          <span className="biz-view__business-id" style={{
                            background: '#eef2ff', 
                            color: '#4f46e5', 
                            borderColor: '#e0e7ff',
                            fontSize: '12px'
                          }}>
                            {business.category?.name || "Uncategorized"}
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="biz-view__action">
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="biz-view__action-btn"
                            title="Edit Business"
                            onClick={() => setEditTarget(business)}
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            type="button"
                            className="biz-view__action-btn"
                            title="Delete Business"
                            style={{ color: '#ef4444' }}
                            onClick={() => setDeleteTarget(business)}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
      
      {/* Edit Modal */}
      {editTarget && (
        <EditModal
          business={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => fetchBusinesses()}
        />
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteModal
          business={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => fetchBusinesses()}
        />
      )}
    </div>
  );
};