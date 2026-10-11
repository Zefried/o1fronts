import { useState, useEffect, useCallback } from "react";
import api from "../../../../api/axios";
import "./Styles/AiContextView.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AttachmentItem {
  id: number;
  attachable_id: number;
  attachable_type: string;
  type: "pdf" | "youtube" | string;
  title: string | null;
  url: string;
  file_name: string | null;
  file_size: number | null;
  file_hash: string | null;
  metadata?: {
    video_id?: string;
    mime_type?: string;
  } | null;
  created_at?: string;
}

interface ImageItem {
  id: number;
  image_url: string;
  image_name: string;
  is_primary?: boolean;
}

interface AiContext {
  id: number;
  business_id: string;
  service_name: string;
  attribute_definition: string;
  context: string;
  prompt: string;
  images?: ImageItem[];
  attachments?: AttachmentItem[];
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const downloadFile = async (url: string, filename: string) => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, "_blank");
  }
};

const getYouTubeVideoId = (url: string): string | null => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
};

// ─── Viewers & Modals ─────────────────────────────────────────────────────────

const LightboxModal = ({
  url,
  name,
  onClose,
}: {
  url: string;
  name: string;
  onClose: () => void;
}) => (
  <div className="acv-lightbox-overlay" onClick={onClose}>
    <div className="acv-lightbox-content" onClick={(e) => e.stopPropagation()}>
      <button className="acv-lightbox-close" onClick={onClose}>✕</button>
      <img src={url} alt={name} className="acv-lightbox-img" />
      <div className="acv-lightbox-bar">
        <span>{name}</span>
        <button
          className="acv-btn acv-btn--primary"
          style={{ padding: "6px 14px", fontSize: "12px" }}
          onClick={() => downloadFile(url, name)}
        >
          ⬇️ Download
        </button>
      </div>
    </div>
  </div>
);

const PdfViewerModal = ({
  url,
  title,
  onClose,
}: {
  url: string;
  title: string;
  onClose: () => void;
}) => (
  <div className="acv-modal-overlay" onClick={onClose}>
    <div className="acv-pdf-viewer-modal" onClick={(e) => e.stopPropagation()}>
      <div className="acv-modal__header">
        <h2 className="acv-modal__title" style={{ fontSize: "15px" }}>📄 {title}</h2>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            className="acv-btn acv-btn--primary"
            style={{ padding: "6px 14px", fontSize: "12px" }}
            onClick={() => downloadFile(url, title)}
          >
            ⬇️ Download PDF
          </button>
          <button className="acv-modal__close" onClick={onClose}>✕</button>
        </div>
      </div>
      <iframe src={url} className="acv-pdf-iframe" title={title} />
    </div>
  </div>
);

const VideoPlayerModal = ({
  videoId,
  onClose,
}: {
  videoId: string;
  onClose: () => void;
}) => (
  <div className="acv-modal-overlay" onClick={onClose}>
    <div className="acv-player-modal" onClick={(e) => e.stopPropagation()}>
      <div style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between", background: "#111827", color: "#fff" }}>
        <span style={{ fontSize: "13px", fontWeight: "600" }}>▶ YouTube Video Player</span>
        <button
          style={{ background: "none", border: "none", color: "#fff", fontSize: "18px", cursor: "pointer" }}
          onClick={onClose}
        >
          ✕
        </button>
      </div>
      <div className="acv-player-aspect">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          className="acv-player-iframe"
          title="YouTube Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  </div>
);

// ─── Media Hub Modal ──────────────────────────────────────────────────────────

