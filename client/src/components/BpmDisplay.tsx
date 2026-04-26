import { motion } from "framer-motion";

interface BpmDisplayProps {
  bpm: number | null;
  isActive: boolean;
  isBeating: boolean;
}

export function BpmDisplay({ bpm, isActive, isBeating }: BpmDisplayProps) {
  return (
    <div
      className={`relative w-[150px] h-[150px] flex items-center justify-center rounded-full border-4 transition-all duration-300 ${
        isActive
          ? "border-primary shadow-[0_0_15px_var(--primary)]"
          : "border-card"
      }`}
      style={{
        background: "#283547",
        boxShadow: isActive
          ? "0 0 15px var(--primary), inset 0 2px 4px rgba(0,0,0,0.3)"
          : "inset 0 2px 4px rgba(0,0,0,0.3)"
      }}
    >
      <div className="flex flex-col items-center">
        {isBeating && (
          <motion.div
            className="text-primary text-2xl mb-1"
            animate={{
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            ♥
          </motion.div>
        )}
        <div className="text-[3.5rem] font-bold leading-none">
          {bpm !== null ? Math.round(bpm) : "--"}
        </div>
        <div className="text-sm text-muted-foreground mt-1">BPM</div>
      </div>
    </div>
  );
}
