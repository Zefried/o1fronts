import { Outlet } from "react-router-dom";
import { ServiceAdd } from "../../../Pages/Admin/Service/Add/ServiceAdd";
import { ServiceView } from "../../../Pages/Admin/Service/View/ServiceView";

export const serviceRoutes = [
  {
    element: <Outlet />,
    children: [
      {
        path: "service",
        children: [
          {
            index: true,
            element: <ServiceView />,
          },
          {
            path: "add",
            element: <ServiceAdd />,
          },
        ],
      },
    ],
  },
];
