import { createBrowserRouter, Navigate } from "react-router-dom";
import { DashboardLayout } from "../Layouts/DashboardLayout";
import { Login } from "../Pages/Auth/Login";
import { ProtectedRoute } from "./ProtectedRoutes";
import { Unauthorized } from "../Pages/Auth/Unauthorized";
import { DashboardHome } from "../Pages/Panels/DashboardHome";
import { adminRoutes } from "./Admin/route";
import { testRoutes } from "./Test/TestRoutes";
import { categoryRoutes } from "./Admin/Category/CategoryRoutes";
import { serviceRoutes } from "./Admin/Service/ServiceRoutes";
import { attributeRoutes } from "./Admin/Attributes/AttributeRoutes";
import { aiContextRoutes } from "./Admin/AiContext/AiContextRoutes";
import { playgroundRoutes } from "./Admin/Playground/PlaygroundRoutes";
import { businessRoutes } from "./Admin/Business/BusinessRoutes";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/unauthorized",
    element: <Unauthorized />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["admin", "subadmin"]}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardHome />,
      },
      
      // plug modular routes
      ...adminRoutes,
      ...testRoutes,
      ...categoryRoutes,
      ...serviceRoutes,
      ...attributeRoutes,
      ...aiContextRoutes,
      ...playgroundRoutes,
      ...businessRoutes,
    ],
  },
]);

export default router;