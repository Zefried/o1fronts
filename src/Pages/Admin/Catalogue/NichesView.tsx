import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, CheckCircle, XCircle, Edit, Trash2, Layers } from "lucide-react";
import { catalogueApi, type Niche } from "../../../api/catalogueService";
import "./Styles/Catalogue.css";

export const NichesView: React.FC = () => {
  const [niches, setNiches] = useState<Niche[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingNiche, setEditingNiche] = useState<Niche | null>(null);
  const [nicheName, setNicheName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const loadNiches = useCallback(async () => {
    try {
      setLoading(true);
      const res = await catalogueApi.getNiches({ search });
      if (res.status) {
        setNiches(res.data);
      }
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Failed to load niches.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadNiches();
  }, [loadNiches]);

  const handleOpenCreate = () => {
    setEditingNiche(null);
    setNicheName("");
    setIsActive(true);
    setModalError("");
    setShowModal(true);
  };

  const handleOpenEdit = (niche: Niche) => {
    setEditingNiche(niche);
    setNicheName(niche.niche_name);
    setIsActive(niche.is_active);
    setModalError("");
    setShowModal(true);
  };

  const handleToggleStatus = async (niche: Niche) => {
    try {
      const res = await catalogueApi.toggleNiche(niche.id);
      if (res.status) {
        showToast("success", `Niche marked as ${res.data.is_active ? "active" : "inactive"}.`);
        loadNiches();
      }
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Failed to update status.");
    }
  };

  const handleDelete = async (niche: Niche) => {
    if (!window.confirm(`Are you sure you want to delete niche "${niche.niche_name}"?`)) {
      return;
    }
    try {
      const res = await catalogueApi.deleteNiche(niche.id);
      if (res.status) {
        showToast("success", "Niche deleted successfully.");
        loadNiches();
      }
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Failed to delete niche.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nicheName.trim()) {
      setModalError("Niche name is required.");
      return;
    }

    setModalLoading(true);
    setModalError("");

    try {
      if (editingNiche) {
        const res = await catalogueApi.updateNiche(editingNiche.id, {
          niche_name: nicheName.trim(),
          is_active: isActive,
        });
        if (res.status) {
          showToast("success", "Niche updated successfully!");
          setShowModal(false);
          loadNiches();
        }
      } else {
        const res = await catalogueApi.createNiche({
          niche_name: nicheName.trim(),
          is_active: isActive,
        });
        if (res.status) {
          showToast("success", "Niche created successfully!");
          setShowModal(false);
          loadNiches();
        }
      }
    } catch (err: any) {
      setModalError(err?.response?.data?.message || "Failed to save niche.");
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="cat-container">
      {/* Toast */}
      {toast && (
        <div className="cat-toast-container">
          <div className={`cat-toast cat-toast--${toast.type}`}>
            {toast.type === "success" ? "✅" : "⚠️"} {toast.message}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="cat-header">
        <div className="cat-title-wrap">
          <h1 className="cat-title">
            <Layers size={22} color="#2563eb" />
            Niches Management
            <span className="cat-badge">Catalogue Module</span>
          </h1>
          <p className="cat-subtitle">
            Create and organize industry niches to categorize businesses and catalogues.
          </p>
        </div>

        <div className="cat-actions">
          <button className="cat-btn cat-btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Add New Niche
          </button>
        </div>
      </header>

      {/* Main Card */}
      <div className="cat-card">
        <div className="cat-card-header">
          <h2 className="cat-card-title">
            All Niches ({niches.length})
          </h2>

          <div className="cat-search-bar">
            <Search size={15} color="#94a3b8" />
            <input
              type="text"
              className="cat-search-input"
              placeholder="Search niches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="cat-table-wrap">
          <table className="cat-table">
            <thead>
              <tr>
                <th className="cat-th">ID</th>
                <th className="cat-th">Niche Name</th>
                <th className="cat-th">Status</th>
                <th className="cat-th">Businesses</th>
                <th className="cat-th">Created Date</th>
                <th className="cat-th" style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="cat-loading">
                    Loading niches...
                  </td>
                </tr>
              ) : niches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="cat-empty">
                    <span className="cat-empty-icon">📂</span>
                    No niches found. Click "Add New Niche" to create one.
                  </td>
                </tr>
              ) : (
                niches.map((niche) => (
                  <tr key={niche.id} className="cat-tr">
                    <td className="cat-td" style={{ color: "#94a3b8", width: "60px" }}>
                      #{niche.id}
                    </td>
                    <td className="cat-td cat-td-bold">
                      {niche.niche_name}
                    </td>
                    <td className="cat-td">
                      <button
                        type="button"
                        className={`cat-status-badge ${
                          niche.is_active ? "cat-status-badge--active" : "cat-status-badge--inactive"
                        }`}
                        onClick={() => handleToggleStatus(niche)}
                        title="Click to toggle status"
                      >
                        {niche.is_active ? (
                          <>
                            <CheckCircle size={12} /> Active
                          </>
                        ) : (
                          <>
                            <XCircle size={12} /> Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="cat-td">
                      <span className="cat-chip">
                        🏢 {niche.businesses_count ?? 0} businesses
                      </span>
                    </td>
                    <td className="cat-td" style={{ color: "#64748b", fontSize: "12px" }}>
                      {niche.created_at ? new Date(niche.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="cat-td" style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          type="button"
                          className="cat-btn cat-btn-secondary cat-btn-sm"
                          onClick={() => handleOpenEdit(niche)}
                          title="Edit niche"
                        >
                          <Edit size={13} /> Edit
                        </button>
                        <button
                          type="button"
                          className="cat-btn cat-btn-danger cat-btn-sm"
                          onClick={() => handleDelete(niche)}
                          title="Delete niche"
                        >
                          <Trash2 size={13} /> Delete
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

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="cat-modal-backdrop" onClick={() => !modalLoading && setShowModal(false)}>
          <div className="cat-modal" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSave}>
              <div className="cat-modal-header">
                <h3 className="cat-modal-title">
                  {editingNiche ? "Edit Niche" : "Create New Niche"}
                </h3>
                <button
                  type="button"
                  className="cat-modal-close"
                  onClick={() => setShowModal(false)}
                  disabled={modalLoading}
                >
                  ✕
                </button>
              </div>

              <div className="cat-modal-body">
                {modalError && <div className="cat-error-box">{modalError}</div>}

                <div className="cat-form-group">
                  <label className="cat-label">Niche Name *</label>
                  <input
                    type="text"
                    className="cat-input"
                    placeholder="e.g. Interior Design, Event Planning, Real Estate"
                    value={nicheName}
                    onChange={(e) => setNicheName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="cat-form-group" style={{ flexDirection: "row", alignItems: "center", gap: "10px" }}>
                  <input
                    type="checkbox"
                    id="niche-active-toggle"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                  <label htmlFor="niche-active-toggle" className="cat-label" style={{ cursor: "pointer", margin: 0 }}>
                    Active (businesses and services visible in catalogue)
                  </label>
                </div>
              </div>

              <div className="cat-modal-footer">
                <button
                  type="button"
                  className="cat-btn cat-btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={modalLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cat-btn cat-btn-primary"
                  disabled={modalLoading}
                >
                  {modalLoading ? "Saving..." : editingNiche ? "Save Changes" : "Create Niche"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
