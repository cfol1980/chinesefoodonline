import Image from "next/image";

export default function HistoryPage() {
  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <h1 className="text-3xl font-bold text-center mb-4">History of Chinese Cuisine</h1>
      <p className="max-w-3xl mx-auto text-lg text-gray-700 mb-6">
        Chinese cuisine is one of the world’s oldest and most diverse culinary traditions, 
        with a history spanning over 3,000 years. Rooted in ancient dynasties, it has been shaped 
        by geography, philosophy, trade, and migration. From the imperial banquets of the Tang 
        Dynasty to the humble street food stalls, each dish carries centuries of tradition and 
        cultural identity.
      </p>

      <div className="flex justify-center mb-6">
        <Image
          src="/explore_history.png"
          alt="Chinese food history"
          width={800}
          height={500}
          className="rounded-lg shadow"
        />
      </div>

      <p className="max-w-3xl mx-auto text-gray-700 leading-relaxed">
        Over the centuries, Chinese food spread across the globe through trade routes like the Silk Road 
        and later through immigration. In each new country, it adapted to local tastes while keeping 
        its essential flavors and cooking techniques. Understanding the history of Chinese food 
        helps us appreciate not only the dishes themselves but also the people and cultures 
        that brought them to life.
      </p>
    </div>
  );
}
