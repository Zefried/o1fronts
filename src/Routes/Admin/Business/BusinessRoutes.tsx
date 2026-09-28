import { Outlet } from "react-router-dom";
import { ProtectedRoute } from "../../ProtectedRoutes";
import { BusinessView } from "../../../Pages/Admin/Business/View/BusinessView";
import { BusinessAdd } from "../../../Pages/Admin/Business/Add/BusinessAdd";

export const businessRoutes = [
  {
    path: "businesses",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <Outlet />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <BusinessView />,
      },
      {
        path: "add",
        element: <BusinessAdd />,
      },
    ],
  },
];
