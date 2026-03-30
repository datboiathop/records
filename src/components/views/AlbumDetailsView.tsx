'use client';

import { useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { type SpotifyAlbum } from '@/lib/spotify';
import { saveReview } from '@/app/actions';
import { RatingInput } from '@/components/shared/RatingInput';

export const AlbumDetailsView = ({ 
  album, 
  onBack, 
  onSuccess 
}: { 
  album: SpotifyAlbum; 
  onBack: () => void; 
  onSuccess: () => void;
}) => {
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