import { useState } from "react";

export default function SearchBar({ onSelect, placeholder = "Search city..." }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const city = query.trim();
    if (!city) return;
    onSelect(city);
    setQuery("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 rounded-lg bg-white/90 text-gray-900 shadow border border-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <button
        type="submit"
        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow"
      >
        Go
      </button>
    </form>
  );
}
