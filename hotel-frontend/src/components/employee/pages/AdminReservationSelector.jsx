// src/components/employee/pages/AdminReservationSelector.jsx
import React, { useState } from "react";
import AdminRoomReservation from "./AdminReservation";
import AdminSpaReservation from "./AdminSpaReservation";

export default function AdminReservationSelector() {
  const [mode, setMode] = useState(null); // "room" | "spa" | null

  if (mode === "room") {
    return <AdminRoomReservation onBack={() => setMode(null)} />;
  }

  if (mode === "spa") {
    return <AdminSpaReservation onBack={() => setMode(null)} />;
  }

  return (
    <div className="p-8 text-slate-100">
      <h1 className="text-3xl font-bold mb-6">Wybierz typ operacji</h1>
      <p className="text-sm text-slate-400 mb-10">
        Utwórz nową rezerwację pokoju lub SPA dla gościa.
      </p>

      <div className="mx-auto grid max-w-3xl grid-cols-1 md:grid-cols-2 gap-8">
        {/* POKÓJ */}
        <button
          onClick={() => setMode("room")}
          className="bg-slate-800 border border-slate-700 rounded-xl p-10
                     hover:bg-slate-700 transition
                     flex flex-col items-center justify-center text-center"
        >
          <span className="text-5xl mb-4">🛏</span>
          <h2 className="text-xl font-semibold mb-2">Rezerwacja pokoju</h2>
          <p className="text-sm text-slate-400">
            Utwórz nową rezerwację dla gościa – pokój, daty i dane pobytu.
          </p>
        </button>

        {/* SPA */}
        <button
          onClick={() => setMode("spa")}
          className="bg-slate-800 border border-slate-700 rounded-xl p-10
                     hover:bg-slate-700 transition
                     flex flex-col items-center justify-center text-center"
        >
          <span className="text-5xl mb-4">💆</span>
          <h2 className="text-xl font-semibold mb-2">Rezerwacja SPA</h2>
          <p className="text-sm text-slate-400">
            Zarezerwuj masaż, zabieg lub pakiet SPA dla gościa.
          </p>
        </button>
      </div>
    </div>
  );
}
