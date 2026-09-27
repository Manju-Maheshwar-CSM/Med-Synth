import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { Summarize } from "@/pages/Summarize";
import { Literature } from "@/pages/Literature";
import { Compare } from "@/pages/Compare";
import { Quality } from "@/pages/Quality";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="summarize" element={<Summarize />} />
          <Route path="literature" element={<Literature />} />
          <Route path="compare" element={<Compare />} />
          <Route path="quality" element={<Quality />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
