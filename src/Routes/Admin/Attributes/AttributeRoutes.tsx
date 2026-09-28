import { Outlet } from "react-router-dom";
import { AttributeAdd } from "../../../Pages/Admin/Attributes/Add/AttributeAdd";
import { AttributeView } from "../../../Pages/Admin/Attributes/View/AttributeView";
import { AttributeFieldAdd } from "../../../Pages/Admin/Attributes/Fields/Add/AttributeFieldAdd";
import { AttributeFieldView } from "../../../Pages/Admin/Attributes/Fields/View/AttributeFieldView";

export const attributeRoutes = [
  {
    element: <Outlet />,
    children: [
      {
        path: "attributes",
        children: [
          {
            index: true,
            element: <AttributeView />,
          },
          {
            path: "add",
            element: <AttributeAdd />,
          },
        ],
      },
      {
        path: "attribute-fields",
        children: [
          {
            index: true,
            element: <AttributeFieldView />,
          },
          {
            path: "add",
            element: <AttributeFieldAdd />,
          },
        ],
      },
    ],
  },
];
