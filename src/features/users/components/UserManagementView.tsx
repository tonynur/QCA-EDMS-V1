"use client";

import React, { useState } from "react";
import { UserPlus, Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "QA/QC Manager" | "QA/QC Engineer" | "QC Inspector" | "Viewer";
  status: "Active" | "Inactive";
  lastLogin: string;
}

const INITIAL_USERS: SystemUser[] = [
  {
    id: "USR-001",
    name: "Ahmad Nur Fatony",
    email: "ahmadasuka13@gmail.com",
    role: "Admin",
    status: "Active",
    lastLogin: "Hari ini, 22:15 WIB",
  },
  {
    id: "USR-002",
    name: "Bambang Soedjarwo",
    email: "bambang.qc@asuka.co.id",
    role: "QA/QC Manager",
    status: "Active",
    lastLogin: "Kemarin, 16:40 WIB",
  },
  {
    id: "USR-003",
    name: "Rahmat Hidayat",
    email: "rahmat.site@asuka.co.id",
    role: "QA/QC Engineer",
    status: "Active",
    lastLogin: "12/11/2026, 09:12 WIB",
  },
  {
    id: "USR-004",
    name: "Dwi Cahyono",
    email: "dwi.c@asuka.co.id",
    role: "QC Inspector",
    status: "Active",
    lastLogin: "10/11/2026, 14:05 WIB",
  },
  {
    id: "USR-005",
    name: "Eko Wahyudi",
    email: "eko.w@asuka.co.id",
    role: "QC Inspector",
    status: "Active",
    lastLogin: "08/11/2026, 11:30 WIB",
  },
];

export function UserManagementView() {
  const [users, setUsers] = useState<SystemUser[]>(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "QA/QC Engineer" as SystemUser["role"],
  });

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" }
          : u
      )
    );
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    const newUser: SystemUser = {
      id: `USR-${String(users.length + 1).padStart(3, "0")}`,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      status: "Active",
      lastLogin: "Belum pernah masuk",
    };

    setUsers((prev) => [newUser, ...prev]);
    setIsModalOpen(false);
    setFormData({ name: "", email: "", role: "QA/QC Engineer" });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-[8px] border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Manajemen Pengguna & Hak Akses
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Otoritas akses sistem EDMS, approval dokumen & manajemen inspektor QA/QC PT Asuka Engineering Indonesia
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[6px] bg-[#163d78] hover:bg-[#1a4a91] text-white font-semibold text-xs tracking-wide shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {/* Role Summary Cards — Light Theme */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-[#163d78]">
          <div className="text-[11px] font-semibold uppercase text-slate-500 font-mono">Total Pengguna</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">{users.length}</div>
        </div>
        <div className="bg-white p-3.5 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-sky-600">
          <div className="text-[11px] font-semibold uppercase text-sky-700 font-mono">Administrator</div>
          <div className="text-2xl font-bold font-mono text-sky-700 mt-1 tabular-nums">
            {users.filter((u) => u.role === "Admin").length}
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-emerald-600">
          <div className="text-[11px] font-semibold uppercase text-emerald-700 font-mono">QA/QC Approver</div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
            {users.filter((u) => u.role === "QA/QC Manager" || u.role === "QA/QC Engineer").length}
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-amber-500">
          <div className="text-[11px] font-semibold uppercase text-amber-700 font-mono">Site Inspector</div>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-1 tabular-nums">
            {users.filter((u) => u.role === "QC Inspector").length}
          </div>
        </div>
      </div>

      {/* Search Toolbar — Light Theme */}
      <div className="bg-white p-3 rounded-[8px] border border-slate-200/90 shadow-sm flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pengguna berdasarkan nama, email, atau peran..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-[6px] focus:outline-none focus:border-[#163d78] focus:bg-white text-slate-900 transition-colors"
          />
        </div>
        <span className="text-xs font-mono text-slate-500 tabular-nums">
          Total: <strong className="text-slate-800">{filteredUsers.length}</strong> akun
        </span>
      </div>

      {/* User Table — Light Theme */}
      <div className="bg-white rounded-[8px] border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 w-12 text-center">No</th>
                <th className="py-2.5 px-3">Nama Lengkap</th>
                <th className="py-2.5 px-3">Email Asuka</th>
                <th className="py-2.5 px-3">Peran / Role</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Aktivitas Terakhir</th>
                <th className="py-2.5 px-3 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 bg-white">
              {filteredUsers.map((u, idx) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 text-center font-mono text-slate-400 text-xs tabular-nums">{idx + 1}</td>
                  <td className="py-3 px-3 font-semibold text-slate-900">{u.name}</td>
                  <td className="py-3 px-3 font-mono text-slate-600">{u.email}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-[3px] bg-slate-100 text-slate-800 font-semibold font-mono text-[11px] border border-slate-300">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-[3px] text-[11px] font-semibold ${
                      u.status === "Active"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                        : "bg-slate-100 text-slate-500 border border-slate-300"
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">{u.lastLogin}</td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => handleToggleStatus(u.id)}
                      className="px-2.5 py-1 text-[11px] font-mono rounded-[4px] border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                    >
                      {u.status === "Active" ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-[8px] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold font-mono text-slate-900 uppercase">Tambah Pengguna Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg">×</button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-mono text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Ahmad Nur Fatony"
                  className="w-full bg-slate-50 border border-slate-300 rounded-[6px] p-2 text-slate-900 outline-none focus:border-[#163d78]"
                />
              </div>
              <div>
                <label className="block font-mono text-slate-700 mb-1">Email Asuka / Akun Google</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="nama@asuka.co.id"
                  className="w-full bg-slate-50 border border-slate-300 rounded-[6px] p-2 text-slate-900 outline-none focus:border-[#163d78]"
                />
              </div>
              <div>
                <label className="block font-mono text-slate-700 mb-1">Peran / Hak Akses</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as SystemUser["role"] })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-[6px] p-2 text-slate-900 outline-none focus:border-[#163d78]"
                >
                  <option value="Admin">Admin</option>
                  <option value="QA/QC Manager">QA/QC Manager</option>
                  <option value="QA/QC Engineer">QA/QC Engineer</option>
                  <option value="QC Inspector">QC Inspector</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-[6px] border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-[6px] bg-[#163d78] hover:bg-[#1a4a91] text-white"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