const MediaHubModal = ({
  record,
  initialTab,
  onClose,
  onRefresh,
  addToast,
  onViewImage,
  onViewPdf,
  onPlayVideo,
}: {
  record: AiContext;
  initialTab: "images" | "pdfs" | "youtube";
  onClose: () => void;
  onRefresh: () => void;
  addToast: (t: Toast["type"], m: string) => void;
  onViewImage: (url: string, name: string) => void;
  onViewPdf: (url: string, title: string) => void;
  onPlayVideo: (videoId: string) => void;
}) => {
  const [activeTab, setActiveTab] = useState<"images" | "pdfs" | "youtube">(initialTab);
  const [uploading, setUploading] = useState(false);
  const [editingYtId, setEditingYtId] = useState<number | null>(null);
  const [editYtTitle, setEditYtTitle] = useState("");
  const [editYtUrl, setEditYtUrl] = useState("");
  const [newYtUrl, setNewYtUrl] = useState("");
  const [newYtTitle, setNewYtTitle] = useState("");

  const images = record.images || [];
  const pdfs = (record.attachments || []).filter((a) => a.type === "pdf");
  const youtubes = (record.attachments || []).filter((a) => a.type === "youtube");

  // ── Image handlers ──
  const handleReplaceImage = async (imageId: number, file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post(`/admin/images/${imageId}/replace`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.status) {
        addToast("success", "✅ Image replaced successfully!");
        onRefresh();
      } else {
        addToast("error", res.data.message || "Failed to replace image.");
      }
    } catch (e: any) {
      addToast("error", e?.response?.data?.message || "Failed to replace image.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return;
    try {
      const res = await api.delete(`/admin/images/${imageId}`);
      if (res.data.status) {
        addToast("success", "Image deleted.");
        onRefresh();
      }
    } catch {
      addToast("error", "Failed to delete image.");
    }
  };

  const handleUploadMoreImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append(`images[${i}]`, files[i]);
      }
      const res = await api.post(`/admin/ai-contexts/${record.id}/images`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.status) {
        addToast("success", "✅ New images uploaded!");
        onRefresh();
      } else {
        addToast("error", res.data.message || "Failed to upload images.");
      }
    } catch (e: any) {
      addToast("error", e?.response?.data?.message || "Failed to upload images.");
    } finally {
      setUploading(false);
    }
  };

  // ── PDF handlers ──
  const handleReplacePdf = async (attachmentId: number, file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("document", file);
      const res = await api.post(`/admin/attachments/${attachmentId}/replace`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.status) {
        addToast("success", "✅ Document replaced successfully!");
        onRefresh();
      } else {
        addToast("error", res.data.message || "Failed to replace document.");
      }
    } catch (e: any) {
      addToast("error", e?.response?.data?.message || "Failed to replace document.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!window.confirm("Are you sure you want to delete this attachment?")) return;
    try {
      const res = await api.delete(`/admin/attachments/${attachmentId}`);
      if (res.data.status) {
        addToast("success", "Attachment deleted.");
        onRefresh();
      }
    } catch {
      addToast("error", "Failed to delete attachment.");
    }
  };

  const handleUploadMorePdfs = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append(`documents[${i}]`, files[i]);
      }
      const res = await api.post(`/admin/ai-contexts/${record.id}/attachments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.status) {
        addToast("success", "✅ Documents uploaded successfully!");
        onRefresh();
      } else {
        addToast("error", res.data.message || "Failed to upload documents.");
      }
    } catch (e: any) {
      addToast("error", e?.response?.data?.message || "Failed to upload documents.");
    } finally {
      setUploading(false);
    }
  };

  // ── YouTube handlers ──
  const handleAddYouTubeLink = async () => {
    if (!newYtUrl.trim()) {
      addToast("error", "YouTube URL is required.");
      return;
    }
    setUploading(true);
    try {
      const payload = {
        youtube_links: [{ url: newYtUrl.trim(), title: newYtTitle.trim() || undefined }],
      };
      const res = await api.post(`/admin/ai-contexts/${record.id}/attachments`, payload);
      if (res.data.status) {
        addToast("success", "✅ YouTube video added!");
        setNewYtUrl("");
        setNewYtTitle("");
        onRefresh();
      } else {
        addToast("error", res.data.message || "Failed to add video.");
      }
    } catch (e: any) {
      addToast("error", e?.response?.data?.message || "Failed to add video.");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveEditYt = async (attachmentId: number) => {
    if (!editYtUrl.trim()) return;
    try {
      const res = await api.put(`/admin/attachments/${attachmentId}`, {
        title: editYtTitle.trim(),
        url: editYtUrl.trim(),
      });
      if (res.data.status) {
        addToast("success", "✅ YouTube link updated!");
        setEditingYtId(null);
        onRefresh();
      } else {
        addToast("error", res.data.message || "Failed to update link.");
      }
    } catch {
      addToast("error", "Failed to update link.");
    }
  };

  return (
    <div className="acv-modal-overlay" onClick={onClose}>
      <div className="acv-modal acv-modal--hub" onClick={(e) => e.stopPropagation()}>
        <div className="acv-modal__header">
          <div>
            <h2 className="acv-modal__title">Media & Attachments</h2>
            <p className="acv-subtitle" style={{ margin: 0, fontSize: "12px" }}>
              {record.service_name} ➔ {record.attribute_definition} ({record.business_id})
            </p>
          </div>
          <button className="acv-modal__close" onClick={onClose}>✕</button>
        </div>

        {/* Tab switchers */}
        <div className="acv-hub-tabs">
          <button
            className={`acv-hub-tab-btn ${activeTab === "images" ? "acv-hub-tab-btn--active" : ""}`}
            onClick={() => setActiveTab("images")}
          >
            🖼️ Portfolio Images <span className="acv-hub-tab-count">{images.length}</span>
          </button>
          <button
            className={`acv-hub-tab-btn ${activeTab === "pdfs" ? "acv-hub-tab-btn--active" : ""}`}
            onClick={() => setActiveTab("pdfs")}
          >
            📄 PDF Documents <span className="acv-hub-tab-count">{pdfs.length}</span>
          </button>
          <button
            className={`acv-hub-tab-btn ${activeTab === "youtube" ? "acv-hub-tab-btn--active" : ""}`}
            onClick={() => setActiveTab("youtube")}
          >
            🎥 YouTube Videos <span className="acv-hub-tab-count">{youtubes.length}</span>
          </button>
        </div>

        <div className="acv-modal__body" style={{ minHeight: "320px" }}>
          {/* ════ TAB 1: IMAGES ════ */}
          {activeTab === "images" && (
            <div>
              <div className="acv-hub-toolbar">
                <span className="acv-hub-title">{images.length} Portfolio Images</span>
                <label className="acv-hub-upload-btn">
                  <span>+ Upload Images</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    style={{ display: "none" }}
                    disabled={uploading}
                    onChange={(e) => {
                      handleUploadMoreImages(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>

              {images.length === 0 ? (
                <div className="acv-empty" style={{ padding: "40px 0" }}>
                  <p className="acv-empty__icon">🖼️</p>
                  <p className="acv-empty__msg">No portfolio images uploaded for this context.</p>
                </div>
              ) : (
                <div className="acv-img-grid">
                  {images.map((img) => {
                    const imgUrl = `http://127.0.0.1:8000/storage/${img.image_url}`;
                    return (
                      <div key={img.id} className="acv-img-card">
                        <div
                          className="acv-img-thumb-wrap"
                          onClick={() => onViewImage(imgUrl, img.image_name)}
                          title="Click to zoom preview"
                        >
                          <img src={imgUrl} alt={img.image_name} className="acv-img-thumb" />
                        </div>
                        <div className="acv-img-card-info">
                          <span className="acv-img-card-name" title={img.image_name}>
                            {img.image_name}
                          </span>
                          <div className="acv-card-actions">
                            <button
                              className="acv-card-btn"
                              title="Zoom Preview"
                              onClick={() => onViewImage(imgUrl, img.image_name)}
                            >
                              👁️
                            </button>
                            <button
                              className="acv-card-btn"
                              title="Download Image"
                              onClick={() => downloadFile(imgUrl, img.image_name)}
                            >
                              ⬇️
                            </button>
                            <label className="acv-card-btn" title="Replace with new image">
                              <span>🔄</span>
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                disabled={uploading}
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    handleReplaceImage(img.id, e.target.files[0]);
                                  }
                                  e.target.value = "";
                                }}
                              />
                            </label>
                            <button
                              className="acv-card-btn acv-card-btn--danger"
                              title="Delete Image"
                              onClick={() => handleDeleteImage(img.id)}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════ TAB 2: PDF DOCUMENTS ════ */}
          {activeTab === "pdfs" && (
            <div>
              <div className="acv-hub-toolbar">
                <span className="acv-hub-title">{pdfs.length} PDF Documents</span>
                <label className="acv-hub-upload-btn">
                  <span>+ Upload PDF</span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,application/pdf"
                    style={{ display: "none" }}
                    disabled={uploading}
                    onChange={(e) => {
                      handleUploadMorePdfs(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>

              {pdfs.length === 0 ? (
                <div className="acv-empty" style={{ padding: "40px 0" }}>
                  <p className="acv-empty__icon">📄</p>
                  <p className="acv-empty__msg">No PDF documents attached.</p>
                </div>
              ) : (
                <div className="acv-doc-list">
                  {pdfs.map((doc) => {
                    const docUrl = `http://127.0.0.1:8000/storage/${doc.url}`;
                    const docName = doc.file_name || doc.title || "document.pdf";
                    return (
                      <div key={doc.id} className="acv-doc-item">
                        <div className="acv-doc-left">
                          <span className="acv-doc-icon">📄</span>
                          <div className="acv-doc-details">
                            <span className="acv-doc-title" title={docName}>
                              {docName}
                            </span>
                            <div className="acv-doc-meta">
                              {doc.file_size && <span>{formatFileSize(doc.file_size)}</span>}
                              <span>PDF Document</span>
                            </div>
                          </div>
                        </div>

                        <div className="acv-card-actions">
                          <button
                            className="acv-card-btn"
                            title="View PDF"
                            onClick={() => onViewPdf(docUrl, docName)}
                          >
                            👁️
                          </button>
                          <button
                            className="acv-card-btn"
                            title="Download PDF"
                            onClick={() => downloadFile(docUrl, docName)}
                          >
                            ⬇️
                          </button>
                          <label className="acv-card-btn" title="Replace PDF">
                            <span>🔄</span>
                            <input
                              type="file"
                              accept=".pdf,application/pdf"
                              style={{ display: "none" }}
                              disabled={uploading}
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleReplacePdf(doc.id, e.target.files[0]);
                                }
                                e.target.value = "";
                              }}
                            />
                          </label>
                          <button
                            className="acv-card-btn acv-card-btn--danger"
                            title="Delete PDF"
                            onClick={() => handleDeleteAttachment(doc.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════ TAB 3: YOUTUBE VIDEOS ════ */}
          {activeTab === "youtube" && (
            <div>
              <div className="acv-hub-toolbar">
                <span className="acv-hub-title">{youtubes.length} YouTube Videos</span>
              </div>

              {youtubes.length === 0 ? (
                <div className="acv-empty" style={{ padding: "20px 0" }}>
                  <p className="acv-empty__icon">🎥</p>
                  <p className="acv-empty__msg">No YouTube links added yet.</p>
                </div>
              ) : (
                <div className="acv-yt-grid">
                  {youtubes.map((yt) => {
                    const videoId = yt.metadata?.video_id || getYouTubeVideoId(yt.url);
                    const thumbUrl = videoId
                      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                      : "https://via.placeholder.com/320x180?text=YouTube+Video";

                    const isEditing = editingYtId === yt.id;

                    return (
                      <div key={yt.id} className="acv-yt-card">
                        <div
                          className="acv-yt-thumb-wrap"
                          onClick={() => {
                            if (videoId) onPlayVideo(videoId);
                            else window.open(yt.url, "_blank");
                          }}
                          title="Click to play video"
                        >
                          <img src={thumbUrl} alt={yt.title || "YouTube"} className="acv-yt-thumb" />
                          <div className="acv-yt-play-icon">▶</div>
                        </div>

                        <div className="acv-yt-info">
                          {isEditing ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              <input
                                type="text"
                                className="acv-form__input"
                                style={{ padding: "6px 10px", fontSize: "12px" }}
                                placeholder="Title"
                                value={editYtTitle}
                                onChange={(e) => setEditYtTitle(e.target.value)}
                              />
                              <input
                                type="url"
                                className="acv-form__input"
                                style={{ padding: "6px 10px", fontSize: "12px" }}
                                placeholder="YouTube URL"
                                value={editYtUrl}
                                onChange={(e) => setEditYtUrl(e.target.value)}
                              />
                              <div style={{ display: "flex", gap: "6px" }}>
                                <button
                                  className="acv-btn acv-btn--primary"
                                  style={{ padding: "4px 10px", fontSize: "11px" }}
                                  onClick={() => handleSaveEditYt(yt.id)}
                                >
                                  Save
                                </button>
                                <button
                                  className="acv-btn acv-btn--ghost"
                                  style={{ padding: "4px 10px", fontSize: "11px" }}
                                  onClick={() => setEditingYtId(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <span className="acv-yt-title" title={yt.title || "YouTube Video"}>
                                {yt.title || "YouTube Video"}
                              </span>
                              <span className="acv-yt-url" title={yt.url}>
                                {yt.url}
                              </span>
                              <div className="acv-card-actions">
                                {videoId && (
                                  <button
                                    className="acv-card-btn"
                                    title="Play Video"
                                    onClick={() => onPlayVideo(videoId)}
                                  >
                                    ▶️
                                  </button>
                                )}
                                <a
                                  href={yt.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="acv-card-btn"
                                  title="Open in YouTube"
                                  style={{ textDecoration: "none" }}
                                >
                                  ↗️
                                </a>
                                <button
                                  className="acv-card-btn"
                                  title="Edit Title & URL"
                                  onClick={() => {
                                    setEditingYtId(yt.id);
                                    setEditYtTitle(yt.title || "");
                                    setEditYtUrl(yt.url);
                                  }}
                                >
                                  ✏️
                                </button>
                                <button
                                  className="acv-card-btn acv-card-btn--danger"
                                  title="Delete Video"
                                  onClick={() => handleDeleteAttachment(yt.id)}
                                >
                                  🗑️
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add YouTube Form */}
              <div className="acv-yt-add-box">
                <span style={{ fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "8px" }}>
                  + Add New YouTube Video
                </span>
                <div className="acv-yt-add-row">
                  <input
                    type="url"
                    className="acv-form__input"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={newYtUrl}
                    onChange={(e) => setNewYtUrl(e.target.value)}
                  />
                  <input
                    type="text"
                    className="acv-form__input"
                    placeholder="Title (Optional)"
                    value={newYtTitle}
                    onChange={(e) => setNewYtTitle(e.target.value)}
                  />
                  <button
                    type="button"
                    className="acv-btn acv-btn--primary"
                    disabled={uploading || !newYtUrl.trim()}
                    onClick={handleAddYouTubeLink}
                  >
                    Add Video
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="acv-modal__footer">
          <button className="acv-btn acv-btn--ghost" onClick={onClose}>
            Close
          </button>
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
  const [mediaTarget, setMediaTarget] = useState<{ record: AiContext; tab: "images" | "pdfs" | "youtube" } | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);
  const [pdfViewerDoc, setPdfViewerDoc] = useState<{ url: string; title: string } | null>(null);
  const [videoPlayerId, setVideoPlayerId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

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

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filtered.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} contexts?`)) return;
    setBulkDeleting(true);
    try {
      const res = await api.post("/admin/ai-contexts/bulk-delete", { ids: selectedIds });
      if (res.data.status) {
        addToast("success", res.data.message);
        setSelectedIds([]);
        fetchData();
      } else {
        addToast("error", res.data.message);
      }
    } catch {
      addToast("error", "Failed to perform bulk delete.");
    } finally {
      setBulkDeleting(false);
    }
  };

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
        <div style={{ display: "flex", gap: "10px" }}>
          {selectedIds.length > 0 && (
            <button className="acv-btn acv-btn--danger" onClick={handleBulkDelete} disabled={bulkDeleting}>
              {bulkDeleting ? "Deleting..." : `Delete Selected (${selectedIds.length})`}
            </button>
          )}
          <button id="ctx-add-btn" className="acv-btn acv-btn--primary" onClick={() => setShowAdd(true)}>
            + Add Context
          </button>
        </div>
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
                  <th className="acv-th" style={{ width: '40px', textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      className="acv-checkbox"
                      checked={filtered.length > 0 && selectedIds.length === filtered.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="acv-th">#</th>
                  <th className="acv-th">Business ID</th>
                  <th className="acv-th">Service</th>
                  <th className="acv-th">Attribute</th>
                  <th className="acv-th">Context</th>
                  <th className="acv-th">Prompt</th>
                  <th className="acv-th">Media</th>
                  <th className="acv-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const imgCount = r.images?.length ?? 0;
                  const pdfCount = (r.attachments?.filter((a) => a.type === "pdf").length) ?? 0;
                  const ytCount = (r.attachments?.filter((a) => a.type === "youtube").length) ?? 0;

                  return (
                    <tr key={r.id} className="acv-row">
                      <td className="acv-td" style={{ textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          className="acv-checkbox"
                          checked={selectedIds.includes(r.id)}
                          onChange={() => handleSelectOne(r.id)}
                        />
                      </td>
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
                        <div className="acv-media-badges">
                          {imgCount > 0 && (
                            <button
                              className="acv-badge-btn acv-badge-btn--img"
                              title="View & Manage Images"
                              onClick={() => setMediaTarget({ record: r, tab: "images" })}
                            >
                              🖼️ {imgCount}
                            </button>
                          )}
                          {pdfCount > 0 && (
                            <button
                              className="acv-badge-btn acv-badge-btn--pdf"
                              title="View & Manage PDFs"
                              onClick={() => setMediaTarget({ record: r, tab: "pdfs" })}
                            >
                              📄 {pdfCount}
                            </button>
                          )}
                          {ytCount > 0 && (
                            <button
                              className="acv-badge-btn acv-badge-btn--yt"
                              title="View & Manage YouTube Videos"
                              onClick={() => setMediaTarget({ record: r, tab: "youtube" })}
                            >
                              🎥 {ytCount}
                            </button>
                          )}
                          {imgCount === 0 && pdfCount === 0 && ytCount === 0 && (
                            <button
                              className="acv-badge-btn acv-badge-btn--empty"
                              title="Attach Media (Images, PDFs, YouTube)"
                              onClick={() => setMediaTarget({ record: r, tab: "images" })}
                            >
                              + Attach
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="acv-td">
                        <div className="acv-actions">
                          <button
                            className="acv-action-btn"
                            onClick={() => setMediaTarget({ record: r, tab: "images" })}
                            title="Manage Media & Attachments"
                          >
                            📎
                          </button>
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
                  );
                })}
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

      {/* Media Hub Modal */}
      {mediaTarget && (
        <MediaHubModal
          record={mediaTarget.record}
          initialTab={mediaTarget.tab}
          onClose={() => setMediaTarget(null)}
          onRefresh={async () => {
            const ctxRes = await api.get("/admin/ai-contexts");
            if (ctxRes.data.status) {
              setRecords(ctxRes.data.data);
              const found = ctxRes.data.data.find((c: AiContext) => c.id === mediaTarget.record.id);
              if (found) {
                setMediaTarget((prev) => prev ? { ...prev, record: found } : null);
              }
            }
          }}
          addToast={addToast}
          onViewImage={(url, name) => setLightboxImage({ url, name })}
          onViewPdf={(url, title) => setPdfViewerDoc({ url, title })}
          onPlayVideo={(videoId) => setVideoPlayerId(videoId)}
        />
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <LightboxModal
          url={lightboxImage.url}
          name={lightboxImage.name}
          onClose={() => setLightboxImage(null)}
        />
      )}

      {/* PDF Viewer Modal */}
      {pdfViewerDoc && (
        <PdfViewerModal
          url={pdfViewerDoc.url}
          title={pdfViewerDoc.title}
          onClose={() => setPdfViewerDoc(null)}
        />
      )}

      {/* Video Player Modal */}
      {videoPlayerId && (
        <VideoPlayerModal
          videoId={videoPlayerId}
          onClose={() => setVideoPlayerId(null)}
        />
      )}
    </div>
  );
};
