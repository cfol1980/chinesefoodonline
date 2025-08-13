import Image from "next/image";

export default function RegionalPage() {
  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <h1 className="text-3xl font-bold text-center mb-4">Regional Chinese Cuisine</h1>
      <p className="max-w-3xl mx-auto text-lg text-gray-700 mb-6">
        China’s vast geography and diverse climates have given rise to a wide variety of regional cuisines. 
        From the fiery spice of Sichuan to the delicate flavors of Cantonese dim sum, each region offers 
        a culinary identity shaped by local ingredients, traditions, and history.
      </p>

      <div className="flex justify-center mb-6">
        <Image
          src="/explore_regional.png"
          alt="Regional Chinese food"
          width={800}
          height={500}
          className="rounded-lg shadow"
        />
      </div>

      <p className="max-w-3xl mx-auto text-gray-700 leading-relaxed">
        The eight major culinary traditions of China — Anhui, Cantonese, Fujian, Hunan, Jiangsu, 
        Shandong, Sichuan, and Zhejiang — represent a spectrum of tastes and cooking techniques. 
        Exploring regional Chinese cuisine means traveling through flavor: the sweet notes of 
        Suzhou, the umami-rich seafood of Fujian, the bold chili heat of Hunan, and more.
      </p>
    </div>
  );
}
