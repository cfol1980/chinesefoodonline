"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UserDoc {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: string;
  ownedSupporterId?: string[]; // make it an array
}

export default function ManageUsersPage() {
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
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
        // Ensure ownedSupporterId is always an array
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

    const userRef = doc(db, "users", id);
    // Save as array (overwrite or create)
    await updateDoc(userRef, { ownedSupporterId: [newSlug] });
    alert("Slug assigned!");
  };

  if (!userIsAdmin) return null;
  if (loading) return <div className="p-6">Loading users...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Users</h1>

      <table className="min-w-full bg-white rounded shadow">
        <thead>
          <tr className="bg-gray-200">
            <th className="py-2 px-4 text-left">Name</th>
            <th className="py-2 px-4 text-left">Email</th>
            <th className="py-2 px-4 text-left">Phone</th>
            <th className="py-2 px-4 text-left">Role</th>
            <th className="py-2 px-4 text-left">Owned Supporter</th>
            <th className="py-2 px-4 text-left">Assign Slug</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
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
                {u.ownedSupporterId && u.ownedSupporterId.length > 0
                  ? u.ownedSupporterId.join(", ")
                  : "-"}
              </td>
              <td className="py-2 px-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const inputValue = (e.currentTarget.querySelector(
                      "input"
                    ) as HTMLInputElement)?.value;
                    if (inputValue) {
                      handleSlugUpdate(u.id, inputValue);
                    }
                  }}
                >
                  <input
                    name="slugInput"
                    type="text"
                    placeholder="e.g. enoodle"
                    defaultValue={u.ownedSupporterId?.[0] || ""}
                    className="border px-2 py-1 rounded mr-2"
                  />
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                  >
                    Save
                  </button>
                </form>
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
