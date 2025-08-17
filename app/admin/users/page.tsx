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
  role: string;
  ownedSupporterId?: string;
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
      // you can fetch role here for a real check:
      setUserIsAdmin(true);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    async function fetchUsers() {
      const qs = await getDocs(collection(db, "users"));
      const list = qs.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as UserDoc[];
      setUsers(list);
      setLoading(false);
    }

    if (userIsAdmin) fetchUsers();
  }, [userIsAdmin]);

  const handleRoleUpdate = async (id: string, newRole: string) => {
    await updateDoc(doc(db, "users", id), { role: newRole });
    alert("Role updated!");
  };

  if (!userIsAdmin) return null;
  if (loading) return <div className="p-6">Loading users...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Users</h1>

      <table className="min-w-full bg-white rounded shadow">
        <thead>
          <tr className="bg-gray-200">
            <th className="py-2 px-4 text-left">Email</th>
            <th className="py-2 px-4 text-left">Role</th>
            <th className="py-2 px-4">Owned Supporter ID</th>
            <th className="py-2 px-4"></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="py-2 px-4">{u.email}</td>
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
              <td className="py-2 px-4 text-center">
                {u.ownedSupporterId || "-"}
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
