import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Navbar } from "./components/Navbar";
import { Page0Home } from "./components/pages/Page0Home";
import { Page1Overview } from "./components/pages/Page1Overview";
import { Page2Company } from "./components/pages/Page2Company";
import { Page3Ammo } from "./components/pages/Page3Ammo";
import { Page4Recipients } from "./components/pages/Page4Recipients";
import { Page5Permits } from "./components/pages/Page5Permits";

export default function App() {
  /* MARKER-MAKE-KIT-INVOKED */
  const [activePage, setActivePage] = useState(0);

  const pages: Record<number, React.ReactNode> = {
    0: <Page0Home onNavigate={setActivePage} />,
    1: <Page1Overview />,
    2: <Page2Company />,
    3: <Page3Ammo />,
    4: <Page4Recipients />,
    5: <Page5Permits />,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "Inter, 'Noto Sans Thai', sans-serif", overflow: "hidden" }}>
      {/* Top navbar */}
      <Navbar />

      {/* Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <Sidebar activePage={activePage} onPageChange={setActivePage} />

        {/* Main content */}
        <main
          style={{ flex: 1, background: "#F4F6FB", overflowY: "auto", padding: "18px 22px" }}
        >
          {pages[activePage]}
        </main>
      </div>
    </div>
  );
}
