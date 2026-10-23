import {
  Home,
  Settings,
  ShoppingCart,
  Building,
  List,
  Plus,
  MessageSquare,
  Bot,
  FolderTree,
  Layers,
  Search,
} from "lucide-react";
import type { Role } from "../Context/AuthContextValue";

export type MenuItem = {
  name: string;
  icon: React.ElementType;
  path?: string;
  children?: {
    name: string;
    path?: string;
    icon: React.ElementType;
  }[];
};

export const menus: Record<Role, MenuItem[]> = {
  admin: [
    {
      name: "Dashboard",
      icon: Home,
      path: "/dashboard",
    },

    {
      name: "Playground",
      icon: Bot,
      children: [
        {
          name: "Chat",
          icon: MessageSquare,
          path: "/dashboard/playground",
        },
        {
          name: "Create Campaign",
          icon: Plus,
          path: "/dashboard/playground/create-campaign",
        },
        {
          name: "View Campaigns",
          icon: List,
          path: "/dashboard/playground/view-campaigns",
        }
      ]
    },

    {
      name: "Services",
      icon: ShoppingCart,
      children: [
        {
          name: "View Services",
          icon: List,
          path: "/dashboard/service",
        },
        {
          name: "Add Service",
          icon: Plus,
          path: "/dashboard/service/add",
        },
      ],
    },

    {
      name: "AI Contexts",
      icon: MessageSquare,
      children: [
        {
          name: "View Contexts",
          icon: List,
          path: "/dashboard/ai-contexts",
        },
        {
          name: "Add Context",
          icon: Plus,
          path: "/dashboard/ai-contexts/add",
        },
      ],
    },

    {
      name: "Businesses",
      icon: Building,
      children: [
        {
          name: "View Businesses",
          icon: List,
          path: "/dashboard/businesses",
        },
        {
          name: "Add Business",
          icon: Plus,
          path: "/dashboard/businesses/add",
        },
        {
          name: "Add Qualification",
          icon: Settings,
          path: "/dashboard/lead-qualification",
        },
        {
          name: "View Qualifications",
          icon: List,
          path: "/dashboard/lead-qualification/view",
        },
      ],
    },

    {
      name: "Catalogue",
      icon: FolderTree,
      children: [
        {
          name: "Explorer & Studio",
          icon: FolderTree,
          path: "/dashboard/catalogue",
        },
        {
          name: "Manage Niches",
          icon: Layers,
          path: "/dashboard/catalogue/niches",
        },
        {
          name: "Spec Search",
          icon: Search,
          path: "/dashboard/catalogue/search",
        },
      ],
    },
  ],

  subadmin: [
    {
      name: "Dashboard",
      icon: Home,
      path: "/dashboard",
    },
  ],

  department: [
    {
      name: "Dashboard",
      icon: Home,
      path: "/dashboard",
    },
  ],
};