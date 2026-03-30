'use client';

export const RatingInput = ({ value, onChange }: { value: number, onChange: (val: number) => void }) => {
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