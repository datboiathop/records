'use client';

import React, { useState, useEffect } from 'react';
import { useUser, SignInButton, SignOutButton } from '@clerk/nextjs';
import { 
  Search, 
  Music, 
  User as UserIcon, 
  LogOut, 
  ChevronRight, 
  ArrowLeft,
  Loader2,
  Disc
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveReview, getRecentReviews, getUserReviews } from '@/app/actions';
import { searchSpotifyAlbums, getSpotifyAlbumDetails, getNewReleases, type SpotifyAlbum } from '@/lib/spotify';
import Link from 'next/link';

// --- Components ---

const RatingInput = ({ value, onChange }: { value: number, onChange: (val: number) => void }) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="micro-label">Rating</span>
        <span className="text-3xl font-light tracking-tighter">{value.toFixed(1)}</span>
      </div>
      <input 
        type="range" 
        min="1" 
        max="10" 
        step="0.1" 
        value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-[1px] bg-white/20 appearance-none cursor-pointer accent-white"
      />
      <div className="flex justify-between text-[9px] text-white/30 font-mono tracking-widest">
        <span>1.0</span>
        <span>5.0</span>
        <span>10.0</span>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const { user, isLoaded } = useUser();
  const [view, setView] = useState<'home' | 'search' | 'album' | 'profile'>('home');
  const [selectedAlbum, setSelectedAlbum] = useState<SpotifyAlbum | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [newReleases, setNewReleases] = useState<SpotifyAlbum[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const fetchHomeData = async () => {
    setLoadingReviews(true);
    try {
      const [data, releases] = await Promise.all([
        getRecentReviews(),
        getNewReleases()
      ]);
      setReviews(data);
      setNewReleases(releases);
      
      if (user) {
        const uData = await getUserReviews(user.id);
        setUserReviews(uData);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingReviews(false);
  };

  useEffect(() => {
    if (view === 'home' || view === 'profile') {
      fetchHomeData();
    }
  }, [view, user]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white/10">
      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-2xl border-t border-white/5 z-50 px-8 py-6 md:top-0 md:bottom-auto md:border-t-0 md:border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div 
            className="hidden md:flex items-center gap-4 cursor-pointer group"
            onClick={() => setView('home')}
          >
            <Disc className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
            <span className="font-serif italic text-2xl tracking-tighter">SonicBox</span>
          </div>
          
          <div className="flex items-center justify-around w-full md:w-auto md:gap-12">
            <NavButton active={view === 'home'} onClick={() => setView('home')} icon={<Music className="w-5 h-5" />} label="Feed" />
            <NavButton active={view === 'search'} onClick={() => setView('search')} icon={<Search className="w-5 h-5" />} label="Search" />
            
            {user ? (
              <>
                <NavButton active={view === 'profile'} onClick={() => setView('profile')} icon={<UserIcon className="w-5 h-5" />} label="Profile" />
                <SignOutButton>
                  <button className="p-2 text-white/20 hover:text-white transition-colors">
                    <LogOut className="w-5 h-5" />
                  </button>
                </SignOutButton>
              </>
            ) : (
              <SignInButton mode="modal">
                <button className="text-sm font-medium bg-white text-black px-4 py-2 rounded-full hover:bg-zinc-200 transition-colors">
                  Sign In
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-8 pb-32 md:pt-32 md:pb-16 max-w-6xl mx-auto px-8">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              <header className="border-b border-white/5 pb-8">
                <h2 className="text-4xl font-serif italic mb-2">Recent Reviews</h2>
                <p className="micro-label">Community Activity</p>
              </header>
              
              {loadingReviews ? (
                <div className="py-32 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-white/20" />
                </div>
              ) : (
                <>
                  <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-24">
                    {reviews.map((review: any) => (
                      <div key={review.id}>
                        <ReviewCard review={review} />
                      </div>
                    ))}
                    {reviews.length === 0 && (
                      <div className="col-span-full py-16 text-center">
                        <Disc className="w-12 h-12 mx-auto mb-6 opacity-10" />
                        <p className="text-white/20 font-light italic">The silence is deafening. Start the conversation.</p>
                      </div>
                    )}
                  </div>

                  <header className="border-b border-white/5 pb-8 mb-12">
                    <h2 className="text-4xl font-serif italic mb-2">New Releases</h2>
                    <p className="micro-label">Fresh from the studio</p>
                  </header>

                  <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
                    {newReleases.map((album) => (
                      <div 
                        key={album.id} 
                        className="group cursor-pointer"
                        onClick={async () => {
                          if (!user) {
                            alert("Please sign in to document a review.");
                            return;
                          }
                          const details = await getSpotifyAlbumDetails(album.id);
                          if (details) {
                            setSelectedAlbum(details);
                            setView('album');
                          }
                        }}
                      >
                        <div className="relative aspect-square overflow-hidden rounded-xl mb-4">
                          <img 
                            src={album.coverUrl} 
                            alt={album.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        </div>
                        <h3 className="font-serif italic text-lg tracking-tight truncate">{album.title}</h3>
                        <p className="micro-label truncate">{album.artist}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-24 p-8 border border-dashed border-white/10 rounded-3xl text-center">
                    <h3 className="text-2xl font-serif italic mb-2">Recently Listening To</h3>
                    <p className="text-white/40 font-light text-sm mb-6">Connect your Spotify account to automatically fetch your recent spins.</p>
                    <button className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-full text-sm font-medium transition-colors border border-white/10">
                      Connect Spotify (Coming Soon)
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {view === 'search' && (
            <SearchView 
              onSelectAlbum={(album) => {
                if (!user) {
                  alert("Please sign in to document a review.");
                  return;
                }
                setSelectedAlbum(album);
                setView('album');
              }} 
            />
          )}

          {view === 'album' && selectedAlbum && (
            <AlbumDetailsView 
              album={selectedAlbum} 
              onBack={() => setView('search')}
              onSuccess={() => setView('home')}
            />
          )}

          {view === 'profile' && user && (
            <ProfileView user={user} reviews={userReviews} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Sub-Views ---

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-2 transition-all ${active ? "text-white" : "text-white/20 hover:text-white/40"}`}
  >
    {icon}
    <span className="micro-label">{label}</span>
  </button>
);

const ReviewCard = ({ review }: { review: any }) => (
  <Link href={`/albums/${review.albumId}`}>
    <div className="glass-card p-6 hover:bg-white/[0.04] transition-all group cursor-pointer h-full">
      <div className="space-y-6">
        <div className="relative aspect-square overflow-hidden rounded-xl">
          <img 
            src={review.album.coverUrl} 
            alt={review.album.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
            <span className="text-xs font-bold tracking-tighter">{review.rating.toFixed(1)}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-4">
            {review.user.imageUrl && (
              <img src={review.user.imageUrl} className="w-4 h-4 rounded-full opacity-60" alt="" />
            )}
            <span className="micro-label !text-white/60">{review.user.name}</span>
          </div>
          <h3 className="font-serif italic text-xl tracking-tight truncate">{review.album.title}</h3>
          <p className="micro-label truncate">{review.album.artist}</p>
          {review.comment && (
            <p className="text-sm text-white/40 line-clamp-2 italic pt-4 border-t border-white/5">
              "{review.comment}"
            </p>
          )}
        </div>
      </div>
    </div>
  </Link>
);

const SearchView = ({ onSelectAlbum }: { onSelectAlbum: (album: SpotifyAlbum) => void }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SpotifyAlbum[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const albums = await searchSpotifyAlbums(query);
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
                  const details = await getSpotifyAlbumDetails(result.id);
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

const AlbumDetailsView = ({ album, onBack, onSuccess }: { album: SpotifyAlbum, onBack: () => void, onSuccess: () => void }) => {
  const [rating, setRating] = useState(5.0);
  const [comment, setComment] = useState('');
  const [trackComments, setTrackComments] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await saveReview(album, rating, comment, trackComments);
      onSuccess();
    } catch (error) {
      console.error(error);
      alert("Failed to save review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-16"
    >
      <button onClick={onBack} className="flex items-center gap-3 text-white/40 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> <span className="micro-label">Return to Search</span>
      </button>

      <div className="flex flex-col lg:flex-row gap-16">
        <div className="lg:w-1/3 space-y-12">
          <img 
            src={album.coverUrl} 
            alt={album.title} 
            className="w-full aspect-square rounded-3xl shadow-2xl object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="glass-card p-8 space-y-10">
            <RatingInput value={rating} onChange={setRating} />
            <div className="space-y-4">
              <label className="micro-label">Narrative</label>
              <textarea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your perspective..."
                className="w-full bg-white/[0.02] border border-white/10 rounded-2xl p-6 min-h-[160px] focus:outline-none focus:border-white/30 transition-all text-sm font-light leading-relaxed"
              />
            </div>
            <button 
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-white text-black font-medium py-5 rounded-full hover:bg-zinc-200 disabled:opacity-50 transition-all"
            >
              {submitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Publish Entry'}
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-16">
          <header className="space-y-4">
            <h2 className="text-7xl font-serif italic tracking-tighter leading-none">{album.title}</h2>
            <p className="text-2xl font-light text-white/40 tracking-tight">{album.artist}</p>
          </header>

          <div className="space-y-8">
            <h3 className="micro-label !text-white/80">Track Analysis</h3>
            <div className="space-y-4">
              {album.tracks.map((track, index) => (
                <div key={index} className="group border-b border-white/5 pb-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-6 flex-1">
                      <span className="text-[10px] font-mono text-white/20">{(index + 1).toString().padStart(2, '0')}</span>
                      <span className="font-medium tracking-tight">{track}</span>
                    </div>
                    <div className="flex-1">
                      <input 
                        type="text"
                        value={trackComments[index] || ''}
                        onChange={(e) => setTrackComments({ ...trackComments, [index]: e.target.value })}
                        placeholder="Add track note..."
                        className="w-full bg-transparent border-none p-0 text-sm italic text-white/40 focus:text-white focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ProfileView = ({ user, reviews }: { user: any, reviews: any[] }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-20"
    >
      <header className="flex flex-col items-center text-center space-y-8">
        <div className="relative">
          <img src={user.imageUrl || ''} className="w-40 h-40 rounded-full border border-white/10 p-2" alt="" />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-1 rounded-full">
            <span className="micro-label !text-black !font-bold">Member</span>
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-5xl font-serif italic tracking-tight">{user.fullName || user.firstName}</h2>
          <p className="micro-label">{user.emailAddresses[0]?.emailAddress}</p>
        </div>
        <div className="flex gap-16 border-t border-white/5 pt-8 w-full max-w-md justify-center">
          <div className="text-center">
            <div className="text-3xl font-light tracking-tighter">{reviews.length}</div>
            <div className="micro-label">Entries</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-light tracking-tighter">
              {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '0.0'}
            </div>
            <div className="micro-label">Avg Rating</div>
          </div>
        </div>
      </header>

      <div className="space-y-12">
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <h3 className="text-2xl font-serif italic">Personal Archive</h3>
          <p className="micro-label">{reviews.length} Documents</p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review: any) => (
            <div key={review.id}>
              <ReviewCard review={review} />
            </div>
          ))}
          {reviews.length === 0 && (
            <div className="col-span-full py-32 text-center border border-dashed border-white/10 rounded-3xl">
              <p className="text-white/20 italic font-light">Your archive is empty.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}