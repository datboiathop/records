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
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRecentReviews, getUserReviews } from '@/app/actions';
import { getSpotifyAlbumDetails, getNewReleases, type SpotifyAlbum } from '@/lib/spotify';
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
  const [selectedAlbum, setSelectedAlbum] = useState<SpotifyAlbum | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [newReleases, setNewReleases] = useState<SpotifyAlbum[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const fetchHomeData = async () => {
    try {
      // We can fetch new releases independently of user auth
      const releases = await getNewReleases();
      console.log("Fetched new releases from API:", releases?.length);
      setNewReleases(releases || []);

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
    return (
      <div className="min-h-screen bg-black text-white font-sans selection:bg-white/10 flex flex-col">
        {/* Navigation */}
        <nav className="border-b border-white/5 px-8 py-6">
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
        <main className="flex-1 flex flex-col items-center justify-center px-8 py-24 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-medium mb-4">
              <Star className="w-3 h-3 text-yellow-500" />
              <span>Join the community of audiophiles</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter leading-tight">
              The Art of<br />Listening.
            </h1>
            
            <p className="text-xl md:text-2xl font-light text-white/40 max-w-2xl mx-auto leading-relaxed">
              Track your musical journey. Rate your favorite albums, document your thoughts on every track, and discover what your friends are spinning.
            </p>

            <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <SignUpButton mode="modal">
                <button className="w-full sm:w-auto bg-white text-black font-medium text-lg px-8 py-4 rounded-full hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95">
                  Start Your Collection
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className="w-full sm:w-auto bg-white/5 text-white font-medium text-lg px-8 py-4 rounded-full hover:bg-white/10 border border-white/10 transition-all">
                  I already have an account
                </button>
              </SignInButton>
            </div>
          </motion.div>

          {/* Floating UI Elements (Decorative) */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="mt-32 w-full max-w-5xl mx-auto relative h-64 hidden md:block"
          >
            {newReleases && newReleases.length >= 3 ? (
              <>
                <div className="absolute left-0 top-0 glass-card p-4 rotate-[-6deg] shadow-2xl w-48">
                  <div className="aspect-square bg-zinc-800 rounded-lg mb-3 overflow-hidden">
                    <img src={newReleases[0].coverUrl} alt={newReleases[0].title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-2 w-16 bg-white/20 rounded"></div>
                    <span className="text-xs font-bold">10.0</span>
                  </div>
                </div>

                <div className="absolute right-1/4 -top-12 glass-card p-4 rotate-[4deg] shadow-2xl w-48 z-10">
                  <div className="aspect-square bg-zinc-800 rounded-lg mb-3 overflow-hidden">
                    <img src={newReleases[1].coverUrl} alt={newReleases[1].title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-2 w-20 bg-white/20 rounded"></div>
                    <span className="text-xs font-bold">9.5</span>
                  </div>
                </div>

                <div className="absolute right-0 top-8 glass-card p-4 rotate-[12deg] shadow-2xl w-48">
                  <div className="aspect-square bg-zinc-800 rounded-lg mb-3 overflow-hidden">
                    <img src={newReleases[2].coverUrl} alt={newReleases[2].title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-2 w-12 bg-white/20 rounded"></div>
                    <span className="text-xs font-bold">8.2</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
              </div>
            )}
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

