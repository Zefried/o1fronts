import React, { useState, useEffect, useCallback } from "react";
import {
  Layers,
  Building,
  Briefcase,
  FolderTree,
  Palette,
  Sliders,
  Plus,
  Trash2,
  ArrowRight,
  RotateCcw,
  Tag,
  Check,
} from "lucide-react";
import {
  catalogueApi,
  type Niche,
  type BusinessItem,
  type CatalogueServiceItem,
  type CatalogueCategoryItem,
  type FlatCatalogueCategory,
  type DesignItem,
} from "../../../api/catalogueService";
import "./Styles/Catalogue.css";

export const CatalogueExplorer: React.FC = () => {
  // ── Flow Steps ─────────────────────────────────────────────────────────────
  // 1 = Niche, 2 = Business, 3 = Service, 4 = Category, 5 = Designs
  const [currentStep, setCurrentStep] = useState<number>(1);

  // ── Selected Entities ──────────────────────────────────────────────────────
  const [selectedNiche, setSelectedNiche] = useState<Niche | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessItem | null>(null);
  const [selectedService, setSelectedService] = useState<CatalogueServiceItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CatalogueCategoryItem | null>(null);

  // ── Entities Data Lists ────────────────────────────────────────────────────
  const [niches, setNiches] = useState<Niche[]>([]);
  const [businesses, setBusinesses] = useState<BusinessItem[]>([]);
  const [allUnassignedBusinesses, setAllUnassignedBusinesses] = useState<BusinessItem[]>([]);
  const [services, setServices] = useState<CatalogueServiceItem[]>([]);
  const [categoriesTree, setCategoriesTree] = useState<CatalogueCategoryItem[]>([]);
  const [categoriesFlat, setCategoriesFlat] = useState<FlatCatalogueCategory[]>([]);
  const [designs, setDesigns] = useState<DesignItem[]>([]);

  // ── Specifications Drawer State ────────────────────────────────────────────
  const [activeDesignForSpecs, setActiveDesignForSpecs] = useState<DesignItem | null>(null);
  const [specRows, setSpecRows] = useState<{ attribute_name: string; attribute_value: string }[]>([
    { attribute_name: "", attribute_value: "" },
  ]);

  // ── Loading & Notification States ──────────────────────────────────────────
  const [loading, setLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // ── Modals State ───────────────────────────────────────────────────────────
  const [modalType, setModalType] = useState<
    "create_niche" | "create_business" | "assign_business" | "create_service" | "create_category" | "create_design" | null
  >(null);
  const [modalError, setModalError] = useState<string>("");
  const [modalSubmitting, setModalSubmitting] = useState<boolean>(false);

  // Modal Form Inputs
  const [newNicheName, setNewNicheName] = useState("");
  const [newBusinessName, setNewBusinessName] = useState("");
  const [newBusinessEmail, setNewBusinessEmail] = useState("");
  const [newBusinessPhone, setNewBusinessPhone] = useState("");
  const [assignBusinessUserId, setAssignBusinessUserId] = useState<number | "">("");
  const [newServiceName, setNewServiceName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryParentId, setNewCategoryParentId] = useState<number | null>(null);
  const [newDesignName, setNewDesignName] = useState("");
  const [initialSpecs, setInitialSpecs] = useState<{ attribute_name: string; attribute_value: string }[]>([
    { attribute_name: "Shape", attribute_value: "L" },
    { attribute_name: "Finish", attribute_value: "Matte" },
  ]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Loaders ────────────────────────────────────────────────────────────────

  // Step 1: Load Niches
  const loadNiches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await catalogueApi.getNiches();
      if (res.status) setNiches(res.data);
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Failed to load niches.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNiches();
  }, [loadNiches]);

  // Step 2: Load Businesses for Selected Niche
  const loadBusinesses = useCallback(async (nicheId: number) => {
    setLoading(true);
    try {
      const [nicheBusRes, allBusRes] = await Promise.all([
        catalogueApi.getBusinessesByNiche(nicheId),
        catalogueApi.getAllBusinesses(),
      ]);
      if (nicheBusRes.status) setBusinesses(nicheBusRes.data);
      if (allBusRes.status) {
        // Find businesses not yet assigned to this niche
        setAllUnassignedBusinesses(allBusRes.data.filter((b) => b.niche_id !== nicheId));
      }
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Failed to load businesses.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Step 3: Load Services for Selected Business
  const loadServices = useCallback(async (businessId: number) => {
    setLoading(true);
    try {
      const res = await catalogueApi.getServicesByBusiness(businessId);
      if (res.status) setServices(res.data);
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Failed to load services.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Step 4: Load Categories for Selected Service
  const loadCategories = useCallback(async (serviceId: number) => {
    setLoading(true);
    try {
      const res = await catalogueApi.getCategoriesByService(serviceId);
      if (res.status) {
        setCategoriesTree(res.tree || []);
        setCategoriesFlat(res.flat || []);
      }
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Step 5: Load Designs for Selected Category
  const loadDesigns = useCallback(async (categoryId: number) => {
    setLoading(true);
    try {
      const res = await catalogueApi.getDesigns({ category_id: categoryId });
      if (res.status) setDesigns(res.data);
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Failed to load designs.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Navigation Handlers ────────────────────────────────────────────────────

  const handleSelectNiche = (niche: Niche) => {
    setSelectedNiche(niche);
    setSelectedBusiness(null);
    setSelectedService(null);
    setSelectedCategory(null);
    setActiveDesignForSpecs(null);
    setCurrentStep(2);
    loadBusinesses(niche.id);
  };

  const handleSelectBusiness = (business: BusinessItem) => {
    setSelectedBusiness(business);
    setSelectedService(null);
    setSelectedCategory(null);
    setActiveDesignForSpecs(null);
    setCurrentStep(3);
    loadServices(business.id);
  };

  const handleSelectService = (service: CatalogueServiceItem) => {
    setSelectedService(service);
    setSelectedCategory(null);
    setActiveDesignForSpecs(null);
    setCurrentStep(4);
    loadCategories(service.id);
  };

  const handleSelectCategory = (category: CatalogueCategoryItem) => {
    setSelectedCategory(category);
    setActiveDesignForSpecs(null);
    setCurrentStep(5);
    loadDesigns(category.id);
  };

  const handleOpenDesignSpecs = (design: DesignItem) => {
    setActiveDesignForSpecs(design);
    setSpecRows([{ attribute_name: "", attribute_value: "" }]);
  };

  const handleResetToStep = (step: number) => {
    setCurrentStep(step);
    if (step < 5) {
      setSelectedCategory(null);
      setActiveDesignForSpecs(null);
    }
    if (step < 4) setSelectedService(null);
    if (step < 3) setSelectedBusiness(null);
    if (step < 2) setSelectedNiche(null);
  };

  // ── Entity Deletion Handlers ───────────────────────────────────────────────

  const handleUnlinkBusiness = async (businessId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedNiche) return;
    if (!window.confirm("Unlink this business from the current niche?")) return;

    try {
      const res = await catalogueApi.unlinkBusinessFromNiche(selectedNiche.id, businessId);
      if (res.status) {
        showToast("success", "Business unlinked from niche.");
        loadBusinesses(selectedNiche.id);
      }
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Failed to unlink business.");
    }
  };

  const handleDeleteService = async (serviceId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this service and all its categories and designs?")) return;

    try {
      const res = await catalogueApi.deleteService(serviceId);
      if (res.status) {
        showToast("success", "Service deleted.");
        if (selectedBusiness) loadServices(selectedBusiness.id);
      }
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Failed to delete service.");
    }
  };

  const handleDeleteCategory = async (categoryId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete category and its subcategories and designs?")) return;

    try {
      const res = await catalogueApi.deleteCategory(categoryId);
      if (res.status) {
        showToast("success", "Category deleted.");
        if (selectedService) loadCategories(selectedService.id);
      }
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Failed to delete category.");
    }
  };

  const handleDeleteDesign = async (designId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this design and its specifications?")) return;

    try {
      const res = await catalogueApi.deleteDesign(designId);
      if (res.status) {
        showToast("success", "Design deleted.");
        if (selectedCategory) loadDesigns(selectedCategory.id);
        if (activeDesignForSpecs?.id === designId) setActiveDesignForSpecs(null);
      }
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Failed to delete design.");
    }
  };

  // ── Specifications Management ──────────────────────────────────────────────

  const handleAddSpecificationRow = () => {
    setSpecRows((prev) => [...prev, { attribute_name: "", attribute_value: "" }]);
  };

  const handleUpdateSpecRow = (index: number, field: "attribute_name" | "attribute_value", val: string) => {
    setSpecRows((prev) => {
      const updated = [...prev];
      updated[index][field] = val;
      return updated;
    });
  };

  const handleRemoveSpecRow = (index: number) => {
    setSpecRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveNewSpecifications = async () => {
    if (!activeDesignForSpecs) return;
    const validSpecs = specRows.filter((r) => r.attribute_name.trim() && r.attribute_value.trim());
    if (validSpecs.length === 0) {
      showToast("error", "Please provide at least one valid attribute and value.");
      return;
    }

    try {
      const res = await catalogueApi.addSpecification(activeDesignForSpecs.id, {
        specifications: validSpecs,
      });
      if (res.status) {
        showToast("success", "Specifications saved successfully!");
        // Refresh active design
        const refreshed = await catalogueApi.getDesign(activeDesignForSpecs.id);
        if (refreshed.status) {
          setActiveDesignForSpecs(refreshed.data);
          // Also update list
          if (selectedCategory) loadDesigns(selectedCategory.id);
        }
        setSpecRows([{ attribute_name: "", attribute_value: "" }]);
      }
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Failed to save specifications.");
    }
  };

  const handleDeleteSingleSpec = async (specId: number) => {
    if (!window.confirm("Delete this specification?")) return;
    try {
      const res = await catalogueApi.deleteSpecification(specId);
      if (res.status && activeDesignForSpecs) {
        showToast("success", "Specification deleted.");
        const refreshed = await catalogueApi.getDesign(activeDesignForSpecs.id);
        if (refreshed.status) {
          setActiveDesignForSpecs(refreshed.data);
          if (selectedCategory) loadDesigns(selectedCategory.id);
        }
      }
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Failed to delete specification.");
    }
  };

  // ── Modal Submission Handlers ──────────────────────────────────────────────

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalSubmitting(true);
    setModalError("");

    try {
      if (modalType === "create_niche") {
        if (!newNicheName.trim()) throw new Error("Niche name is required.");
        const res = await catalogueApi.createNiche({ niche_name: newNicheName.trim() });
        if (res.status) {
          showToast("success", "Niche created!");
          loadNiches();
          setModalType(null);
          setNewNicheName("");
        }
      } else if (modalType === "create_business") {
        if (!selectedNiche) throw new Error("No niche selected.");
        if (!newBusinessName.trim() || !newBusinessEmail.trim()) {
          throw new Error("Business name and email are required.");
        }
        const res = await catalogueApi.createBusinessUnderNiche(selectedNiche.id, {
          business_name: newBusinessName.trim(),
          email: newBusinessEmail.trim(),
          phone: newBusinessPhone.trim() || undefined,
        });
        if (res.status) {
          showToast("success", "Business created and linked to niche!");
          loadBusinesses(selectedNiche.id);
          setModalType(null);
          setNewBusinessName("");
          setNewBusinessEmail("");
          setNewBusinessPhone("");
        }
      } else if (modalType === "assign_business") {
        if (!selectedNiche) throw new Error("No niche selected.");
        if (!assignBusinessUserId) throw new Error("Please select a business to assign.");
        const res = await catalogueApi.assignBusinessToNiche(selectedNiche.id, Number(assignBusinessUserId));
        if (res.status) {
          showToast("success", "Existing business assigned to niche!");
          loadBusinesses(selectedNiche.id);
          setModalType(null);
          setAssignBusinessUserId("");
        }
      } else if (modalType === "create_service") {
        if (!selectedBusiness) throw new Error("No business selected.");
        if (!newServiceName.trim()) throw new Error("Service name is required.");
        const res = await catalogueApi.createService(selectedBusiness.id, {
          service_name: newServiceName.trim(),
        });
        if (res.status) {
          showToast("success", "Service created!");
          loadServices(selectedBusiness.id);
          setModalType(null);
          setNewServiceName("");
        }
      } else if (modalType === "create_category") {
        if (!selectedService) throw new Error("No service selected.");
        if (!newCategoryName.trim()) throw new Error("Category name is required.");
        const res = await catalogueApi.createCategory(selectedService.id, {
          category_name: newCategoryName.trim(),
          parent_id: newCategoryParentId,
        });
        if (res.status) {
          showToast("success", "Category created!");
          loadCategories(selectedService.id);
          setModalType(null);
          setNewCategoryName("");
          setNewCategoryParentId(null);
        }
      } else if (modalType === "create_design") {
        if (!selectedCategory) throw new Error("No category selected.");
        if (!newDesignName.trim()) throw new Error("Design name is required.");
        const validSpecs = initialSpecs.filter((s) => s.attribute_name.trim() && s.attribute_value.trim());

        const res = await catalogueApi.createDesign({
          category_id: selectedCategory.id,
          design_name: newDesignName.trim(),
          specifications: validSpecs,
        });
        if (res.status) {
          showToast("success", "Design created!");
          loadDesigns(selectedCategory.id);
          setModalType(null);
          setNewDesignName("");
          setInitialSpecs([
            { attribute_name: "Shape", attribute_value: "L" },
            { attribute_name: "Finish", attribute_value: "Matte" },
          ]);
        }
      }
    } catch (err: any) {
      setModalError(err?.response?.data?.message || err?.message || "An error occurred.");
    } finally {
      setModalSubmitting(false);
    }
  };

  const renderCategoryNode = (cat: CatalogueCategoryItem): React.ReactNode => {
    const isSelected = selectedCategory?.id === cat.id;
    const hasChildren = cat.all_children && cat.all_children.length > 0;

    return (
      <div key={cat.id} className="cat-tree-node">
        <div
          className={`cat-tree-row ${isSelected ? "cat-tree-row--selected" : ""}`}
          onClick={() => handleSelectCategory(cat)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Tag size={15} color={hasChildren ? "#8b5cf6" : "#64748b"} />
            <span style={{ fontWeight: 600, color: "#0f172a", fontSize: "14px" }}>{cat.category_name}</span>
            <span className="cat-chip">{cat.designs_count ?? 0} designs</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              className="cat-btn cat-btn-secondary cat-btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                setNewCategoryParentId(cat.id);
                setModalType("create_category");
              }}
              title="Add subcategory inside this category"
            >
              + Add Subcategory
            </button>
            <button
              type="button"
              className="cat-btn cat-btn-danger cat-btn-sm"
              onClick={(e) => handleDeleteCategory(cat.id, e)}
              title="Delete category"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {hasChildren && (
          <div className="cat-tree-children">
            {cat.all_children!.map((child) => renderCategoryNode(child))}
          </div>
        )}
      </div>
    );
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

      {/* Main Header */}
      <header className="cat-header">
        <div className="cat-title-wrap">
          <h1 className="cat-title">
            <FolderTree size={24} color="#2563eb" />
            Catalogue Explorer & Studio
            <span className="cat-badge">Additive Module</span>
          </h1>
          <p className="cat-subtitle">
            Manage the complete hierarchical flow: <strong>Niche → Business → Services → Categories → Designs → Specifications</strong>.
          </p>
        </div>

        <div className="cat-actions">
          <button
            className="cat-btn cat-btn-secondary"
            onClick={() => handleResetToStep(1)}
            title="Reset exploration path"
          >
            <RotateCcw size={14} /> Start Over
          </button>
        </div>
      </header>

      {/* Step Navigation Bar */}
      <div className="cat-workflow">
        <button
          type="button"
          className={`cat-step ${currentStep === 1 ? "cat-step--active" : selectedNiche ? "cat-step--completed" : ""}`}
          onClick={() => handleResetToStep(1)}
        >
          <span className="cat-step-num">1</span>
          <Layers size={14} /> 1. Niches
        </button>

        <span className="cat-step-sep">›</span>

        <button
          type="button"
          className={`cat-step ${currentStep === 2 ? "cat-step--active" : selectedBusiness ? "cat-step--completed" : ""}`}
          onClick={() => selectedNiche && handleResetToStep(2)}
          disabled={!selectedNiche}
        >
          <span className="cat-step-num">2</span>
          <Building size={14} /> 2. Businesses
        </button>

        <span className="cat-step-sep">›</span>

        <button
          type="button"
          className={`cat-step ${currentStep === 3 ? "cat-step--active" : selectedService ? "cat-step--completed" : ""}`}
          onClick={() => selectedBusiness && handleResetToStep(3)}
          disabled={!selectedBusiness}
        >
          <span className="cat-step-num">3</span>
          <Briefcase size={14} /> 3. Services
        </button>

        <span className="cat-step-sep">›</span>

        <button
          type="button"
          className={`cat-step ${currentStep === 4 ? "cat-step--active" : selectedCategory ? "cat-step--completed" : ""}`}
          onClick={() => selectedService && handleResetToStep(4)}
          disabled={!selectedService}
        >
          <span className="cat-step-num">4</span>
          <FolderTree size={14} /> 4. Categories & Subcategories
        </button>

        <span className="cat-step-sep">›</span>

        <button
          type="button"
          className={`cat-step ${currentStep === 5 ? "cat-step--active" : ""}`}
          onClick={() => selectedCategory && handleResetToStep(5)}
          disabled={!selectedCategory}
        >
          <span className="cat-step-num">5</span>
          <Palette size={14} /> 5. Designs & Specs
        </button>
      </div>

      {/* Breadcrumb Path Banner */}
      {(selectedNiche || selectedBusiness || selectedService || selectedCategory) && (
        <div className="cat-current-path">
          <span>Active Hierarchy:</span>
          {selectedNiche && (
            <span className="cat-path-item" onClick={() => handleResetToStep(1)} style={{ cursor: "pointer" }}>
              <Layers size={12} color="#3b82f6" /> {selectedNiche.niche_name}
            </span>
          )}
          {selectedBusiness && (
            <>
              <span>›</span>
              <span className="cat-path-item" onClick={() => handleResetToStep(2)} style={{ cursor: "pointer" }}>
                <Building size={12} color="#10b981" /> {selectedBusiness.name}
              </span>
            </>
          )}
          {selectedService && (
            <>
              <span>›</span>
              <span className="cat-path-item" onClick={() => handleResetToStep(3)} style={{ cursor: "pointer" }}>
                <Briefcase size={12} color="#f59e0b" /> {selectedService.service_name}
              </span>
            </>
          )}
          {selectedCategory && (
            <>
              <span>›</span>
              <span className="cat-path-item">
                <FolderTree size={12} color="#8b5cf6" /> {selectedCategory.category_name}
              </span>
            </>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* STEP 1: NICHES VIEW                                                 */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {currentStep === 1 && (
        <div className="cat-card">
          <div className="cat-card-header">
            <h2 className="cat-card-title">
              <Layers size={18} color="#2563eb" /> Select an Industry Niche ({niches.length})
            </h2>
            <button className="cat-btn cat-btn-primary cat-btn-sm" onClick={() => setModalType("create_niche")}>
              <Plus size={14} /> Add Niche
            </button>
          </div>

          {loading ? (
            <div className="cat-loading">Loading niches...</div>
          ) : niches.length === 0 ? (
            <div className="cat-empty">
              <span className="cat-empty-icon">📂</span>
              No niches created yet. Click "Add Niche" to get started.
            </div>
          ) : (
            <div className="cat-grid">
              {niches.map((niche) => (
                <div
                  key={niche.id}
                  className={`cat-item-card ${selectedNiche?.id === niche.id ? "cat-item-card--selected" : ""}`}
                  onClick={() => handleSelectNiche(niche)}
                >
                  <div>
                    <div className="cat-item-card-header">
                      <h3 className="cat-item-card-title">{niche.niche_name}</h3>
                      <span className={`cat-status-badge ${niche.is_active ? "cat-status-badge--active" : "cat-status-badge--inactive"}`}>
                        {niche.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="cat-item-card-meta">
                      Industry Niche #{niche.id}
                    </div>
                  </div>

                  <div className="cat-item-card-footer">
                    <span>🏢 {niche.businesses_count ?? 0} businesses</span>
                    <span style={{ color: "#2563eb", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                      Manage <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* STEP 2: BUSINESSES UNDER NICHE                                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {currentStep === 2 && selectedNiche && (
        <div className="cat-card">
          <div className="cat-card-header">
            <h2 className="cat-card-title">
              <Building size={18} color="#10b981" /> Businesses in "{selectedNiche.niche_name}" ({businesses.length})
            </h2>

            <div style={{ display: "flex", gap: "8px" }}>
              <button className="cat-btn cat-btn-secondary cat-btn-sm" onClick={() => setModalType("assign_business")}>
                Link Existing Business
              </button>
              <button className="cat-btn cat-btn-primary cat-btn-sm" onClick={() => setModalType("create_business")}>
                <Plus size={14} /> New Business
              </button>
            </div>
          </div>

          {loading ? (
            <div className="cat-loading">Loading businesses...</div>
          ) : businesses.length === 0 ? (
            <div className="cat-empty">
              <span className="cat-empty-icon">🏢</span>
              No businesses assigned to this niche yet. Link an existing business or create a new one above.
            </div>
          ) : (
            <div className="cat-grid">
              {businesses.map((bus) => (
                <div
                  key={bus.id}
                  className={`cat-item-card ${selectedBusiness?.id === bus.id ? "cat-item-card--selected" : ""}`}
                  onClick={() => handleSelectBusiness(bus)}
                >
                  <div>
                    <div className="cat-item-card-header">
                      <h3 className="cat-item-card-title">{bus.name}</h3>
                      <button
                        type="button"
                        className="cat-btn cat-btn-danger cat-btn-sm"
                        style={{ padding: "2px 6px" }}
                        onClick={(e) => handleUnlinkBusiness(bus.id, e)}
                        title="Unlink from niche"
                      >
                        Unlink
                      </button>
                    </div>
                    <div className="cat-item-card-meta">
                      ID: {bus.business_id || `User #${bus.id}`} • {bus.email}
                    </div>
                  </div>

                  <div className="cat-item-card-footer">
                    <span>🛍️ {bus.catalogue_services_count ?? 0} Services • {bus.designs_count ?? 0} Designs</span>
                    <span style={{ color: "#2563eb", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                      Services <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* STEP 3: SERVICES UNDER BUSINESS                                    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {currentStep === 3 && selectedBusiness && (
        <div className="cat-card">
          <div className="cat-card-header">
            <h2 className="cat-card-title">
              <Briefcase size={18} color="#f59e0b" /> Services for "{selectedBusiness.name}" ({services.length})
            </h2>

            <button className="cat-btn cat-btn-primary cat-btn-sm" onClick={() => setModalType("create_service")}>
              <Plus size={14} /> Add Service
            </button>
          </div>

          {loading ? (
            <div className="cat-loading">Loading services...</div>
          ) : services.length === 0 ? (
            <div className="cat-empty">
              <span className="cat-empty-icon">🛍️</span>
              No catalogue services created for this business yet.
            </div>
          ) : (
            <div className="cat-grid">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className={`cat-item-card ${selectedService?.id === svc.id ? "cat-item-card--selected" : ""}`}
                  onClick={() => handleSelectService(svc)}
                >
                  <div>
                    <div className="cat-item-card-header">
                      <h3 className="cat-item-card-title">{svc.service_name}</h3>
                      <button
                        type="button"
                        className="cat-btn cat-btn-danger cat-btn-sm"
                        style={{ padding: "2px 6px" }}
                        onClick={(e) => handleDeleteService(svc.id, e)}
                        title="Delete service"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div className="cat-item-card-meta">
                      Service ID #{svc.id}
                    </div>
                  </div>

                  <div className="cat-item-card-footer">
                    <span>🗂️ {svc.categories_count ?? 0} Categories • {svc.designs_count ?? 0} Designs</span>
                    <span style={{ color: "#2563eb", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                      Categories <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* STEP 4: CATEGORIES & SUBCATEGORIES                                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {currentStep === 4 && selectedService && (
        <div className="cat-card">
          <div className="cat-card-header">
            <h2 className="cat-card-title">
              <FolderTree size={18} color="#8b5cf6" /> Categories for "{selectedService.service_name}"
            </h2>

            <button className="cat-btn cat-btn-primary cat-btn-sm" onClick={() => setModalType("create_category")}>
              <Plus size={14} /> Add Category / Subcategory
            </button>
          </div>

          {loading ? (
            <div className="cat-loading">Loading category tree...</div>
          ) : categoriesTree.length === 0 ? (
            <div className="cat-empty">
              <span className="cat-empty-icon">📁</span>
              No categories created under this service yet. Click "Add Category" to build your hierarchy (e.g. Modular Kitchen → L-Shaped Kitchen).
            </div>
          ) : (
            <div className="cat-tree-wrap">
              {categoriesTree.map((cat) => renderCategoryNode(cat))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* STEP 5: DESIGNS & SPECIFICATIONS                                    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {currentStep === 5 && selectedCategory && (
        <div style={{ display: "grid", gridTemplateColumns: activeDesignForSpecs ? "1fr 1fr" : "1fr", gap: "20px" }}>
          {/* Designs List */}
          <div className="cat-card" style={{ height: "fit-content" }}>
            <div className="cat-card-header">
              <h2 className="cat-card-title">
                <Palette size={18} color="#ec4899" /> Designs in "{selectedCategory.category_name}" ({designs.length})
              </h2>

              <button className="cat-btn cat-btn-primary cat-btn-sm" onClick={() => setModalType("create_design")}>
                <Plus size={14} /> Add Design
              </button>
            </div>

            {loading ? (
              <div className="cat-loading">Loading designs...</div>
            ) : designs.length === 0 ? (
              <div className="cat-empty">
                <span className="cat-empty-icon">🎨</span>
                No designs created for this category yet. Click "Add Design" to create one with custom specifications.
              </div>
            ) : (
              <div className="cat-table-wrap">
                <table className="cat-table">
                  <thead>
                    <tr>
                      <th className="cat-th">Design Name</th>
                      <th className="cat-th">Specifications</th>
                      <th className="cat-th" style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {designs.map((design) => {
                      const isSelected = activeDesignForSpecs?.id === design.id;
                      return (
                        <tr
                          key={design.id}
                          className="cat-tr"
                          style={{
                            background: isSelected ? "#f0f7ff" : undefined,
                            cursor: "pointer",
                          }}
                          onClick={() => handleOpenDesignSpecs(design)}
                        >
                          <td className="cat-td cat-td-bold">
                            {design.design_name}
                          </td>
                          <td className="cat-td">
                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                              {design.specifications && design.specifications.length > 0 ? (
                                design.specifications.slice(0, 3).map((spec) => (
                                  <span key={spec.id} className="cat-chip">
                                    <strong>{spec.attribute_name}:</strong> {spec.attribute_value}
                                  </span>
                                ))
                              ) : (
                                <span style={{ color: "#94a3b8", fontSize: "11px" }}>No specifications</span>
                              )}
                              {design.specifications && design.specifications.length > 3 && (
                                <span className="cat-chip">+{design.specifications.length - 3} more</span>
                              )}
                            </div>
                          </td>
                          <td className="cat-td" style={{ textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: "6px" }}>
                              <button
                                type="button"
                                className="cat-btn cat-btn-secondary cat-btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDesignSpecs(design);
                                }}
                              >
                                <Sliders size={12} /> Specs
                              </button>
                              <button
                                type="button"
                                className="cat-btn cat-btn-danger cat-btn-sm"
                                onClick={(e) => handleDeleteDesign(design.id, e)}
                              >
                                <Trash2 size={12} />
                              </button>
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

          {/* Dynamic Specifications Drawer */}
          {activeDesignForSpecs && (
            <div className="cat-card">
              <div className="cat-card-header" style={{ background: "#f8fafc" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <h3 className="cat-card-title" style={{ fontSize: "15px" }}>
                    <Sliders size={16} color="#2563eb" /> Specifications: {activeDesignForSpecs.design_name}
                  </h3>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    Flexible attribute-name/value key-value store
                  </span>
                </div>

                <button
                  type="button"
                  className="cat-btn cat-btn-secondary cat-btn-sm"
                  onClick={() => setActiveDesignForSpecs(null)}
                >
                  ✕ Close
                </button>
              </div>

              <div style={{ padding: "16px 20px" }}>
                {/* Existing specs */}
                <h4 style={{ fontSize: "12px", textTransform: "uppercase", color: "#64748b", margin: "0 0 10px 0" }}>
                  Active Specifications ({activeDesignForSpecs.specifications?.length || 0})
                </h4>

                {activeDesignForSpecs.specifications && activeDesignForSpecs.specifications.length > 0 ? (
                  <div className="cat-spec-grid">
                    {activeDesignForSpecs.specifications.map((spec) => (
                      <div key={spec.id} className="cat-spec-badge">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <span className="cat-spec-key">{spec.attribute_name}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteSingleSpec(spec.id)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#ef4444",
                              cursor: "pointer",
                              padding: "0 2px",
                            }}
                            title="Delete specification"
                          >
                            ✕
                          </button>
                        </div>
                        <span className="cat-spec-val">{spec.attribute_value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic", marginBottom: "16px" }}>
                    No specifications added yet. Add one below.
                  </div>
                )}

                {/* Add new specs dynamic rows */}
                <div style={{ marginTop: "20px", borderTop: "1px dashed #e2e8f0", paddingTop: "16px" }}>
                  <h4 style={{ fontSize: "12px", textTransform: "uppercase", color: "#1e293b", margin: "0 0 10px 0" }}>
                    + Add New Specifications
                  </h4>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {specRows.map((row, idx) => (
                      <div key={idx} className="cat-spec-row">
                        <input
                          type="text"
                          className="cat-input"
                          placeholder="Attribute (e.g. Shape, Finish)"
                          value={row.attribute_name}
                          onChange={(e) => handleUpdateSpecRow(idx, "attribute_name", e.target.value)}
                        />
                        <input
                          type="text"
                          className="cat-input"
                          placeholder="Value (e.g. L, Matte, Granite)"
                          value={row.attribute_value}
                          onChange={(e) => handleUpdateSpecRow(idx, "attribute_value", e.target.value)}
                        />
                        {specRows.length > 1 && (
                          <button
                            type="button"
                            className="cat-btn cat-btn-danger cat-btn-sm"
                            onClick={() => handleRemoveSpecRow(idx)}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                    <button type="button" className="cat-btn cat-btn-secondary cat-btn-sm" onClick={handleAddSpecificationRow}>
                      + Add Row
                    </button>
                    <button type="button" className="cat-btn cat-btn-primary cat-btn-sm" onClick={handleSaveNewSpecifications}>
                      <Check size={14} /> Save Specifications
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* CREATION & ASSIGNMENT MODALS                                        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {modalType && (
        <div className="cat-modal-backdrop" onClick={() => !modalSubmitting && setModalType(null)}>
          <div className="cat-modal" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleModalSubmit}>
              <div className="cat-modal-header">
                <h3 className="cat-modal-title">
                  {modalType === "create_niche" && "Create New Niche"}
                  {modalType === "create_business" && `Create Business under "${selectedNiche?.niche_name}"`}
                  {modalType === "assign_business" && `Link Business to "${selectedNiche?.niche_name}"`}
                  {modalType === "create_service" && `Add Service for "${selectedBusiness?.name}"`}
                  {modalType === "create_category" && `Add Category for "${selectedService?.service_name}"`}
                  {modalType === "create_design" && `Add Design under "${selectedCategory?.category_name}"`}
                </h3>
                <button type="button" className="cat-modal-close" onClick={() => setModalType(null)}>
                  ✕
                </button>
              </div>

              <div className="cat-modal-body">
                {modalError && <div className="cat-error-box">{modalError}</div>}

                {/* Create Niche */}
                {modalType === "create_niche" && (
                  <div className="cat-form-group">
                    <label className="cat-label">Niche Name *</label>
                    <input
                      type="text"
                      className="cat-input"
                      placeholder="e.g. Interior Design, Architecture"
                      value={newNicheName}
                      onChange={(e) => setNewNicheName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                )}

                {/* Create Business */}
                {modalType === "create_business" && (
                  <>
                    <div className="cat-form-group">
                      <label className="cat-label">Business Name *</label>
                      <input
                        type="text"
                        className="cat-input"
                        placeholder="e.g. Royal Modular Kitchens"
                        value={newBusinessName}
                        onChange={(e) => setNewBusinessName(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                    <div className="cat-form-group">
                      <label className="cat-label">Email Address *</label>
                      <input
                        type="email"
                        className="cat-input"
                        placeholder="business@example.com"
                        value={newBusinessEmail}
                        onChange={(e) => setNewBusinessEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="cat-form-group">
                      <label className="cat-label">Phone Number (optional)</label>
                      <input
                        type="text"
                        className="cat-input"
                        placeholder="+91 98765 43210"
                        value={newBusinessPhone}
                        onChange={(e) => setNewBusinessPhone(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* Assign Business */}
                {modalType === "assign_business" && (
                  <div className="cat-form-group">
                    <label className="cat-label">Select Existing Business *</label>
                    <select
                      className="cat-select"
                      value={assignBusinessUserId}
                      onChange={(e) => setAssignBusinessUserId(Number(e.target.value))}
                      required
                    >
                      <option value="">-- Choose an existing business --</option>
                      {allUnassignedBusinesses.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.business_id || `User #${b.id}`}) {b.niche ? `[Currently in: ${b.niche.niche_name}]` : "[Unassigned]"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Create Service */}
                {modalType === "create_service" && (
                  <div className="cat-form-group">
                    <label className="cat-label">Service Name *</label>
                    <input
                      type="text"
                      className="cat-input"
                      placeholder="e.g. Modular Kitchen, Wardrobe Design"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                )}

                {/* Create Category */}
                {modalType === "create_category" && (
                  <>
                    <div className="cat-form-group">
                      <label className="cat-label">Category Name *</label>
                      <input
                        type="text"
                        className="cat-input"
                        placeholder="e.g. L-Shaped Kitchen, Parallel Kitchen"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>

                    <div className="cat-form-group">
                      <label className="cat-label">Parent Category (optional for nested hierarchy)</label>
                      <select
                        className="cat-select"
                        value={newCategoryParentId ?? ""}
                        onChange={(e) => setNewCategoryParentId(e.target.value ? Number(e.target.value) : null)}
                      >
                        <option value="">-- None (Root Category) --</option>
                        {categoriesFlat.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Create Design */}
                {modalType === "create_design" && (
                  <>
                    <div className="cat-form-group">
                      <label className="cat-label">Design Name *</label>
                      <input
                        type="text"
                        className="cat-input"
                        placeholder="e.g. Italian Matte L-Kitchen, Acrylic High-Gloss Design"
                        value={newDesignName}
                        onChange={(e) => setNewDesignName(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>

                    <div className="cat-form-group" style={{ marginTop: "12px" }}>
                      <label className="cat-label">Initial Specifications (Optional Key-Value pairs)</label>
                      {initialSpecs.map((s, idx) => (
                        <div key={idx} className="cat-spec-row" style={{ marginBottom: "6px" }}>
                          <input
                            type="text"
                            className="cat-input"
                            placeholder="Attribute Name"
                            value={s.attribute_name}
                            onChange={(e) => {
                              const updated = [...initialSpecs];
                              updated[idx].attribute_name = e.target.value;
                              setInitialSpecs(updated);
                            }}
                          />
                          <input
                            type="text"
                            className="cat-input"
                            placeholder="Attribute Value"
                            value={s.attribute_value}
                            onChange={(e) => {
                              const updated = [...initialSpecs];
                              updated[idx].attribute_value = e.target.value;
                              setInitialSpecs(updated);
                            }}
                          />
                          <button
                            type="button"
                            className="cat-btn cat-btn-danger cat-btn-sm"
                            onClick={() => setInitialSpecs(initialSpecs.filter((_, i) => i !== idx))}
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        className="cat-btn cat-btn-secondary cat-btn-sm"
                        style={{ alignSelf: "flex-start", marginTop: "6px" }}
                        onClick={() => setInitialSpecs([...initialSpecs, { attribute_name: "", attribute_value: "" }])}
                      >
                        + Add Attribute
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="cat-modal-footer">
                <button
                  type="button"
                  className="cat-btn cat-btn-secondary"
                  onClick={() => setModalType(null)}
                  disabled={modalSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cat-btn cat-btn-primary"
                  disabled={modalSubmitting}
                >
                  {modalSubmitting ? "Saving..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
