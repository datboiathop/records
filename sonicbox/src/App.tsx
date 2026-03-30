/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot, 
  Timestamp,
  where,
  limit,
  getDocFromServer
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { cn } from './lib/utils';
import { 
  Search, 
  Star, 
  Music, 
  User as UserIcon, 
  LogOut, 
  Plus, 
  ChevronRight, 
  ArrowLeft,
  MessageSquare,
  Loader2,
  Disc
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { searchAlbum, AlbumData } from './services/geminiService';

// --- Types ---

interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
}

interface Review {
  id: string;
  albumId: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string;
  albumTitle: string;
  albumArtist: string;
  albumCoverUrl: string;
  rating: number;
  comment: string;
  trackComments: Record<number, string>;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

// --- Error Handling ---

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email || undefined,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Context ---

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

// --- Components ---

const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      try {
        const parsed = JSON.parse(event.error.message);
        if (parsed.error) {
          setError(`Firestore Error: ${parsed.error} during ${parsed.operationType} on ${parsed.path}`);
        }
      } catch {
        setError(event.error.message);
      }
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
        <div className="bg-zinc-900 border border-red-500/50 p-6 rounded-2xl max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-500 mb-2">Something went wrong</h2>
          <p className="text-zinc-400 text-sm mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'home' | 'search' | 'album' | 'profile'>('home');
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        // Ensure user profile exists in Firestore
        const userRef = doc(db, 'users', u.uid);
        try {
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              uid: u.uid,
              displayName: u.displayName || 'Anonymous',
              photoURL: u.photoURL || '',
              email: u.email || ''
            });
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${u.uid}`);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
      setReviews(fetchedReviews);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reviews');
    });
    return () => unsubscribe();
  }, [user]);

  // Test connection as per instructions
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Sign in error", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setView('home');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="mb-12">
            <Disc className="w-12 h-12 text-white/20 mx-auto mb-6" />
            <h1 className="text-6xl font-serif font-light tracking-tighter mb-2 italic">SonicBox</h1>
            <p className="micro-label">The Art of Listening</p>
          </div>
          
          <button 
            onClick={signIn}
            className="w-full bg-white text-black font-medium py-4 rounded-full flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all active:scale-95"
          >
            Connect with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, logout }}>
      <ErrorBoundary>
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
                <NavButton active={view === 'profile'} onClick={() => setView('profile')} icon={<UserIcon className="w-5 h-5" />} label="Profile" />
                <button onClick={logout} className="p-2 text-white/20 hover:text-white transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
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
                  
                  <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {reviews.map((review: Review) => (
                      <div key={review.id}>
                        <ReviewCard review={review} />
                      </div>
                    ))}
                    {reviews.length === 0 && (
                      <div className="col-span-full py-32 text-center">
                        <Disc className="w-12 h-12 mx-auto mb-6 opacity-10" />
                        <p className="text-white/20 font-light italic">The silence is deafening. Start the conversation.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {view === 'search' && (
                <SearchView 
                  onSelectAlbum={(album) => {
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

              {view === 'profile' && (
                <ProfileView user={user} reviews={reviews.filter(r => r.userId === user.uid)} />
              )}
            </AnimatePresence>
          </main>
        </div>
      </ErrorBoundary>
    </AuthContext.Provider>
  );
}

// --- Sub-Views ---

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex flex-col items-center gap-2 transition-all",
      active ? "text-white" : "text-white/20 hover:text-white/40"
    )}
  >
    {icon}
    <span className="micro-label">{label}</span>
  </button>
);

const ReviewCard = ({ review }: { review: Review }) => (
  <div className="glass-card p-6 hover:bg-white/[0.04] transition-all group cursor-pointer">
    <div className="space-y-6">
      <div className="relative aspect-square overflow-hidden rounded-xl">
        <img 
          src={review.albumCoverUrl} 
          alt={review.albumTitle} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
          <span className="text-xs font-bold tracking-tighter">{review.rating.toFixed(1)}</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-4">
          <img src={review.userPhotoURL} className="w-4 h-4 rounded-full opacity-60" alt="" />
          <span className="micro-label !text-white/60">{review.userDisplayName}</span>
        </div>
        <h3 className="font-serif italic text-xl tracking-tight truncate">{review.albumTitle}</h3>
        <p className="micro-label truncate">{review.albumArtist}</p>
        <p className="text-sm text-white/40 line-clamp-2 italic pt-4 border-t border-white/5">
          "{review.comment}"
        </p>
      </div>
    </div>
  </div>
);

const SearchView = ({ onSelectAlbum }: { onSelectAlbum: (album: AlbumData) => void }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AlbumData | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const album = await searchAlbum(query);
    setResult(album);
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

      {result && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-10 flex flex-col md:flex-row gap-12 items-center md:items-start"
        >
          <img 
            src={result.coverUrl} 
            alt={result.title} 
            className="w-64 h-64 rounded-2xl shadow-2xl object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 text-center md:text-left space-y-6">
            <div>
              <h3 className="text-4xl font-serif italic mb-2">{result.title}</h3>
              <p className="micro-label">{result.artist}</p>
            </div>
            <button 
              onClick={() => onSelectAlbum(result)}
              className="bg-white text-black font-medium px-10 py-4 rounded-full hover:bg-zinc-200 transition-all flex items-center gap-3 mx-auto md:mx-0"
            >
              Document Review <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

const AlbumDetailsView = ({ album, onBack, onSuccess }: { album: AlbumData, onBack: () => void, onSuccess: () => void }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(5.0);
  const [comment, setComment] = useState('');
  const [trackComments, setTrackComments] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    
    const reviewId = `${user.uid}_${album.id}`;
    const reviewData: Review = {
      id: reviewId,
      albumId: album.id,
      userId: user.uid,
      userDisplayName: user.displayName || 'Anonymous',
      userPhotoURL: user.photoURL || '',
      albumTitle: album.title,
      albumArtist: album.artist,
      albumCoverUrl: album.coverUrl,
      rating,
      comment,
      trackComments,
      createdAt: Timestamp.now()
    };

    try {
      await setDoc(doc(db, 'reviews', reviewId), reviewData);
      onSuccess();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `reviews/${reviewId}`);
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

const ProfileView = ({ user, reviews }: { user: User, reviews: Review[] }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-20"
    >
      <header className="flex flex-col items-center text-center space-y-8">
        <div className="relative">
          <img src={user.photoURL || ''} className="w-40 h-40 rounded-full border border-white/10 p-2" alt="" />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-1 rounded-full">
            <span className="micro-label !text-black !font-bold">Member</span>
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-5xl font-serif italic tracking-tight">{user.displayName}</h2>
          <p className="micro-label">{user.email}</p>
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
          {reviews.map((review: Review) => (
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
