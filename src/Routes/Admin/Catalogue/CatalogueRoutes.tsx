import type { RouteObject } from "react-router-dom";
import { CatalogueExplorer } from "../../../Pages/Admin/Catalogue/CatalogueExplorer";
import { NichesView } from "../../../Pages/Admin/Catalogue/NichesView";
import { DesignSearch } from "../../../Pages/Admin/Catalogue/DesignSearch";

export const catalogueRoutes: RouteObject[] = [
  {
    path: "catalogue",
    element: <CatalogueExplorer />,
  },
  {
    path: "catalogue/explorer",
    element: <CatalogueExplorer />,
  },
  {
    path: "catalogue/niches",
    element: <NichesView />,
  },
  {
    path: "catalogue/search",
    element: <DesignSearch />,
  },
];
