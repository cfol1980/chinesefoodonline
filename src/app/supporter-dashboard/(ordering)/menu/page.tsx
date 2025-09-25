'use client';

import { useEffect, useState, useMemo } from "react";
import { auth, db } from "@/lib/firebase"; // Your client-side Firebase config
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  query,
  onSnapshot,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";

// --- Type Definition for a Menu Item ---
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isAvailable: boolean;
  createdAt?: Timestamp;
}

// --- Translations for the Menu Page ---
const translations = {
  en: {
    title: "Menu Management",
    loading: "Loading menu...",
    noItems: "No menu items found. Click 'Add New Item' to get started!",
    addNewItem: "+ Add New Item",
    editItem: "Edit Menu Item",
    category: "Category",
    price: "Price",
    description: "Description",
    name: "Item Name",
    available: "Available",
    save: "Save Changes",
    delete: "Delete",
    edit: "Edit",
    confirmDelete: "Are you sure you want to delete this item?",
    errorFetching: "Could not load user data. Please try again.",
  },
  zh: {
    title: "菜单管理",
    loading: "菜单加载中...",
    noItems: "未找到菜单项。点击“添加新菜单项”开始！",
    addNewItem: "+ 添加新菜单项",
    editItem: "编辑菜单项",
    category: "类别",
    price: "价格",
    description: "描述",
    name: "餐品名称",
    available: "上架",
    save: "保存更改",
    delete: "删除",
    edit: "编辑",
    confirmDelete: "您确定要删除此餐品吗？",
    errorFetching: "无法加载用户数据，请重试。",
  },
};

export default function MenuPage() {
  // --- State Management ---
  const [user, setUser] = useState<User | null>(null);
  const [supporterId, setSupporterId] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<MenuItem> | null>(null);
  const [lang, setLang] = useState<"en" | "zh">("en");

  // --- Localization ---
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      const browserLang = navigator.language || navigator.languages?.[0] || "en";
      if (browserLang.toLowerCase().startsWith("zh")) setLang("zh");
    }
  }, []);
  const t = (key: keyof typeof translations["en"]) => translations[lang][key];

  // --- Data Fetching and Real-time Updates ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().ownedSupporterId?.[0]) {
          const id = userDoc.data().ownedSupporterId[0];
          setSupporterId(id);
        } else {
          setLoading(false);
          console.error("Supporter ID not found for user.");
        }
      } else {
        setUser(null);
        setSupporterId(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!supporterId) return;

    const menuCollectionRef = collection(db, "supporters", supporterId, "menu");
    const q = query(menuCollectionRef);

    const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as MenuItem)
      );
      setMenuItems(items);
      setLoading(false);
    });

    return () => unsubscribeSnapshot();
  }, [supporterId]);

  // --- Group items by category for display ---
  const groupedMenu = useMemo(() => {
    return menuItems.reduce((acc, item) => {
      const category = item.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);
  }, [menuItems]);

  // --- CRUD Handlers ---
  const handleOpenModal = (item: Partial<MenuItem> | null = null) => {
    setCurrentItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
  };

  const handleSaveItem = async (itemData: Omit<MenuItem, "id">) => {
    if (!supporterId) return;
    const menuCollectionRef = collection(db, "supporters", supporterId, "menu");

    if (currentItem?.id) {
      // Update existing item
      const itemDocRef = doc(db, "supporters", supporterId, "menu", currentItem.id);
      await updateDoc(itemDocRef, itemData);
    } else {
      // Add new item
      await addDoc(menuCollectionRef, { ...itemData, createdAt: Timestamp.now() });
    }
    handleCloseModal();
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!supporterId) return;
    if (window.confirm(t("confirmDelete"))) {
      const itemDocRef = doc(db, "supporters", supporterId, "menu", itemId);
      await deleteDoc(itemDocRef);
    }
  };

  // --- Render Logic ---
  if (loading) {
    return <div className="text-center p-8">{t("loading")}</div>;
  }
  
  if (!supporterId) {
    return <div className="text-center text-red-500 p-8">{t("errorFetching")}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t("addNewItem")}
        </button>
      </div>

      {menuItems.length === 0 ? (
        <p className="text-center text-gray-500 p-8 bg-white rounded-lg shadow-md">{t("noItems")}</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedMenu).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-xl font-semibold mb-3 border-b pb-2">{category}</h2>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center">
                    <div>
                      <p className="font-bold">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">${item.price.toFixed(2)}</span>
                      <button onClick={() => handleOpenModal(item)} className="text-blue-600 hover:underline">{t("edit")}</button>
                      <button onClick={() => handleDeleteItem(item.id)} className="text-red-600 hover:underline">{t("delete")}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- Add/Edit Modal --- */}
      {isModalOpen && (
        <MenuItemForm
          item={currentItem}
          onSave={handleSaveItem}
          onClose={handleCloseModal}
          t={t}
        />
      )}
    </div>
  );
}

// --- Form Component (can be in a separate file) ---

// Define the types for the component's props
type MenuItemFormProps = {
    item: Partial<MenuItem> | null;
    onSave: (data: Omit<MenuItem, "id">) => void;
    onClose: () => void;
    t: (key: keyof typeof translations["en"]) => string;
  };
  
  function MenuItemForm({ item, onSave, onClose, t }: MenuItemFormProps) {
    const [formData, setFormData] = useState({
      name: item?.name || "",
      description: item?.description || "",
      price: item?.price || 0,
      category: item?.category || "",
      isAvailable: item?.isAvailable !== false, // Default to true
    });
  
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      const isCheckbox = type === 'checkbox';
      const isNumber = type === 'number';
  
      // Assert target is HTMLInputElement for checkbox 'checked' property
      const checked = isCheckbox ? (e.target as HTMLInputElement).checked : undefined;
  
      setFormData((prev) => ({
        ...prev,
        [name]: isCheckbox ? checked : isNumber ? parseFloat(value) : value,
      }));
    };
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
    };
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6">{item?.id ? t("editItem") : t("addNewItem")}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-semibold">{t("name")}</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-md" required />
            </div>
            <div>
              <label className="block font-semibold">{t("description")}</label>
              <textarea name="description" value={formData.description} onChange={handleChange} className="w-full p-2 border rounded-md"></textarea>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block font-semibold">{t("price")}</label>
                <input type="number" name="price" value={formData.price} onChange={handleChange} step="0.01" className="w-full p-2 border rounded-md" required />
              </div>
              <div className="flex-1">
                <label className="block font-semibold">{t("category")}</label>
                <input type="text" name="category" value={formData.category} onChange={handleChange} className="w-full p-2 border rounded-md" placeholder="e.g., Appetizers" required />
              </div>
            </div>
             <div>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="isAvailable" checked={formData.isAvailable} onChange={handleChange} />
                {t("available")}
              </label>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button type="button" onClick={onClose} className="bg-gray-300 py-2 px-4 rounded-lg hover:bg-gray-400">Cancel</button>
              <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700">{t("save")}</button>
            </div>
          </form>
        </div>
      </div>
    );
  }