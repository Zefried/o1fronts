import api from "./axios";

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface Niche {
  id: number;
  niche_name: string;
  is_active: boolean;
  businesses_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BusinessItem {
  id: number;
  name: string;
  business_id: string;
  email: string;
  phone?: string;
  bio?: string;
  niche_id?: number | null;
  niche?: { id: number; niche_name: string };
  catalogue_services_count?: number;
  catalogue_categories_count?: number;
  designs_count?: number;
}

export interface CatalogueServiceItem {
  id: number;
  business_id: number;
  service_name: string;
  categories_count?: number;
  designs_count?: number;
  created_at?: string;
}

export interface CatalogueCategoryItem {
  id: number;
  business_id: number;
  service_id: number;
  category_name: string;
  parent_id: number | null;
  parent?: { id: number; category_name: string };
  designs_count?: number;
  all_children?: CatalogueCategoryItem[];
  designs?: DesignItem[];
}

export interface FlatCatalogueCategory {
  id: number;
  category_name: string;
  label: string;
  depth: number;
  parent_id: number | null;
  designs_count?: number;
}

export interface DesignSpecificationItem {
  id: number;
  design_id: number;
  attribute_name: string;
  attribute_value: string;
  created_at?: string;
}

export interface DesignItem {
  id: number;
  business_id: number;
  service_id: number;
  category_id: number;
  design_name: string;
  business?: { id: number; name: string; business_id: string };
  service?: { id: number; service_name: string };
  category?: { id: number; category_name: string; parent_id?: number | null };
  specifications: DesignSpecificationItem[];
  created_at?: string;
}

export interface ApiResponse<T = any> {
  status: boolean;
  message?: string;
  data: T;
  code?: number;
  [key: string]: any;
}

// ─── API Client ─────────────────────────────────────────────────────────────

export const catalogueApi = {
  // Niches
  getNiches: async (params?: { search?: string; is_active?: boolean }) => {
    const res = await api.get<ApiResponse<Niche[]>>("/admin/catalogue/niches", { params });
    return res.data;
  },

  createNiche: async (data: { niche_name: string; is_active?: boolean }) => {
    const res = await api.post<ApiResponse<Niche>>("/admin/catalogue/niches", data);
    return res.data;
  },

  updateNiche: async (id: number, data: { niche_name: string; is_active?: boolean }) => {
    const res = await api.put<ApiResponse<Niche>>(`/admin/catalogue/niches/${id}`, data);
    return res.data;
  },

  toggleNiche: async (id: number) => {
    const res = await api.patch<ApiResponse<Niche>>(`/admin/catalogue/niches/${id}/toggle`);
    return res.data;
  },

  deleteNiche: async (id: number) => {
    const res = await api.delete<ApiResponse>(`/admin/catalogue/niches/${id}`);
    return res.data;
  },

  // Businesses under Niche
  getBusinessesByNiche: async (nicheId: number) => {
    const res = await api.get<ApiResponse<BusinessItem[]>>(`/admin/catalogue/niches/${nicheId}/businesses`);
    return res.data;
  },

  getAllBusinesses: async (params?: { search?: string; unassigned_only?: boolean }) => {
    const res = await api.get<ApiResponse<BusinessItem[]>>("/admin/catalogue/businesses/all", { params });
    return res.data;
  },

  createBusinessUnderNiche: async (nicheId: number, data: { business_name: string; email: string; phone?: string; bio?: string; password?: string }) => {
    const res = await api.post<ApiResponse<BusinessItem>>(`/admin/catalogue/niches/${nicheId}/businesses`, data);
    return res.data;
  },

  assignBusinessToNiche: async (nicheId: number, userId: number) => {
    const res = await api.post<ApiResponse<BusinessItem>>(`/admin/catalogue/niches/${nicheId}/businesses/assign`, { user_id: userId });
    return res.data;
  },

  unlinkBusinessFromNiche: async (nicheId: number, businessId: number) => {
    const res = await api.delete<ApiResponse>(`/admin/catalogue/niches/${nicheId}/businesses/${businessId}/unlink`);
    return res.data;
  },

  // Services
  getServicesByBusiness: async (businessId: number) => {
    const res = await api.get<ApiResponse<CatalogueServiceItem[]>>(`/admin/catalogue/businesses/${businessId}/services`);
    return res.data;
  },

  createService: async (businessId: number, data: { service_name: string }) => {
    const res = await api.post<ApiResponse<CatalogueServiceItem>>(`/admin/catalogue/businesses/${businessId}/services`, data);
    return res.data;
  },

  updateService: async (id: number, data: { service_name: string }) => {
    const res = await api.put<ApiResponse<CatalogueServiceItem>>(`/admin/catalogue/services/${id}`, data);
    return res.data;
  },

  deleteService: async (id: number) => {
    const res = await api.delete<ApiResponse>(`/admin/catalogue/services/${id}`);
    return res.data;
  },

  // Categories
  getCategoriesByService: async (serviceId: number) => {
    const res = await api.get<ApiResponse<CatalogueCategoryItem[]> & { tree: CatalogueCategoryItem[]; flat: FlatCatalogueCategory[] }>(
      `/admin/catalogue/services/${serviceId}/categories`
    );
    return res.data;
  },

  createCategory: async (serviceId: number, data: { category_name: string; parent_id?: number | null }) => {
    const res = await api.post<ApiResponse<CatalogueCategoryItem>>(`/admin/catalogue/services/${serviceId}/categories`, data);
    return res.data;
  },

  updateCategory: async (id: number, data: { category_name: string; parent_id?: number | null }) => {
    const res = await api.put<ApiResponse<CatalogueCategoryItem>>(`/admin/catalogue/categories/${id}`, data);
    return res.data;
  },

  deleteCategory: async (id: number) => {
    const res = await api.delete<ApiResponse>(`/admin/catalogue/categories/${id}`);
    return res.data;
  },

  // Designs
  getDesigns: async (params?: { business_id?: number; service_id?: number; category_id?: number; search?: string }) => {
    const res = await api.get<ApiResponse<DesignItem[]>>("/admin/catalogue/designs", { params });
    return res.data;
  },

  getDesign: async (id: number) => {
    const res = await api.get<ApiResponse<DesignItem>>(`/admin/catalogue/designs/${id}`);
    return res.data;
  },

  createDesign: async (data: {
    category_id: number;
    design_name: string;
    service_id?: number;
    business_id?: number;
    specifications?: { attribute_name: string; attribute_value: string }[];
  }) => {
    const res = await api.post<ApiResponse<DesignItem>>("/admin/catalogue/designs", data);
    return res.data;
  },

  updateDesign: async (id: number, data: { design_name: string }) => {
    const res = await api.put<ApiResponse<DesignItem>>(`/admin/catalogue/designs/${id}`, data);
    return res.data;
  },

  deleteDesign: async (id: number) => {
    const res = await api.delete<ApiResponse>(`/admin/catalogue/designs/${id}`);
    return res.data;
  },

  // Specifications
  addSpecification: async (
    designId: number,
    data: { attribute_name?: string; attribute_value?: string; specifications?: { attribute_name: string; attribute_value: string }[] }
  ) => {
    const res = await api.post<ApiResponse<DesignSpecificationItem | DesignSpecificationItem[]>>(
      `/admin/catalogue/designs/${designId}/specifications`,
      data
    );
    return res.data;
  },

  updateSpecification: async (id: number, data: { attribute_name: string; attribute_value: string }) => {
    const res = await api.put<ApiResponse<DesignSpecificationItem>>(`/admin/catalogue/specifications/${id}`, data);
    return res.data;
  },

  deleteSpecification: async (id: number) => {
    const res = await api.delete<ApiResponse>(`/admin/catalogue/specifications/${id}`);
    return res.data;
  },

  // Search
  searchDesigns: async (params: {
    business_id?: number | string;
    service_id?: number;
    service_name?: string;
    category_id?: number;
    q?: string;
    specifications?: Record<string, string>;
    [key: string]: any;
  }) => {
    const res = await api.get<ApiResponse<DesignItem[]> & { count: number; filters: any }>("/admin/catalogue/designs/search", { params });
    return res.data;
  },
};
