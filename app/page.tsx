import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Header Section */}
      <section className="text-center p-6 bg-white shadow-md">
        <h1 className="text-3xl font-bold mb-2">Welcome to ChineseFoodOnline</h1>
        <p className="mt-2 text-lg text-gray-700">
          Explore the history, culture, and flavors of Chinese cuisine across the U.S.
        </p>
      </section>

      {/* Supporters Section (Above the fold, loads first) */}
      <section className="p-6 bg-green-50">
        <h2 className="text-2xl font-semibold text-center mb-4">Our Supporters</h2>
        <div className="flex flex-wrap justify-center gap-6">
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
        </div>
      </section>

      {/* Featured Categories Section */}
      <main className="p-6">
        <h2 className="text-2xl font-semibold text-center mb-6">
          Learn More About Chinese Food
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Link href="/history" className="block">
            <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <Image
                src="/history.jpg"
                alt="History of Chinese Food"
                width={400}
                height={250}
                className="w-full h-auto"
              />
              <div className="p-4">
                <h3 className="text-lg font-bold">History</h3>
                <p className="text-sm text-gray-600">
                  Discover the rich history of Chinese cuisine.
                </p>
              </div>
            </div>
          </Link>

          <Link href="/culture" className="block">
            <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <Image
                src="/culture.jpg"
                alt="Chinese Food Culture"
                width={400}
                height={250}
                className="w-full h-auto"
              />
              <div className="p-4">
                <h3 className="text-lg font-bold">Culture</h3>
                <p className="text-sm text-gray-600">
                  Experience the traditions behind the flavors.
                </p>
              </div>
            </div>
          </Link>

          <Link href="/flavors" className="block">
            <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <Image
                src="/flavors.jpg"
                alt="Chinese Flavors"
                width={400}
                height={250}
                className="w-full h-auto"
              />
              <div className="p-4">
                <h3 className="text-lg font-bold">Flavors</h3>
                <p className="text-sm text-gray-600">
                  Explore unique flavors from all regions of China.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
