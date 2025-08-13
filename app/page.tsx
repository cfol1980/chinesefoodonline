'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, limit, query } from "firebase/firestore";

interface Supporter {
  id: string;
  name: string;
  logo: string;
  description?: string;
}

export default function Home() {
  const [supporters, setSupporters] = useState<Supporter[]>([]);

  useEffect(() => {
    const fetchSupporters = async () => {
      try {
        const q = query(collection(db, "supporters"), limit(6));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Supporter[];
        setSupporters(data);
      } catch (err) {
        console.error("Error fetching supporters:", err);
      }
    };
    fetchSupporters();
  }, []);

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Hero / Mission Section */}
      <section className="relative bg-[url('/hero_chinese_food.jpg')] bg-cover bg-center min-h-[50vh] flex items-center justify-center text-center p-4">
        <div className="bg-black bg-opacity-50 p-6 rounded-xl max-w-2xl">
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to ChineseFoodOnline
          </h1>
          <p className="text-lg text-gray-200">
            Introducing authentic Chinese cuisine to America — 
            celebrating its history, preserving its culture, and sharing its diverse flavors.
          </p>
        </div>
      </section>

      {/* Supporters Section */}
      <section className="p-6 bg-green-50">
        <h2 className="text-2xl font-semibold text-center mb-4">Our Supporters</h2>
        <div className="flex flex-wrap justify-center gap-6">
          {supporters.length > 0 ? (
            supporters.map((supporter) => (
              <Link key={supporter.id} href={`/${supporter.id}`} className="block">
                <Image
                  src={supporter.logo || "/placeholder.jpg"}
                  alt={supporter.name}
                  width={200}
                  height={100}
                  priority
                  className="rounded-lg shadow hover:scale-105 transition-transform"
                />
              </Link>
            ))
          ) : (
            <>
              <Link href="/enoodle" className="block">
                <Image
                  src="/enoodle_logo.jpg"
                  alt="E-Noodle Logo"
                  width={200}
                  height={100}
                  priority
                  className="rounded-lg shadow hover:scale-105 transition-transform"
                />
              </Link>
              <Link href="/masterpancakes" className="block">
                <Image
                  src="/masterPancakes_logo.jpg"
                  alt="Master Pancakes Logo"
                  width={200}
                  height={100}
                  priority
                  className="rounded-lg shadow hover:scale-105 transition-transform"
                />
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Explore Cuisine Section */}
     
      <main className="p-6">
        <h2 className="text-2xl font-semibold text-center mb-6">
          Explore Chinese Cuisine
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Link href="/explore/history" className="block">
            <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <Image
                src="/explore_history.png"
                alt="History of Chinese Cuisine"
                width={400}
                height={250}
                className="w-full h-auto"
              />
              <div className="p-4">
                <h3 className="text-lg font-bold">History</h3>
                <p className="text-sm text-gray-600">
                  Discover the origins, dynasties, and traditions behind the world’s oldest continuous cuisine.
                </p>
              </div>
            </div>
          </Link>
          <Link href="/explore/regional" className="block">
            <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <Image
                src="/explore_regional.png"
                alt="Regional Specialties"
                width={400}
                height={250}
                className="w-full h-auto"
              />
              <div className="p-4">
                <h3 className="text-lg font-bold">Regional Specialties</h3>
                <p className="text-sm text-gray-600">
                  Taste the variety — from fiery Sichuan to delicate Cantonese, each region has its own story.
                </p>
              </div>
            </div>
          </Link>
          <Link href="/explore/american-chinese" className="block">
            <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <Image
                src="/explore_american.png"
                alt="American Chinese Food"
                width={400}
                height={250}
                className="w-full h-auto"
              />
              <div className="p-4">
                <h3 className="text-lg font-bold">American Chinese Food</h3>
                <p className="text-sm text-gray-600">
                  From chop suey to General Tso’s chicken — explore how Chinese food transformed in America.
                </p>
              </div>
            </div>
          </Link>

          
        </div>
      </main>

      {/* Explore Cuisine Call-to-Action */}
      <section className="bg-red-600 py-12 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Hungry for More?</h2>
        <p className="text-lg text-white mb-6">
          Dive into the culture, history, and flavors of Chinese cuisine.
        </p>
        <Link
          href="/explore"
          className="bg-white text-red-600 px-6 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100"
        >
          Go to Explore Cuisine
        </Link>
      </section>
    </div>
  );
}
