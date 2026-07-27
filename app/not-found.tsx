import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#09090b] text-zinc-100 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-6xl font-bold text-zinc-200 tracking-tighter">404</h1>
        <h2 className="text-xl font-semibold text-zinc-300">Page Not Found</h2>
        <p className="text-sm text-zinc-500">
          The page or endpoint you are looking for does not exist or has been moved.
        </p>
        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium transition cursor-pointer"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
