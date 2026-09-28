import { Outlet } from "react-router-dom";
import { CategoryAdd } from "../../../Pages/Admin/Category/Add/CategoryAdd";
import { CategoryView } from "../../../Pages/Admin/Category/View/CategoryView";


export const categoryRoutes = [
  {
    element: <Outlet />,
    children: [
      {
        path: "category",
        children: [
          {
            index: true,
            element: <CategoryView />,
          },
          {
            path: "add",
            element: <CategoryAdd />,
          },
        ],
      },
    ],
  },
];
