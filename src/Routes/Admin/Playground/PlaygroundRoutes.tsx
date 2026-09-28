import { Outlet } from "react-router-dom";
import { Playground } from "../../../Pages/Admin/Playground/Playground";
import { CreateCampaign } from "../../../Pages/Admin/Playground/CreateCampaign/CreateCampaign";

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
    ],
  },
];
