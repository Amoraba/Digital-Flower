import { motion } from "motion/react";
import { useState } from "react";
import { Gift, Sparkles, Heart } from "lucide-react";

interface GiftRevealBoxProps {
  onOpenComplete: () => void;
  senderNameName?: string;
}

export default function GiftRevealBox({ onOpenComplete, senderNameName = "A Special Friend" }: GiftRevealBoxProps) {
  const [isOpening, setIsOpening] = useState(false);

  const handleOpen = () => {
    if (isOpening) return;
    setIsOpening(true);
    // Let the animation complete briefly before revealing the actual flower & starting vocals
    setTimeout(() => {
      onOpenComplete();
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-64 h-64 mb-8 flex items-center justify-center cursor-pointer group" onClick={handleOpen}>
        {/* Ambient surrounding rays/glow */}
        <motion.div
          className="absolute inset-0 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/25 transition-all duration-700"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Outer sparkling particles orbiting the gift */}
        {!isOpening && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-amber-400"
                style={{
                  top: "50%",
                  left: "50%",
                }}
                animate={{
                  x: [
                    Math.cos((i * 60 * Math.PI) / 180) * 80,
                    Math.cos(((i * 60 + 180) * Math.PI) / 180) * 85,
                    Math.cos((i * 60 * Math.PI) / 180) * 80,
                  ],
                  y: [
                    Math.sin((i * 60 * Math.PI) / 180) * 80,
                    Math.sin(((i * 60 + 180) * Math.PI) / 180) * 85,
                    Math.sin((i * 60 * Math.PI) / 180) * 80,
                  ],
                  scale: [0.6, 1.2, 0.6],
                  opacity: [0.2, 0.8, 0.2],
                }}
                transition={{
                  duration: 4 + i,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        )}

        {/* Burst of confetti hearts/stars during opening */}
        {isOpening && (
          <div className="absolute inset-x-0 top-0 h-0 pointer-events-none z-50">
            {[...Array(16)].map((_, i) => {
              const angle = (i * 360) / 16;
              const distance = Math.random() * 120 + 80;
              const rad = (angle * Math.PI) / 180;
              return (
                <motion.div
                  key={i}
                  className="absolute"
                  initial={{ x: 0, y: 0, scale: 0.1, opacity: 1 }}
                  animate={{
                    x: Math.cos(rad) * distance,
                    y: Math.sin(rad) * distance - 80, // shoot slightly upwards
                    scale: [0.5, 1.5, 0],
                    opacity: [1, 1, 0],
                    rotate: [0, Math.random() * 360],
                  }}
                  transition={{
                    duration: 1.2,
                    ease: "easeOut",
                  }}
                >
                  {i % 2 === 0 ? (
                    <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Main Wrapped Gift Box Container */}
        <motion.div
          animate={
            isOpening
              ? {
                  scale: [1, 1.15, 0.8],
                  rotate: [0, -5, 5, -5, 0],
                }
              : {
                  y: [0, -6, 0],
                }
          }
          transition={
            isOpening
              ? { duration: 0.5, ease: "easeInOut" }
              : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
          }
          className="relative w-40 h-40 flex flex-col items-center justify-end"
        >
          {/* Box Lid */}
          <motion.div
            className="absolute z-20 w-44 h-10 bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 border border-rose-400 rounded-t-md shadow-md flex items-center justify-center"
            style={{ bottom: "2.4rem" }}
            initial={{ y: 0 }}
            animate={
              isOpening
                ? {
                    y: -140,
                    x: -25,
                    rotate: -35,
                    scale: 0.8,
                    opacity: 0,
                  }
                : {}
            }
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Horizontal Gold Lid Ribbon */}
            <div className="absolute inset-y-0 w-8 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 shadow-inner" />
          </motion.div>

          {/* Gorgeous Gold Accent Ribbon Bow on Top of Lid */}
          <motion.div
            className="absolute z-30"
            style={{ bottom: "4.8rem" }}
            initial={{ scale: 1, y: 0 }}
            animate={
              isOpening
                ? {
                    y: -180,
                    x: 10,
                    rotate: 15,
                    opacity: 0,
                    scale: 0.5,
                  }
                : {}
            }
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            {/* Left Bow Loop */}
            <div className="absolute right-1 w-8 h-8 rounded-full border-3 border-amber-400 bg-gradient-to-tr from-amber-500 to-yellow-300 origin-bottom-right rotate-[-30deg] shadow" />
            {/* Right Bow Loop */}
            <div className="absolute left-1 w-8 h-8 rounded-full border-3 border-amber-400 bg-gradient-to-tl from-amber-500 to-yellow-300 origin-bottom-left rotate-[30deg] shadow" />
            {/* Center Knot */}
            <div className="w-5 h-5 rounded-md bg-amber-500 border border-yellow-300 relative z-10 shadow" />
          </motion.div>

          {/* Box Body */}
          <motion.div
            className="w-40 h-28 bg-gradient-to-b from-rose-700 via-rose-600 to-rose-800 border-x border-b border-rose-500 rounded-b-xl shadow-xl relative overflow-hidden"
            initial={{ scaleX: 1, scaleY: 1 }}
            animate={isOpening ? { scaleX: [1, 1.1, 0.4], scaleY: [1, 0.9, 0], opacity: [1, 1, 0] } : {}}
            transition={{ duration: 0.9, ease: "easeInOut" }}
          >
            {/* Vertical Gold Box Ribbon */}
            <div className="absolute inset-x-0 mx-auto w-8 h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 flex items-center justify-center shadow-inner">
              <Gift className="w-4 h-4 text-rose-700 font-bold" />
            </div>

            {/* Gloss reflection overlay */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 skew-x-[-20deg] origin-top" />
          </motion.div>
        </motion.div>
      </div>

      <div className="text-center space-y-3 max-w-sm z-10">
        <h3 className="text-xl font-serif font-extrabold text-stone-100 flex items-center justify-center space-x-2">
          <span>Unwrap a Special Surprise</span>
        </h3>
        <p className="text-xs text-rose-200/80 leading-relaxed font-sans px-4">
          Click the glowing magic box above or the button below to break open the ribbon and watch your customized flower bloom in real-time.
        </p>

        <button
          onClick={handleOpen}
          disabled={isOpening}
          className="bg-gradient-to-r from-amber-500 via-rose-500 to-pink-600 hover:from-amber-600 hover:via-rose-600 hover:to-pink-700 text-white font-serif font-black px-10 py-4 rounded-2xl shadow-xl shadow-rose-950/40 text-base flex items-center justify-center space-x-2.5 mx-auto transition-all duration-300 hover:scale-[1.04] active:scale-95 disabled:opacity-50"
          id="reveal-box-unwrap-btn"
        >
          <Sparkles className="w-5 h-5 animate-pulse text-amber-200" />
          <span>{isOpening ? "Unwrapping Gift..." : "Unwrap & Bloom Flower"}</span>
        </button>
      </div>
    </div>
  );
}
