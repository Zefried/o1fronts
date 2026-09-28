import { Outlet } from "react-router-dom";
import { Playground } from "../../../Pages/Admin/Playground/Playground";

export const playgroundRoutes = [
  {
    element: <Outlet />,
    children: [
      {
        path: "playground",
        element: <Playground />,
      },
    ],
  },
];
