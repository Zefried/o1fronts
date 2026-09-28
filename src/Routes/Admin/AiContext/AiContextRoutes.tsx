import { Outlet } from "react-router-dom";
import { AiContextView } from "../../../Pages/Admin/AiContext/View/AiContextView";
import { AiContextAdd } from "../../../Pages/Admin/AiContext/Add/AiContextAdd";

export const aiContextRoutes = [
  {
    element: <Outlet />,
    children: [
      {
        path: "ai-contexts",
        children: [
          {
            index: true,
            element: <AiContextView />,
          },
          {
            path: "add",
            element: <AiContextAdd />,
          },
        ],
      },
    ],
  },
];
