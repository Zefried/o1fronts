import { useState, useEffect } from "react";

import "./Styles/AttributeFieldAdd.css";
import api from "../../../../../api/axios";

interface AttributeDefinition {
  id: number;
  name: string;
  category?: { name: string };
}

interface ApiError {
  response?: { data?: { message?: string } };
  message?: string;
}

const DATA_TYPES = [
  { value: "string", label: "String", hint: "Text value — e.g. \"USD\", \"Months\"" },
  { value: "number", label: "Number", hint: "Numeric value — e.g. 12, 1200" },
  { value: "boolean", label: "Boolean", hint: "True / False — e.g. available yes/no" },
];

export const AttributeFieldAdd = () => {
  const [attributeId, setAttributeId] = useState<string>("");
  const [name, setName] = useState("");
  const [dataType, setDataType] = useState<string>("string");
  const [sortOrder, setSortOrder] = useState<string>("0");

  const [attributes, setAttributes] = useState<AttributeDefinition[]>([]);
  const [loadingAttrs, setLoadingAttrs] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api.get("/admin/attributes")
      .then((res) => { if (res.data.status) setAttributes(res.data.data); })
      .catch(() => { })
      .finally(() => setLoadingAttrs(false));
  }, []);

  const handleReset = () => {
    setAttributeId(""); setName(""); setDataType("string");
    setSortOrder("0"); setError(""); setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!attributeId) { setError("Please select an attribute."); return; }
    if (!name.trim()) { setError("Field name is required."); return; }

    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await api.post("/admin/attribute-fields", {
        attribute_definition_id: Number(attributeId),
        name: name.trim(),
        data_type: dataType,
        sort_order: Number(sortOrder) || 0,
      });

      if (res.data.status) {
        setName(""); setDataType("string"); setSortOrder("0"); setError("");
        setSuccess("✅ Field added successfully!");
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(res.data.message || "Failed to add field.");
      }
    } catch (err: unknown) {
      const e = err as ApiError;
      setError(e?.response?.data?.message || e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const selectedAttr = attributes.find((a) => a.id === Number(attributeId));

  return (
    <div className="afa">
      <div className="afa__header">
        <h1 className="afa__title">Add Attribute Field</h1>
        <p className="afa__subtitle">
          Add a field to an existing attribute definition (e.g. Min Price → Price).
        </p>
      </div>

      <div className="afa__card">
        <form onSubmit={handleSubmit} noValidate>

          {/* Step 1 — Pick attribute */}
          <div className="afa__step-label">Step 1 — Select Attribute</div>
          <div className="afa__group">
            <label className="afa__label" htmlFor="aff-attribute">
              Attribute <span className="afa__required">*</span>
            </label>
            <select
              id="aff-attribute"
              className="afa__select"
              value={attributeId}
              onChange={(e) => { setAttributeId(e.target.value); setError(""); }}
              disabled={loadingAttrs}
            >
              <option value="">— Select an attribute</option>
              {attributes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}{a.category ? ` (${a.category.name})` : " (Global)"}
                </option>
              ))}
            </select>
            {selectedAttr && (
              <span className="afa__selected-badge">
                Adding field to: <strong>{selectedAttr.name}</strong>
              </span>
            )}
          </div>

          {/* Step 2 — Field details */}
          <div className="afa__step-label">Step 2 — Field Details</div>

          <div className="afa__group">
            <label className="afa__label" htmlFor="aff-name">
              Field Name <span className="afa__required">*</span>
            </label>
            <input
              id="aff-name"
              type="text"
              className="afa__input"
              placeholder="e.g. Min Price, Duration, Currency"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
            />
            {name.trim() && (
              <span className="afa__hint">
                Slug: <code>{name.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")}</code>
              </span>
            )}
          </div>

          <div className="afa__group">
            <label className="afa__label">Data Type <span className="afa__required">*</span></label>
            <div className="afa__type-grid">
              {DATA_TYPES.map((dt) => (
                <label
                  key={dt.value}
                  className={`afa__type-card ${dataType === dt.value ? "afa__type-card--selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="data_type"
                    value={dt.value}
                    checked={dataType === dt.value}
                    onChange={() => setDataType(dt.value)}
                    className="afa__type-radio"
                  />
                  <span className="afa__type-label">{dt.label}</span>
                  <span className="afa__type-hint">{dt.hint}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="afa__group">
            <label className="afa__label" htmlFor="aff-sort">Sort Order</label>
            <input
              id="aff-sort"
              type="number"
              className="afa__input afa__input--sm"
              min={0}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
            <span className="afa__hint">Lower number = displayed first.</span>
          </div>

          {error && <p className="afa__error">{error}</p>}
          {success && <p className="afa__success afa__success--anim">{success}</p>}

          <div className="afa__actions">
            <button id="aff-submit" type="submit" className="afa__btn afa__btn--primary" disabled={loading}>
              {loading ? "Saving..." : "Add Field"}
            </button>
            <button type="button" className="afa__btn afa__btn--reset" onClick={handleReset} disabled={loading}>
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
