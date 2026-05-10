export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">Kloset</h1>

        <p className="text-xl text-gray-400">
          AI-powered clothing resale platform
        </p>

        <button className="mt-8 px-6 py-3 bg-white text-black rounded-xl font-semibold hover:scale-105 transition">
          Get Started
        </button>
      </div>
    </main>
  );
}
