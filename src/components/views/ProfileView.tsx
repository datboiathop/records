'use client';

import { motion } from 'framer-motion';
import { ReviewCard } from '@/components/shared/ReviewCard';
import { type Review } from '@/types';

export const ProfileView = ({ user, reviews }: { user: any, reviews: Review[] }) => {
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
          {reviews.map((review) => (
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
};