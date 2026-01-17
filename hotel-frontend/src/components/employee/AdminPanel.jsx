// src/components/employee/AdminPanel.jsx
import React, { useState } from "react";
import AdminReservationSelector from "./pages/AdminReservationSelector";
import AdminRoomCleaning from "./pages/AdminRoomCleaning";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRooms from "./pages/AdminRooms";
import AdminMembers from "./pages/AdminMembers";
import AdminSidebar from "./pages/AdminSideBar";
import AdminReservationsList from "./pages/AdminListReservation";
import AdminMeelList from "./pages/AdminSPAList"

const AdminPanel = () => {
  const [selected, setSelected] = useState("DashBoard");

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900">
      <AdminSidebar selected={selected} setSelected={setSelected} />

      {/* CONTENT WRAPPER */}
      <div className="flex-1 min-w-0">
        <ExampleContent selected={selected} setSelected={setSelected} />
      </div>
    </div>
  );
};

const ExampleContent = ({ selected, setSelected }) => (
  <div className="h-full min-w-0 overflow-y-auto p-8 text-slate-100">
    {selected === "Rezerwacja" && <AdminReservationSelector />}
    {selected === "DashBoard" && <AdminDashboard setSelected={setSelected} />}
    {selected === "Sprzątanie" && <AdminRoomCleaning />}
    {selected === "Lista pokoi" && <AdminRooms />}
    {selected === "Członkowie" && <AdminMembers />}
    {selected === "Lista rezerwacji" && <AdminReservationsList />}
    {selected === "Rezerwacje SPA" && <AdminMeelList />}
  </div>
);

export default AdminPanel;
