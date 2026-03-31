'use client';

import React, { useState, useEffect } from 'react';
import { useUser, SignInButton, SignOutButton, SignUpButton } from '@clerk/nextjs';
import { 
  Search, 
  Music, 
  User as UserIcon, 
  LogOut, 
  Loader2,
  Disc,
  Star,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRecentReviews, getUserReviews } from '@/app/actions';
import { getAppleAlbumDetails, getAppleMostPlayedAlbums100, type Album } from '@/lib/apple';
import { type Review } from '@/types';

// Components
import { NavButton } from '@/components/shared/NavButton';
import { ReviewCard } from '@/components/shared/ReviewCard';
import { SearchView } from '@/components/views/SearchView';
import { AlbumDetailsView } from '@/components/views/AlbumDetailsView';
import { ProfileView } from '@/components/views/ProfileView';

export default function App() {
  const { user, isLoaded } = useUser();
  const [view, setView] = useState<'home' | 'search' | 'album' | 'profile'>('home');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [newReleases, setNewReleases] = useState<Album[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const pageSize = 10;
  const [page, setPage] = useState(0);

  const fetchHomeData = async () => {
    try {
      const releases = await getAppleMostPlayedAlbums100();
      console.log("Fetched home catalog from API:", releases?.length);
      setNewReleases(releases || []);
      setPage(0);

      // Only fetch user-specific data if they are logged in
      const data = await getRecentReviews();
      setReviews(data || []);
      
      if (user) {
        const uData = await getUserReviews(user.id);
        setUserReviews(uData || []);
      }
    } catch (e) {
      console.error("Error fetching home data:", e);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      console.log("Fetching home data...");
      fetchHomeData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id, view]);

  console.log("Current newReleases state:", newReleases.length);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
      </div>
    );
  }

  if (!user) {
    // Guest: Top albums from Apple charts; tile rows by repeating.
    const base = newReleases.filter((a) => a.coverUrl);
    const bgAlbums =
      base.length > 0
        ? Array.from({ length: Math.ceil(100 / base.length) }, () => base).flat().slice(0, 100)
        : [];
    const rows = [];
    for (let i = 0; i < bgAlbums.length; i += 10) {
      rows.push(bgAlbums.slice(i, i + 10));
    }

    return (
      <div className="min-h-screen bg-black text-white font-sans selection:bg-white/10 flex flex-col relative overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 z-0 pointer-events-none flex flex-col gap-4 p-4 mt-20">
          {rows.map((row, rowIndex) => (
            <div 
              key={rowIndex} 
              className="grid w-full gap-4 [grid-template-columns:repeat(auto-fit,minmax(3.25rem,1fr))]"
              style={{ opacity: Math.max(0.15, 0.6 - (rowIndex * 0.09)) }}
            >
              {row.map((album, colIndex) => (
                <div 
                  key={album.id + rowIndex}
                  className="aspect-square min-h-0 w-full overflow-hidden rounded-lg"
                >
                  <img 
                    src={album.coverUrl} 
                    alt="" 
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Navigation */}
        <nav className="border-b border-white/5 px-8 py-6 relative z-10 bg-black/80 backdrop-blur-md">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Disc className="w-5 h-5 text-white" />
              <span className="font-serif italic text-2xl tracking-tighter">Records</span>
            </div>
            <div className="flex items-center gap-6">
              <SignInButton mode="modal">
                <button className="text-sm font-medium text-white/60 hover:text-white transition-colors">
                  Log In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="text-sm font-medium bg-white text-black px-5 py-2 rounded-full hover:bg-zinc-200 transition-colors">
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-8 py-24 text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 border border-white/10 text-white/80 text-xs font-medium mb-4 backdrop-blur-md">
              <Star className="w-3 h-3 text-yellow-500" />
              <span>Join your community of audiophiles</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter leading-tight drop-shadow-2xl">
              The Art of<br />Listening.
            </h1>
            
            <p className="text-xl md:text-2xl font-light text-white/80 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
              Track your musical journey. Rate your favorite albums, document your thoughts on every track, and discover what your friends are spinning.
            </p>

            <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <SignUpButton mode="modal">
                <button className="w-full sm:w-auto bg-white text-black font-medium text-lg px-8 py-4 rounded-full hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 shadow-xl">
                  Start Your Collection
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className="w-full sm:w-auto bg-black/50 backdrop-blur-md text-white font-medium text-lg px-8 py-4 rounded-full hover:bg-white/10 border border-white/10 transition-all shadow-xl">
                  I already have an account
                </button>
              </SignInButton>
            </div>
          </motion.div>
        </main>
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
            <span className="font-serif italic text-2xl tracking-tighter">Records.</span>
          </div>
          
          <div className="flex items-center justify-around w-full md:w-auto md:gap-12">
            <NavButton active={view === 'home'} onClick={() => setView('home')} icon={<Music className="w-5 h-5" />} label="Feed" />
            <NavButton active={view === 'search'} onClick={() => setView('search')} icon={<Search className="w-5 h-5" />} label="Search" />
            
            <NavButton active={view === 'profile'} onClick={() => setView('profile')} icon={<UserIcon className="w-5 h-5" />} label="Profile" />
            <SignOutButton>
              <button className="p-2 text-white/20 hover:text-white transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </SignOutButton>
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
              {/* Top Albums Header*/}
              <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-8 mb-2 gap-6">
                <div>
                  <h2 className="text-4xl font-serif italic mb-2">Top Albums</h2>
                  <p className="micro-label">Apple Music charts</p>
                </div>
                
                {newReleases.length > pageSize && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white/50 transition-all"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="text-xs font-medium text-white/40 tracking-widest uppercase px-2 tabular-nums">
                      {page + 1} <span className="opacity-50 mx-1">/</span> {Math.ceil(newReleases.length / pageSize)}
                    </div>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={(page + 1) * pageSize >= newReleases.length}
                      className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white/50 transition-all"
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Top Albums Images*/}
              <AnimatePresence mode="wait">
                <motion.div 
                  key={page}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-16"
                >
                  {newReleases.slice(page * pageSize, (page + 1) * pageSize).map((album) => (
                    <div 
                      key={album.id} 
                    className="group cursor-pointer"
                    onClick={async () => {
                      // Optimistically set the view with the data we already have
                      setSelectedAlbum(album);
                      setView('album');
                      
                      // Fetch the full details (like the tracklist) in the background
                      const details = await getAppleAlbumDetails(album.id);
                      if (details) {
                        setSelectedAlbum(details);
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
                </motion.div>
              </AnimatePresence>

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

                  <div className="mt-24 p-8 border border-dashed border-white/10 rounded-3xl text-center">
                    <h3 className="text-2xl font-serif italic mb-2">Recently Listening To</h3>
                    <p className="text-white/40 font-light text-sm mb-6">Connect your account to automatically fetch your recent spins.</p>
                    <button className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-full text-sm font-medium transition-colors border border-white/10">
                      Connect (Coming Soon)
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

