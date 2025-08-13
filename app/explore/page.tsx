import Image from "next/image";
import Link from "next/link";

export default function ExplorePage() {
  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Intro Section */}
      <section className="bg-red-700 text-white text-center py-12 px-4">
        <h1 className="text-4xl font-bold mb-4">Explore Chinese Cuisine</h1>
        <p className="max-w-3xl mx-auto text-lg">
          Chinese cuisine is more than just food — it’s a living history,
          a celebration of diverse regions, and a story of cultural exchange.
          From ancient dynasties to the fusion flavors found in America today,
          let’s explore the traditions, specialties, and transformations that
          have made Chinese food a global favorite.
        </p>
      </section>

      {/* Explore Grid */}
      <main className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* History */}
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
                  Discover the origins, dynasties, and traditions behind the
                  world’s oldest continuous cuisine.
                </p>
              </div>
            </div>
          </Link>

          {/* Regional Specialties */}
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
                  Taste the variety — from fiery Sichuan to delicate Cantonese,
                  each region has its own story.
                </p>
              </div>
            </div>
          </Link>

          {/* American Chinese */}
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
                  From chop suey to General Tso’s chicken — explore how Chinese
                  food transformed in America.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
