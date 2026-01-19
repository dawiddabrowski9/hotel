// src/components/employee/pages/AdminMembers.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTableSearchSort } from "../hook/useTableSearchSort";

const API_BASE = "http://localhost:3000";

const AdminMembers = () => {
  const [members, setMembers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // add | edit
  const [mode, setMode] = useState("add");
  const [selectedMember, setSelectedMember] = useState(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    login: "",
    role: "Recepcjonista",
  });

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // --- Fetch list (backend optional) ---
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch(`${API_BASE}/users/list`);
        const data = await res.json();

        // Normalizacja na wypadek różnych nazw pól
        const normalized = Array.isArray(data)
          ? data.map((u) => ({
              id: u.id ?? u.id_pracownik ?? u._id ?? Math.random(),
              firstName: u.firstName ?? u.imie ?? "",
              lastName: u.lastName ?? u.nazwisko ?? "",
              login: u.login ?? "",
              role: u.role ?? u.stanowisko ?? "Recepcjonista",
            }))
          : [];

        setMembers(normalized);
      } catch (e) {
        // backend może nie działać — UI nadal działa na state
        console.warn("Nie udało się pobrać users/list:", e);
      }
    };
    fetchMembers();
  }, []);

  const { search, setSearch, handleSort, data: sortedData, renderSortIcon } =
    useTableSearchSort({
      data: members,
      searchableFields: ["firstName", "lastName", "login", "role"],
      defaultSortKey: "lastName",
      defaultSortDirection: "asc",
    });

  const roleBadgeClass = (role) => {
    if (role === "Admin") return "bg-red-500/15 text-red-400 border border-red-500/20";
    if (role === "Recepcjonista")
      return "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20";
    return "bg-slate-700/60 text-slate-200 border border-slate-600/40";
  };

  const resetForm = () => {
    setForm({ firstName: "", lastName: "", login: "", role: "Recepcjonista" });
    setPassword("");
    setShowPassword(false);
    setError("");
  };

  const openAddModal = () => {
    setMode("add");
    setSelectedMember(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (member) => {
    setMode("edit");
    setSelectedMember(member);
    setError("");
    setForm({
      firstName: member.firstName || "",
      lastName: member.lastName || "",
      login: member.login || "",
      role: member.role || "Recepcjonista",
    });
    setPassword(""); // w edycji hasło opcjonalne
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMember(null);
    setError("");
  };

  const trimmed = useMemo(() => {
    return {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      login: form.login.trim(),
    };
  }, [form.firstName, form.lastName, form.login]);

  const isLoginTaken = (login) => {
    const target = login.toLowerCase();
    return members.some((m) => {
      const sameLogin = (m.login || "").toLowerCase() === target;
      const notSelf = mode === "edit" ? m.id !== selectedMember?.id : true;
      return sameLogin && notSelf;
    });
  };

  const validate = () => {
    if (!trimmed.firstName || !trimmed.lastName) {
      setError("Podaj imię i nazwisko.");
      return false;
    }
    if (!trimmed.login) {
      setError("Podaj login.");
      return false;
    }
    if (isLoginTaken(trimmed.login)) {
      setError("Login jest już zajęty.");
      return false;
    }

    if (mode === "add") {
      if (password.length < 8) {
        setError("Hasło musi mieć minimum 8 znaków.");
        return false;
      }
    } else {

      if (password.length > 0 && password.length < 8) {
        setError("Jeśli zmieniasz hasło, musi mieć minimum 8 znaków.");
        return false;
      }
    }
    return true;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    if (mode === "add") {

      const nextId = members.length
        ? Math.max(...members.map((m) => Number(m.id) || 0)) + 1
        : 1;

      const newMember = {
        id: nextId,
        firstName: trimmed.firstName,
        lastName: trimmed.lastName,
        login: trimmed.login,
        role: form.role,
      };

      setMembers((prev) => [...prev, newMember]);
      setIsModalOpen(false);

      try {
        await fetch(`${API_BASE}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imie: trimmed.firstName,
            nazwisko: trimmed.lastName,
            login: trimmed.login,
            stanowisko: form.role,
            password,
          }),
        });
      } catch (_) {}

      return;
    }

    // mode === edit
    if (!selectedMember) return;

    const updatedMember = {
      ...selectedMember,
      firstName: trimmed.firstName,
      lastName: trimmed.lastName,
      login: trimmed.login,
      role: form.role,
    };


    setMembers((prev) => prev.map((m) => (m.id === selectedMember.id ? updatedMember : m)));
    setIsModalOpen(false);
    setSelectedMember(null);


    try {
      await fetch(`${API_BASE}/users/update/${selectedMember.id}`, {
        method: "PUT", // albo PATCH
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imie: trimmed.firstName,
          nazwisko: trimmed.lastName,
          login: trimmed.login,
          stanowisko: form.role,
          ...(password ? { password } : {}),
        }),
      });
    } catch (_) {}
  };

  const handleDelete = async () => {
    if (!selectedMember) return;


    setMembers((prev) => prev.filter((m) => m.id !== selectedMember.id));
    setIsModalOpen(false);
    setSelectedMember(null);

    try {
      await fetch(`${API_BASE}/users/delete/${selectedMember.id}`, {
        method: "DELETE",
      });
    } catch (_) {}
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Członkowie</h1>
          <p className="text-sm text-slate-400">Kliknij w osobę, aby edytować.</p>
        </div>

        <button
          onClick={openAddModal}
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
                  onClick={() => openEditModal(m)}
                  className="border-t border-slate-700/60 hover:bg-slate-800/70 transition cursor-pointer"
                  title="Kliknij aby edytować"
                >
                  <td className="px-4 py-3 text-left text-slate-100 truncate">{m.firstName}</td>
                  <td className="px-4 py-3 text-left text-slate-100 truncate">{m.lastName}</td>
                  <td className="px-4 py-3 text-left text-slate-300 truncate">{m.login}</td>
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
            <h2 className="text-xl font-semibold mb-4">
              {mode === "add" ? "Dodaj użytkownika" : "Edytuj użytkownika"}
            </h2>

            {error && (
              <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
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
                <label className="block text-sm mb-1 text-slate-300">
                  Hasło{" "}
                  {mode === "edit" ? (
                    <span className="text-slate-400">(opcjonalnie – tylko jeśli chcesz zmienić)</span>
                  ) : null}
                </label>

                <div className="flex gap-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={
                      mode === "edit" ? "Zostaw puste, jeśli bez zmian" : "Minimum 8 znaków"
                    }
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
                  Demo (frontend). Hasło i tak powinno być ogarniane po backendzie.
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                {mode === "edit" && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="mr-auto px-4 py-2 rounded-lg bg-red-500/80 hover:bg-red-500 transition text-white"
                  >
                    Usuń
                  </button>
                )}

                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 transition"
                >
                  Anuluj
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 transition text-white"
                >
                  {mode === "add" ? "Zapisz" : "Zapisz zmiany"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </section>
  );
};

export default AdminMembers;
