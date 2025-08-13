import Image from "next/image";

export default function AmericanChinesePage() {
  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <h1 className="text-3xl font-bold text-center mb-4">American-Chinese Cuisine</h1>
      <p className="max-w-3xl mx-auto text-lg text-gray-700 mb-6">
        American-Chinese food is a unique fusion born from the adaptation of traditional Chinese recipes 
        to suit American tastes. Dishes like General Tso’s chicken, chop suey, and crab rangoon may 
        be unknown in China, but they have become beloved staples in the U.S. 
      </p>

      <div className="flex justify-center mb-6">
        <Image
          src="/explore_american.png"
          alt="American Chinese dishes"
          width={800}
          height={500}
          className="rounded-lg shadow"
        />
      </div>

      <p className="max-w-3xl mx-auto text-gray-700 leading-relaxed">
        The roots of American-Chinese cuisine date back to the mid-19th century when Chinese immigrants 
        opened restaurants in California during the Gold Rush. Over time, they incorporated local ingredients 
        and flavors, creating a style of Chinese food that is familiar to millions of Americans today. 
        This cuisine reflects both the resilience of immigrant communities and the creativity of cultural exchange.
      </p>
    </div>
  );
}
