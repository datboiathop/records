'use client';

import { useState } from 'react';
import { Search, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { searchAppleAlbums, getAppleAlbumDetails, type Album } from '@/lib/apple';

export const SearchView = ({ onSelectAlbum }: { onSelectAlbum: (album: Album) => void }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Album[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const albums = await searchAppleAlbums(query);
    setResults(albums);
    setLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto space-y-16"
    >
      <header className="text-center space-y-4">
        <h2 className="text-5xl font-serif italic tracking-tight">Curation</h2>
        <p className="micro-label">Discover and Document</p>
      </header>

      <form onSubmit={handleSearch} className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 w-5 h-5 group-focus-within:text-white transition-colors" />
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter album title or artist..."
          className="w-full bg-white/[0.02] border border-white/10 rounded-full py-6 pl-16 pr-8 focus:outline-none focus:border-white/30 transition-all text-lg font-light tracking-tight"
        />
        <button 
          type="submit"
          disabled={loading}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-zinc-200 disabled:opacity-50 transition-all"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
        </button>
      </form>

      <div className="grid gap-6">
        {results.map((result) => (
          <motion.div 
            key={result.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 flex flex-col md:flex-row gap-8 items-center md:items-start"
          >
            <img 
              src={result.coverUrl || 'https://via.placeholder.com/300'} 
              alt={result.title} 
              className="w-48 h-48 rounded-xl shadow-2xl object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <h3 className="text-3xl font-serif italic mb-2">{result.title}</h3>
                <p className="micro-label">{result.artist} • {result.releaseDate}</p>
              </div>
              <button 
                onClick={async () => {
                  setLoading(true);
                  const details = await getAppleAlbumDetails(result.id);
                  if (details) onSelectAlbum(details);
                  setLoading(false);
                }}
                disabled={loading}
                className="bg-white text-black font-medium px-8 py-3 rounded-full hover:bg-zinc-200 transition-all flex items-center gap-3 mx-auto md:mx-0 disabled:opacity-50"
              >
                Document Review <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};