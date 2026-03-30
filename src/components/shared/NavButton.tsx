'use client';

import { cn } from '@/lib/utils';

export const NavButton = ({ 
  active, 
  onClick, 
  icon, 
  label 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
}) => (
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