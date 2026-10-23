import React, { useState, useEffect } from "react";
import { Search, Filter, Sliders, Building, Briefcase, RotateCcw } from "lucide-react";
import { catalogueApi, type DesignItem, type BusinessItem, type CatalogueServiceItem } from "../../../api/catalogueService";
import "./Styles/Catalogue.css";

export const DesignSearch: React.FC = () => {
  const [businesses, setBusinesses] = useState<BusinessItem[]>([]);
  const [services, setServices] = useState<CatalogueServiceItem[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Key-value specifications filters (e.g. Shape=L, Finish=Matte)
  const [specFilters, setSpecFilters] = useState<{ key: string; value: string }[]>([
    { key: "Shape", value: "" },
    { key: "Finish", value: "" },
  ]);

  const [results, setResults] = useState<DesignItem[]>([]);
  const [totalMatches, setTotalMatches] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searched, setSearched] = useState<boolean>(false);

  // Load businesses on mount
  useEffect(() => {
    catalogueApi.getAllBusinesses().then((res) => {
      if (res.status) setBusinesses(res.data);
    });
  }, []);

  // When business changes, load its services
  useEffect(() => {
    if (selectedBusinessId) {
      catalogueApi.getServicesByBusiness(Number(selectedBusinessId)).then((res) => {
        if (res.status) setServices(res.data);
      });
    } else {
      setServices([]);
    }
    setSelectedServiceId("");
  }, [selectedBusinessId]);

  const handleAddSpecFilter = () => {
    setSpecFilters((prev) => [...prev, { key: "", value: "" }]);
  };

  const handleUpdateSpecFilter = (index: number, field: "key" | "value", val: string) => {
    setSpecFilters((prev) => {
      const updated = [...prev];
      updated[index][field] = val;
      return updated;
    });
  };

  const handleRemoveSpecFilter = (index: number) => {
    setSpecFilters((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setSearched(true);

    try {
      const specPayload: Record<string, string> = {};
      specFilters.forEach((f) => {
        if (f.key.trim() && f.value.trim()) {
          specPayload[f.key.trim()] = f.value.trim();
        }
      });

      const res = await catalogueApi.searchDesigns({
        business_id: selectedBusinessId ? Number(selectedBusinessId) : undefined,
        service_id: selectedServiceId ? Number(selectedServiceId) : undefined,
        q: searchTerm.trim() || undefined,
        specifications: specPayload,
      });

      if (res.status) {
        setResults(res.data);
        setTotalMatches(res.count ?? res.data.length);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedBusinessId("");
    setSelectedServiceId("");
    setSearchTerm("");
    setSpecFilters([
      { key: "Shape", value: "" },
      { key: "Finish", value: "" },
    ]);
    setResults([]);
    setTotalMatches(null);
    setSearched(false);
  };

  return (
    <div className="cat-container">
      {/* Header */}
      <header className="cat-header">
        <div className="cat-title-wrap">
          <h1 className="cat-title">
            <Filter size={22} color="#2563eb" />
            Catalogue Specification Search
            <span className="cat-badge">Database Filtering</span>
          </h1>
          <p className="cat-subtitle">
            Execute multi-attribute queries against the catalogue database scoped strictly by business and specifications.
          </p>
        </div>
      </header>

      {/* Query Filters Card */}
      <div className="cat-card">
        <div className="cat-card-header">
          <h2 className="cat-card-title">
            <Sliders size={18} color="#2563eb" /> Structured Query Builder
          </h2>

          <button type="button" className="cat-btn cat-btn-secondary cat-btn-sm" onClick={handleReset}>
            <RotateCcw size={13} /> Reset Filters
          </button>
        </div>

        <form onSubmit={handleSearch} style={{ padding: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "20px" }}>
            {/* Business Scope */}
            <div className="cat-form-group">
              <label className="cat-label">
                <Building size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                Filter by Business
              </label>
              <select
                className="cat-select"
                value={selectedBusinessId}
                onChange={(e) => setSelectedBusinessId(e.target.value)}
              >
                <option value="">-- All Businesses --</option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.business_id || `User #${b.id}`})
                  </option>
                ))}
              </select>
            </div>

            {/* Service Scope */}
            <div className="cat-form-group">
              <label className="cat-label">
                <Briefcase size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                Filter by Service
              </label>
              <select
                className="cat-select"
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                disabled={!selectedBusinessId}
              >
                <option value="">-- All Services --</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.service_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Design Keyword */}
            <div className="cat-form-group">
              <label className="cat-label">
                <Search size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                Design Name Keyword
              </label>
              <input
                type="text"
                className="cat-input"
                placeholder="e.g. Modern L-Kitchen, Acrylic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Dynamic Specifications Key-Value Filters */}
          <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div>
                <strong style={{ fontSize: "13px", color: "#1e293b" }}>Specification Attributes (Database AND Filter)</strong>
                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                  Matches designs having ALL specified attribute values (e.g. Shape = L AND Finish = Matte).
                </p>
              </div>

              <button type="button" className="cat-btn cat-btn-secondary cat-btn-sm" onClick={handleAddSpecFilter}>
                + Add Filter Attribute
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {specFilters.map((sf, idx) => (
                <div key={idx} className="cat-spec-row">
                  <input
                    type="text"
                    className="cat-input"
                    placeholder="Attribute (e.g. Shape, Finish, Material)"
                    value={sf.key}
                    onChange={(e) => handleUpdateSpecFilter(idx, "key", e.target.value)}
                  />
                  <input
                    type="text"
                    className="cat-input"
                    placeholder="Value (e.g. L, Matte, Plywood)"
                    value={sf.value}
                    onChange={(e) => handleUpdateSpecFilter(idx, "value", e.target.value)}
                  />
                  {specFilters.length > 1 && (
                    <button
                      type="button"
                      className="cat-btn cat-btn-danger cat-btn-sm"
                      onClick={() => handleRemoveSpecFilter(idx)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="cat-btn cat-btn-primary" style={{ padding: "10px 24px" }} disabled={loading}>
            <Search size={15} /> {loading ? "Searching..." : "Search Designs in Database"}
          </button>
        </form>
      </div>

      {/* Results Card */}
      {searched && (
        <div className="cat-card">
          <div className="cat-card-header">
            <h2 className="cat-card-title">
              Search Results ({totalMatches !== null ? totalMatches : results.length})
            </h2>
          </div>

          {loading ? (
            <div className="cat-loading">Querying database...</div>
          ) : results.length === 0 ? (
            <div className="cat-empty">
              <span className="cat-empty-icon">🔍</span>
              No designs matched your criteria. Try loosening your specification filters or selecting a different business.
            </div>
          ) : (
            <div className="cat-table-wrap">
              <table className="cat-table">
                <thead>
                  <tr>
                    <th className="cat-th">Design Name</th>
                    <th className="cat-th">Business</th>
                    <th className="cat-th">Service & Category</th>
                    <th className="cat-th">Matching Specifications</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((design) => (
                    <tr key={design.id} className="cat-tr">
                      <td className="cat-td cat-td-bold">
                        {design.design_name}
                      </td>
                      <td className="cat-td">
                        <span className="cat-chip">
                          <Building size={12} /> {design.business?.name || `Business #${design.business_id}`}
                        </span>
                      </td>
                      <td className="cat-td">
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontSize: "12px", color: "#1e293b", fontWeight: 600 }}>
                            {design.service?.service_name || "—"}
                          </span>
                          <span style={{ fontSize: "11px", color: "#64748b" }}>
                            ↳ {design.category?.category_name || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="cat-td">
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          {design.specifications?.map((s) => (
                            <span key={s.id} className="cat-chip" style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}>
                              <strong>{s.attribute_name}:</strong> {s.attribute_value}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
