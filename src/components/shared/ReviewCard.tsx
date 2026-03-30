'use client';

import Link from 'next/link';
import { type Review } from '@/types';

export const ReviewCard = ({ review }: { review: Review }) => (
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