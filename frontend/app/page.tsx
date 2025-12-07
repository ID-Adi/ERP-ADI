export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-primary-600">
          Welcome to ERP ADI
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Sistem ERP yang modern dan user-friendly
        </p>
        <a
          href="/login"
          className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Login ke Dashboard
        </a>
      </div>
    </main>
  );
}
