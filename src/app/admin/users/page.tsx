"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UserDoc {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: string;
  ownedSupporterId?: string[];
}

export default function ManageUsersPage() {
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/admin");
        return;
      }
      setUserIsAdmin(true);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    async function fetchUsers() {
      const qs = await getDocs(collection(db, "users"));
      const list = qs.docs.map((d) => {
        const data = d.data();
        let ownedSupporterId: string[] = [];
        if (data.ownedSupporterId) {
          ownedSupporterId = Array.isArray(data.ownedSupporterId)
            ? data.ownedSupporterId
            : [data.ownedSupporterId];
        }
        return {
          id: d.id,
          ...data,
          ownedSupporterId,
        } as UserDoc;
      });
      setUsers(list);
      setLoading(false);
    }

    if (userIsAdmin) fetchUsers();
  }, [userIsAdmin]);

  const handleRoleUpdate = async (id: string, newRole: string) => {
    await updateDoc(doc(db, "users", id), { role: newRole });
    alert("Role updated!");
  };

  const handleSlugUpdate = async (id: string, newSlug: string) => {
    if (!newSlug) return;
    await updateDoc(doc(db, "users", id), { ownedSupporterId: [newSlug] });
    alert("Slug assigned!");
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      await deleteDoc(doc(db, "users", id));
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
  };

  if (!userIsAdmin) return null;
  if (loading) return <div className="p-6">Loading users...</div>;

  // Filter users based on search
  const filteredUsers = users.filter((u) => {
    const searchLower = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower) ||
      u.phone?.toLowerCase().includes(searchLower) ||
      u.ownedSupporterId?.some((id) => id.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Users</h1>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, email, phone, supporter ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded w-full md:w-1/2"
        />
      </div>

      <table className="min-w-full bg-white rounded shadow">
        <thead>
          <tr className="bg-gray-200">
            <th className="py-2 px-4 text-left">Name</th>
            <th className="py-2 px-4 text-left">Email</th>
            <th className="py-2 px-4 text-left">Phone</th>
            <th className="py-2 px-4 text-left">Role</th>
            <th className="py-2 px-4 text-left">Owned Supporter</th>
            <th className="py-2 px-4 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center py-4 text-gray-500">
                No users found.
              </td>
            </tr>
          )}
          {filteredUsers.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="py-2 px-4">{u.name || "-"}</td>
              <td className="py-2 px-4">{u.email}</td>
              <td className="py-2 px-4">{u.phone || "-"}</td>
              <td className="py-2 px-4">
                <select
                  defaultValue={u.role}
                  onChange={(e) => handleRoleUpdate(u.id, e.target.value)}
                  className="border px-2 py-1 rounded"
                >
                  <option value="user">user</option>
                  <option value="supporter">supporter</option>
                  <option value="contributor">contributor</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td className="py-2 px-4">
                {u.ownedSupporterId?.length ? u.ownedSupporterId.join(", ") : "-"}
              </td>
              <td className="py-2 px-4 space-x-2">
                <form
                  className="inline"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const inputValue = (
                      e.currentTarget.querySelector("input") as HTMLInputElement
                    )?.value;
                    if (inputValue) handleSlugUpdate(u.id, inputValue);
                  }}
                >
                  <input
                    type="text"
                    defaultValue={u.ownedSupporterId?.[0] || ""}
                    placeholder="Assign Slug"
                    className="border px-2 py-1 rounded mr-1"
                  />
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                  >
                    Save
                  </button>
                </form>
                <button
                  onClick={() => handleDeleteUser(u.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Link href="/admin" className="mt-6 inline-block text-blue-600">
        ← Back to Admin Dashboard
      </Link>
    </div>
  );
}
