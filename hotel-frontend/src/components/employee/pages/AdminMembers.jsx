// src/components/employee/pages/AdminMembers.jsx
import React, { useState,useEffect } from "react";
import { motion } from "framer-motion";
import { useTableSearchSort } from "../hook/useTableSearchSort";



const AdminMembers = () => {
  
 
  const [members, setMembers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    login: "",
    role: "Recepcjonista",
  });

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const { search, setSearch, handleSort, data: sortedData, renderSortIcon } =
    useTableSearchSort({
      data: members,
      searchableFields: ["firstName", "lastName", "login", "role"],
      defaultSortKey: "lastName",
      defaultSortDirection: "asc",
    });
     useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('http://localhost:3000/users/list');
        const data = await response.json();
        setMembers(data);
      } catch (error) {
        console.error("Błąd podczas pobierania listy użytkowników:", error);
      } 
    };

    fetchMembers();
  }, []);


  const openModal = () => {
    setError("");
    setForm({ firstName: "", lastName: "", login: "", role: "Recepcjonista" });
    setPassword("");
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError("");
  };

  const handleSave = (e) => {
    setError("");
    e.preventDefault();
    try {
      const response = fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },  
        body: JSON.stringify({
          imie: form.firstName,
          nazwisko: form.lastName,
          login: form.login,
          password: password,
          stanowisko: form.role
        })
      });
      addMember();
    } catch (err) {
      setError("Wystąpił błąd podczas dodawania użytkownika.");
    } 

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const login = form.login.trim();

    if (!firstName || !lastName) {
      setError("Podaj imię i nazwisko.");
      return;
    }
    if (!login) {
      setError("Podaj login.");
      return;
    }
    if (members.some((m) => m.login.toLowerCase() === login.toLowerCase())) {
      setError("Login jest już zajęty.");
      return;
    }
    if (password.length < 8) {
      setError("Hasło musi mieć minimum 8 znaków.");
      return;
    }

    const nextId = members.length ? Math.max(...members.map((m) => m.id)) + 1 : 1;

    const newMember = {
      id: nextId,
      firstName,
      lastName,
      login,
      role: form.role,
      password,
    };

    setMembers((prev) => [...prev, newMember]);
    setIsModalOpen(false);
  };

  const roleBadgeClass = (role) => {
    if (role === "Admin") return "bg-red-500/15 text-red-400 border border-red-500/20";
    if (role === "Recepcjonista") return "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20";
    return "bg-slate-700/60 text-slate-200 border border-slate-600/40";
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Członkowie</h1>
          <p className="text-sm text-slate-400">Lista użytkowników systemu.</p>
        </div>

        <button
          onClick={openModal}
          className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-sm font-medium text-white transition"
        >
          + Dodaj użytkownika
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-sm">
        <input
          type="text"
          placeholder="Szukaj po imieniu, nazwisku, loginie lub typie..."
          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800/60">
        <table className="min-w-full text-sm table-fixed">
          <thead className="bg-slate-800 text-slate-300">
            <tr>
              <th className="px-4 py-3 text-left w-[28%]">
                <button
                  type="button"
                  onClick={() => handleSort("firstName")}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  Imię {renderSortIcon("firstName")}
                </button>
              </th>

              <th className="px-4 py-3 text-left w-[32%]">
                <button
                  type="button"
                  onClick={() => handleSort("lastName")}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  Nazwisko {renderSortIcon("lastName")}
                </button>
              </th>

              <th className="px-4 py-3 text-left w-[22%]">
                <button
                  type="button"
                  onClick={() => handleSort("login")}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  Login {renderSortIcon("login")}
                </button>
              </th>

              <th className="px-4 py-3 text-center w-[18%]">
                <button
                  type="button"
                  onClick={() => handleSort("role")}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  Typ {renderSortIcon("role")}
                </button>
              </th>
            </tr>
          </thead>

          <tbody>
            {sortedData.length ? (
              sortedData.map((m) => (
                <tr
                  key={m.id}
                  className="border-t border-slate-700/60 hover:bg-slate-800/70 transition"
                >
                  <td className="px-4 py-3 text-left text-slate-100 truncate">
                    {m.firstName}
                  </td>
                  <td className="px-4 py-3 text-left text-slate-100 truncate">
                    {m.lastName}
                  </td>
                  <td className="px-4 py-3 text-left text-slate-300 truncate">
                    {m.login}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium ${roleBadgeClass(
                        m.role
                      )}`}
                    >
                      {m.role}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="border-t border-slate-700/60">
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400 italic">
                  Brak wyników.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="bg-slate-800 p-6 rounded-xl w-full max-w-md shadow-xl border border-slate-700"
          >
            <h2 className="text-xl font-semibold mb-4">Dodaj użytkownika</h2>

            {error && (
              <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}

            <input
              type="text"
              placeholder="Imię"
              className="w-full p-3 rounded bg-slate-700 placeholder-slate-400 text-white mb-3"
              value={form.firstName}
              onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
            />

            <input
              type="text"
              placeholder="Nazwisko"
              className="w-full p-3 rounded bg-slate-700 placeholder-slate-400 text-white mb-3"
              value={form.lastName}
              onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
            />

            <input
              type="text"
              placeholder="Login"
              className="w-full p-3 rounded bg-slate-700 placeholder-slate-400 text-white mb-3"
              value={form.login}
              onChange={(e) => setForm((p) => ({ ...p, login: e.target.value }))}
            />

            <select
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              className="w-full p-3 rounded bg-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
            >
              <option value="Recepcjonista">Recepcjonista</option>
              <option value="Admin">Admin</option>
            </select>

            {/* Password */}
            <div className="mb-4">
              <label className="block text-sm mb-1 text-slate-300">Hasło</label>
              <div className="flex gap-2">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 znaków"
                  className="w-full p-3 rounded bg-slate-700 placeholder-slate-400 text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="px-3 rounded bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm"
                  title={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
                >
                  {showPassword ? "Ukryj" : "Pokaż"}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Demo (frontend). W realnym systemie hasło powinno być obsłużone po stronie backendu.
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 transition"
              >
                Anuluj
              </button>

              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 transition text-white"
              >
                Zapisz
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
};

export default AdminMembers;
