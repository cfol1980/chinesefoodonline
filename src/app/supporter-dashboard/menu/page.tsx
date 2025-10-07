"use client";

import React, { useState } from "react";
import CategoryManager from "./CategoryManager";
import ItemManager from "./ItemManager";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function MenuPage() {
  const [tab, setTab] = useState("categories");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Menu Management</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <CategoryManager />
        </TabsContent>
        <TabsContent value="items">
          <ItemManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
