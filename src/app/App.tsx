import { useLocation, useNavigate } from "react-router";
import { Sidebar } from "./components/Sidebar";
import { Navbar } from "./components/Navbar";
import { Page0Home } from "./components/pages/Page0Home";
import { Page1Overview } from "./components/pages/Page1Overview";
import { Page2Company } from "./components/pages/Page2Company";
import { Page3Ammo } from "./components/pages/Page3Ammo";
import { Page4Recipients } from "./components/pages/Page4Recipients";
import { Page5Permits } from "./components/pages/Page5Permits";
import { PageOperator } from "./components/pages/PageOperator";
import { PageRequestA6 } from "./components/pages/PageRequestA6";
import { PageRequestA4 } from "./components/pages/PageRequestA4";
import { PageRequestA9 } from "./components/pages/PageRequestA9";
import { PageRequestA14 } from "./components/pages/PageRequestA14";
import { PageRequestA15 } from "./components/pages/PageRequestA15";

const PATH_TO_PAGE: Record<string, number> = {
  "/":             0,
  "/dashboard/1":  1,
  "/dashboard/2":  2,
  "/dashboard/3":  3,
  "/dashboard/4":  4,
  "/dashboard/5":  5,
  "/operator":     10,
  "/request/a6":   20,
  "/request/a4":   21,
  "/request/a9":   22,
  "/request/a14":  23,
  "/request/a15":  24,
};

const PAGE_TO_PATH: Record<number, string> = Object.fromEntries(
  Object.entries(PATH_TO_PAGE).map(([p, id]) => [id, p])
);

export default function App() {
  /* MARKER-MAKE-KIT-INVOKED */
  const location = useLocation();
  const navigate = useNavigate();

  const activePage = PATH_TO_PAGE[location.pathname] ?? 0;

  const handlePageChange = (page: number) => {
    const path = PAGE_TO_PATH[page] ?? "/";
    navigate(path);
  };

  const pages: Record<number, React.ReactNode> = {
    0:  <Page0Home onNavigate={handlePageChange} />,
    10: <PageOperator />,
    20: <PageRequestA6 />,
    21: <PageRequestA4 />,
    22: <PageRequestA9 />,
    23: <PageRequestA14 />,
    24: <PageRequestA15 />,
    1:  <Page1Overview />,
    2:  <Page2Company />,
    3:  <Page3Ammo />,
    4:  <Page4Recipients />,
    5:  <Page5Permits />,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "'Noto Sans Thai', Inter, sans-serif", overflow: "hidden" }}>
      <Navbar />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar activePage={activePage} onPageChange={handlePageChange} />
        <main style={{ flex: 1, background: "#F8F9FA", overflowY: "auto", padding: "20px" }}>
          {pages[activePage] ?? pages[0]}
        </main>
      </div>
    </div>
  );
}
