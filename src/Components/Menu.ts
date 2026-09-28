import {
  Home,
  Users,
  Settings,
  ShoppingCart,
  FileText,
  UsersRound,
  UserPlus,
  Building,
  Layers,
  BarChart3,
  Tag,
  List,
  Plus,
  MessageSquare,
  Bot,
} from "lucide-react";

export type Role = "admin" | "subadmin" | "department";

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
      name: "Masters",
      icon: Building,
      children: [
        {
          name: "Location",
          icon: Layers,
          path: "/dashboard/locations",
        },
      ],
    },

    {
      name: "Category",
      icon: Tag,
      children: [
        {
          name: "View Categories",
          icon: List,
          path: "/dashboard/category",
        },
        {
          name: "Add Category",
          icon: Plus,
          path: "/dashboard/category/add",
        },
      ],
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
      name: "Attributes",
      icon: BarChart3,
      children: [
        {
          name: "View Attributes",
          icon: List,
          path: "/dashboard/attributes",
        },
        {
          name: "Add Attribute",
          icon: Plus,
          path: "/dashboard/attributes/add",
        },
        {
          name: "View Fields",
          icon: List,
          path: "/dashboard/attribute-fields",
        },
        {
          name: "Add Field",
          icon: Plus,
          path: "/dashboard/attribute-fields/add",
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
      ],
    },
  ],

  subadmin: [
    {
      name: "Home",
      icon: Home,
      path: "/dashboard/subadmin",
    },
    {
      name: "Users",
      icon: Users,
      children: [
        {
          name: "All Users",
          icon: Users,
          path: "/dashboard/subadmin/users",
        },
      ],
    },
    {
      name: "Orders",
      icon: ShoppingCart,
      path: "/dashboard/subadmin/orders",
    },
  ],

  department: [
    {
      name: "Home",
      icon: Home,
      path: "/dashboard/department",
    },

    {
      name: "Add Agent",
      icon: UserPlus,
      path: "/dashboard/add-agent",
    },

    {
      name: "View Agent Profile",
      icon: UserPlus,
      path: "/dashboard/agent-profile",
    },

    {
      name: "All Agents",
      icon: Users,
      path: "/dashboard/total-agents",
    },

    {
      name: "All Workers",
      icon: UsersRound,
      path: "/dashboard/total-workers",
    },

    {
      name: "All Transactions",
      icon: FileText,
      path: "/dashboard/total-transactions",
    },
  ],
};