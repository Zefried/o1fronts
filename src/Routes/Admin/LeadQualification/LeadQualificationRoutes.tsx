import { Outlet } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import { LeadQualification } from "../../../Pages/Admin/LeadQualification/LeadQualification";
import { ViewLeadQualification } from "../../../Pages/Admin/LeadQualification/ViewLeadQualification";

export const leadQualificationRoutes: RouteObject[] = [
  {
    element: <Outlet />,
    children: [
      {
        path: "lead-qualification",
        children: [
          {
            index: true,
            element: <LeadQualification />,
          },
          {
            path: "view",
            element: <ViewLeadQualification />,
          },
        ],
      },
    ],
  },
];
