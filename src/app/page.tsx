import Generator from '@/components/Generator';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-24 bg-gray-50">
      <div className="z-10 w-full max-w-5xl items-center justify-between text-sm">
        <h1 className="text-4xl font-bold text-center text-gray-800">
          AI-Powered Excel Formula Generator
        </h1>
        <p className="mt-2 text-center text-lg text-gray-600">
          Turn your plain English instructions into powerful Excel and Google Sheets formulas.
        </p>
      </div>

      <Generator />
    </main>
  );
} 