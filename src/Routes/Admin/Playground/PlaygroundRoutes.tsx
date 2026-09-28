import { Outlet } from "react-router-dom";
import { Playground } from "../../../Pages/Admin/Playground/Playground";
import { CreateCampaign } from "../../../Pages/Admin/Playground/CreateCampaign/CreateCampaign";
import { ViewCampaign } from "../../../Pages/Admin/Playground/ViewCampaign/ViewCampaign";

export const playgroundRoutes = [
  {
    element: <Outlet />,
    children: [
      {
        path: "playground",
        element: <Playground />,
      },
      {
        path: "playground/create-campaign",
        element: <CreateCampaign />,
      },
      {
        path: "playground/view-campaigns",
        element: <ViewCampaign />,
      },
    ],
  },
];
