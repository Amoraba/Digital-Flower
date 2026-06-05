import { motion } from "motion/react";
import { type FlowerType, type ColorType, FLOWER_COLORS } from "../types";
import { useEffect, useState } from "react";

interface FlowerRendererProps {
  flowerType: FlowerType;
  colorName: ColorType;
  isBlooming?: boolean;
}

export default function FlowerRenderer({
  flowerType,
  colorName,
  isBlooming = true,
}: FlowerRendererProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number; duration: number }>>([]);
  const colors = FLOWER_COLORS[colorName] || FLOWER_COLORS.Red;

  // Generate background sparkles/petals floating ambiently
  useEffect(() => {
    const arr = Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage
      y: Math.random() * 100, // percentage
      size: Math.random() * 8 + 4,
      delay: Math.random() * 5,
      duration: Math.random() * 6 + 6,
    }));
    setParticles(arr);
  }, [colorName, flowerType]);

  // Render specific SVG shapes based on selection
  const renderFlowerSVG = () => {
    switch (flowerType) {
      case "Rose":
        return (
          <g>
            {/* Stem and Leaves */}
            <path
              d="M 100,120 Q 100,170 100,240"
              fill="none"
              stroke="#15803d"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Leaf Left */}
            <motion.path
              initial={{ scale: 0 }}
              animate={isBlooming ? { scale: 1 } : { scale: 0 }}
              transition={{ delay: 0.5, type: "spring" }}
              d="M 100,180 C 70,170 60,195 80,205 C 95,210 100,195 100,180"
              fill="#166534"
              style={{ transformOrigin: "100px 180px" }}
            />
            {/* Leaf Right */}
            <motion.path
              initial={{ scale: 0 }}
              animate={isBlooming ? { scale: 1 } : { scale: 0 }}
              transition={{ delay: 0.65, type: "spring" }}
              d="M 100,150 C 130,140 140,165 120,175 C 105,180 100,165 100,150"
              fill="#166534"
              style={{ transformOrigin: "100px 150px" }}
            />
            
            {/* Outer Petals */}
            <motion.path
              initial={{ scale: 0.3, rotate: -20 }}
              animate={isBlooming ? { scale: 1, rotate: 0 } : { scale: 0.3 }}
              transition={{ type: "spring", stiffness: 50, damping: 10 }}
              d="M 100,140 C 60,140 50,80 100,75 C 150,80 140,140 100,140"
              fill={colors.secondary}
              style={{ transformOrigin: "100px 110px" }}
            />
            <motion.path
              initial={{ scale: 0.3, rotate: 20 }}
              animate={isBlooming ? { scale: 1, rotate: 0 } : { scale: 0.3 }}
              transition={{ type: "spring", stiffness: 45, damping: 12, delay: 0.1 }}
              d="M 100,135 C 55,115 70,55 100,65 C 130,55 145,115 100,135"
              fill={colors.primary}
              style={{ transformOrigin: "100px 110px" }}
            />
            
            {/* Mid Petals */}
            <motion.path
              initial={{ scale: 0.2 }}
              animate={isBlooming ? { scale: 1 } : { scale: 0.2 }}
              transition={{ type: "spring", stiffness: 60, delay: 0.2 }}
              d="M 100,125 C 75,105 80,80 100,85 C 120,80 125,105 100,125"
              fill={colors.secondary}
              style={{ transformOrigin: "100px 105px" }}
            />
            
            {/* Rose Core Bud */}
            <motion.path
              initial={{ scale: 0.1 }}
              animate={isBlooming ? { scale: 1 } : { scale: 0.1 }}
              transition={{ type: "spring", stiffness: 70, delay: 0.3 }}
              d="M 100,115 C 85,100 90,88 100,90 C 110,88 115,100 100,115"
              fill={colors.primary}
              style={{ transformOrigin: "100px 105px" }}
            />
          </g>
        );

      case "Tulip":
        return (
          <g>
            {/* Stem and big leaf */}
            <path
              d="M 100,130 Q 95,180 100,240"
              fill="none"
              stroke="#15803d"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <motion.path
              initial={{ scaleX: 0, rotate: -10 }}
              animate={isBlooming ? { scaleX: 1, rotate: 0 } : { scaleX: 0 }}
              transition={{ delay: 0.4 }}
              d="M 100,190 C 70,160 50,120 70,95 C 80,125 95,160 100,190"
              fill="#166534"
              style={{ transformOrigin: "100px 190px" }}
            />

            {/* Bloom Cup */}
            <g>
              {/* Back Petals */}
              <motion.path
                initial={{ y: 20, scaleY: 0.5 }}
                animate={isBlooming ? { y: 0, scaleY: 1 } : { scaleY: 0.5 }}
                transition={{ type: "spring", damping: 12 }}
                d="M 100,140 C 65,130 65,60 100,60 C 135,60 135,130 100,140"
                fill={colors.secondary}
                style={{ transformOrigin: "100px 140px" }}
              />
              {/* Left Wing Petal */}
              <motion.path
                initial={{ rotate: -25, scale: 0.4 }}
                animate={isBlooming ? { rotate: 0, scale: 1 } : { scale: 0.4 }}
                transition={{ type: "spring", damping: 10, delay: 0.15 }}
                d="M 100,140 C 60,110 50,55 85,55 C 100,75 105,110 100,140"
                fill={colors.primary}
                style={{ transformOrigin: "100px 140px" }}
              />
              {/* Right Wing Petal */}
              <motion.path
                initial={{ rotate: 25, scale: 0.4 }}
                animate={isBlooming ? { rotate: 0, scale: 1 } : { scale: 0.4 }}
                transition={{ type: "spring", damping: 10, delay: 0.2 }}
                d="M 100,140 C 140,110 150,55 115,55 C 100,75 95,110 100,140"
                fill={colors.primary}
                style={{ transformOrigin: "100px 140px" }}
              />
              {/* Front Center Petal */}
              <motion.path
                initial={{ scale: 0.2 }}
                animate={isBlooming ? { scale: 1 } : { scale: 0.2 }}
                transition={{ type: "spring", stiffness: 70, delay: 0.3 }}
                d="M 100,140 C 75,120 75,70 100,75 C 125,70 125,120 100,140"
                fill={colors.primary}
                style={{ transformOrigin: "100px 140px" }}
                filter="brightness(1.1)"
              />
            </g>
          </g>
        );

      case "Sunflower":
        return (
          <g>
            {/* Stem */}
            <path
              d="M 100,120 C 100,160 100,190 100,240"
              fill="none"
              stroke="#15803d"
              strokeWidth="5.5"
            />
            {/* Leaves */}
            <path d="M 100,160 Q 130,150 140,170 Q 115,185 100,160" fill="#166534" />
            
            {/* Radiating Petals */}
            <g transform="translate(100,110)">
              {Array.from({ length: 16 }).map((_, i) => {
                const angle = (i * 360) / 16;
                return (
                  <g key={i} transform={`rotate(${angle})`}>
                    <motion.path
                      initial={{ scaleY: 0, scaleX: 0 }}
                      animate={isBlooming ? { scaleY: 1, scaleX: 1 } : { scaleY: 0, scaleX: 0 }}
                      transition={{ type: "spring", stiffness: 80, delay: i * 0.03 }}
                      d="M 0,0 C -12,-30 -8,-75 0,-85 C 8,-75 12,-30 0,0"
                      fill={i % 2 === 0 ? colors.primary : colors.secondary}
                      style={{ transformOrigin: "0px 0px" }}
                    />
                  </g>
                );
              })}
              
              {/* Seed Disk Center */}
              <motion.circle
                initial={{ scale: 0 }}
                animate={isBlooming ? { scale: 1 } : { scale: 0 }}
                transition={{ delay: 0.5, type: "spring" }}
                r="34"
                fill="#451a03"
                stroke="#ca8a04"
                strokeWidth="2.5"
                strokeDasharray="4 2"
                style={{ transformOrigin: "0px 0px" }}
              />
              <circle r="22" fill="#171717" />
              <circle r="12" fill="#2d1202" />
            </g>
          </g>
        );

      case "Orchid":
        return (
          <g>
            {/* Slender green stem */}
            <path
              d="M 100,130 C 110,170 95,200 100,240"
              fill="none"
              stroke="#15803d"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Beautiful multi-lobed orchid parts with a blooming offset */}
            <g transform="translate(100,120)">
              {/* Large Back Petals (3 points) */}
              {[-120, 120, 0].map((angle, i) => (
                <g key={`back-g-${i}`} transform={`rotate(${angle})`}>
                  <motion.path
                    initial={{ scale: 0 }}
                    animate={isBlooming ? { scale: 1 } : { scale: 0 }}
                    transition={{ type: "spring", delay: 0.1 * i }}
                    d="M 0,0 C -25,-40 -15,-70 0,-70 C 15,-70 25,-40 0,0"
                    fill={colors.secondary}
                    style={{ transformOrigin: "0px 0px" }}
                  />
                </g>
              ))}
              
              {/* Broad Wing Petals (2 side wings) */}
              {[-60, 60].map((angle, i) => (
                <g key={`wing-g-${i}`} transform={`scale(${angle === 60 ? -1 : 1}, 1) rotate(-45)`}>
                  <motion.path
                    initial={{ scale: 0, scaleY: 0.5 }}
                    animate={isBlooming ? { scale: 1, scaleY: 1 } : { scale: 0 }}
                    transition={{ type: "spring", delay: 0.25 + 0.05 * i }}
                    d="M 0,0 C -45,-15 -55,-40 -20,-50 C 10,-35 25,-15 0,0"
                    fill={colors.primary}
                    style={{ transformOrigin: "0px 0px" }}
                  />
                </g>
              ))}

              {/* Central Labellum (Lip petal) */}
              <motion.path
                initial={{ scale: 0, y: -10 }}
                animate={isBlooming ? { scale: 1, y: 0 } : { scale: 0 }}
                transition={{ type: "spring", stiffness: 100, delay: 0.45 }}
                d="M 0,0 C -24,10 -20,40 0,38 C 20,40 24,10 0,0"
                fill="#facc15" // Orchid lip center is gold / yellow
                stroke={colors.primary}
                strokeWidth="2"
                style={{ transformOrigin: "0px 0px" }}
              />
              {/* Little detail block */}
              <circle cx="0" cy="10" r="5" fill="#f43f5e" />
            </g>
          </g>
        );

      case "Daisy":
        return (
          <g>
            {/* Stem */}
            <path
              d="M 100,120 Q 95,160 100,240"
              fill="none"
              stroke="#15803d"
              strokeWidth="4.5"
            />
            {/* Circular arrangement of tiny petals */}
            <g transform="translate(100,110)">
              {Array.from({ length: 20 }).map((_, i) => {
                const angle = (i * 360) / 20;
                return (
                  <g key={i} transform={`rotate(${angle})`}>
                    <motion.path
                      initial={{ scaleY: 0 }}
                      animate={isBlooming ? { scaleY: 1 } : { scaleY: 0 }}
                      transition={{ type: "spring", delay: i * 0.02 }}
                      d="M 0,0 C -6,-30 -4,-70 0,-75 C 4,-70 6,-30 0,0"
                      fill={colors.primary}
                      style={{ transformOrigin: "0px 0px" }}
                    />
                  </g>
                );
              })}
              {/* Center Disk */}
              <motion.circle
                initial={{ scale: 0 }}
                animate={isBlooming ? { scale: 1 } : { scale: 0 }}
                transition={{ type: "spring", delay: 0.45 }}
                r="22"
                fill="#facc15" // Yellow disk
                stroke="#eab308"
                strokeWidth="2.5"
                style={{ transformOrigin: "0px 0px" }}
              />
              <circle r="14" fill="#ca8a04" opacity="0.4" />
            </g>
          </g>
        );

      case "Lotus":
        return (
          <g>
            {/* Broad leaf underneath */}
            <motion.ellipse
              initial={{ scaleX: 0 }}
              animate={isBlooming ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ delay: 0.2 }}
              cx="100"
              cy="185"
              rx="65"
              ry="18"
              fill="#065f46"
              style={{ transformOrigin: "100px 185px" }}
            />
            {/* Hidden Stem */}
            <path d="M 100,175 L 100,240" fill="none" stroke="#047857" strokeWidth="6" />

            <g transform="translate(100,160)">
              {/* Back petal spray */}
              {[-70, -45, -20, 0, 20, 45, 70].map((angle, i) => (
                <g key={`lotus-back-g-${i}`} transform={`rotate(${angle})`}>
                  <motion.path
                    initial={{ scale: 0 }}
                    animate={isBlooming ? { scale: 1 } : { scale: 0 }}
                    transition={{ type: "spring", stiffness: 60, delay: 0.05 * i }}
                    d="M 0,15 C -20,-10 -25,-60 0,-70 C 25,-60 20,-10 0,15"
                    fill={colors.secondary}
                    style={{ transformOrigin: "0px 15px" }}
                  />
                </g>
              ))}

              {/* Mid Layer golden core inside */}
              {[-30, 0, 30].map((angle, i) => (
                <g key={`lotus-mid-g-${i}`} transform={`rotate(${angle})`}>
                  <motion.path
                    initial={{ scale: 0 }}
                    animate={isBlooming ? { scale: 1 } : { scale: 0 }}
                    transition={{ type: "spring", stiffness: 70, delay: 0.3 + 0.05 * i }}
                    d="M 0,10 C -18,-15 -20,-55 0,-62 C 20,-55 18,-15 0,10"
                    fill={colors.primary}
                    style={{ transformOrigin: "0px 10px" }}
                  />
                </g>
              ))}

              {/* Front central petals */}
              <motion.path
                initial={{ scale: 0 }}
                animate={isBlooming ? { scale: 1 } : { scale: 0 }}
                transition={{ type: "spring", stiffness: 100, delay: 0.45 }}
                d="M 0,10 C -15,-5 -15,-45 0,-50 C 15,-45 15,-5 0,10"
                fill={colors.primary}
                filter="brightness(1.15)"
                style={{ transformOrigin: "0px 10px" }}
              />
            </g>
          </g>
        );

      case "Cherry Blossom":
        return (
          <g>
            {/* Elegant twig-like stem */}
            <path
              d="M 100,130 C 105,160 85,190 100,240"
              fill="none"
              stroke="#451a03"
              strokeWidth="5.5"
              strokeLinecap="round"
            />
            {/* Individual petals of cherry blossom */}
            <g transform="translate(100,115)">
              {Array.from({ length: 5 }).map((_, i) => {
                const angle = i * 72;
                return (
                  <g key={i} transform={`rotate(${angle})`}>
                    <motion.path
                      initial={{ scale: 0 }}
                      animate={isBlooming ? { scale: 1 } : { scale: 0 }}
                      transition={{ type: "spring", stiffness: 85, delay: i * 0.08 }}
                      d="M 0,0 C -22,-15 -28,-48 -10,-55 C 0,-45 0,-25 0,0 C 0,-25 0,-45 10,-55 C 28,-48 22,-15 0,0"
                      fill={colors.primary}
                      style={{ transformOrigin: "0px 0px" }}
                    />
                  </g>
                );
              })}
              
              {/* Dynamic Center Stamens */}
              <motion.g
                initial={{ scale: 0 }}
                animate={isBlooming ? { scale: 1 } : { scale: 0 }}
                transition={{ delay: 0.45 }}
                style={{ transformOrigin: "0px 0px" }}
              >
                {Array.from({ length: 12 }).map((_, j) => {
                  const sa = j * 30;
                  return (
                    <line
                      key={j}
                      x1="0"
                      y1="0"
                      x2={18 * Math.cos((sa * Math.PI) / 180)}
                      y2={18 * Math.sin((sa * Math.PI) / 180)}
                      stroke="#facc15"
                      strokeWidth="1.5"
                    />
                  );
                })}
                <circle cx="0" cy="0" r="5" fill="#e11d48" />
              </motion.g>
            </g>
          </g>
        );

      case "Mixed Bouquet":
      default:
        return (
          <g>
            {/* Wrapping paper behind */}
            <motion.path
              initial={{ scaleY: 0 }}
              animate={isBlooming ? { scaleY: 1 } : { scaleY: 0 }}
              transition={{ delay: 0.1, type: "spring" }}
              d="M 50,165 Q 100,250 150,165 Q 130,225 100,240 Q 70,225 50,165"
              fill="#fed7aa" // peach colored wrapping paper
              stroke="#fb923c"
              strokeWidth="2.5"
              style={{ transformOrigin: "100px 240px" }}
            />
            {/* Multiple stems */}
            <path d="M 85,150 L 100,230 M 100,140 Q 100,195 102,230 M 115,150 L 100,230" stroke="#166534" strokeWidth="4.5" />

            {/* Left flower (Rose) */}
            <g transform="translate(75, 125) scale(0.65)">
              <motion.circle
                initial={{ scale: 0 }}
                animate={isBlooming ? { scale: 1 } : { scale: 0 }}
                transition={{ type: "spring", delay: 0.3 }}
                r="38"
                fill={colors.secondary}
                style={{ transformOrigin: "0px 0px" }}
              />
              <circle r="22" fill={colors.primary} />
              <circle r="12" fill="#fff" opacity="0.2" />
            </g>

            {/* Right flower (Daisy) */}
            <g transform="translate(125, 125) scale(0.6)">
              {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i * 360) / 8;
                return (
                  <g key={i} transform={`rotate(${angle})`}>
                    <motion.ellipse
                      initial={{ scale: 0 }}
                      animate={isBlooming ? { scale: 1 } : { scale: 0 }}
                      transition={{ type: "spring", delay: 0.4 + i * 0.05 }}
                      cx="0"
                      cy="-24"
                      rx="10"
                      ry="24"
                      fill={colors.primary}
                      style={{ transformOrigin: "0px 0px" }}
                    />
                  </g>
                );
              })}
              <circle cx="0" cy="0" r="14" fill="#facc15" />
            </g>

            {/* Center Main Flower (Tulip) */}
            <g transform="translate(100, 100) scale(0.85)">
              <motion.path
                initial={{ scaleY: 0 }}
                animate={isBlooming ? { scaleY: 1 } : { scaleY: 0 }}
                transition={{ type: "spring", delay: 0.5 }}
                d="M 0,35 C -30,25 -30,-25 0,-30 C 30,-25 30,25 0,35"
                fill={colors.primary}
                style={{ transformOrigin: "0px 0px" }}
              />
              <path d="M -15,10 C -25,-10 -5,-35 0,-15 C 5,-35 25,-10 15,10 Z" fill={colors.secondary} />
            </g>

            {/* Wrapping paper ribbon/bow in front */}
            <motion.path
              initial={{ scale: 0 }}
              animate={isBlooming ? { scale: 1 } : { scale: 0 }}
              transition={{ delay: 0.6, type: "spring" }}
              d="M 85,210 C 95,200 105,200 115,210 Q 100,225 85,210"
              fill="#f43f5e" // ribbon pink/red
              style={{ transformOrigin: "100px 210px" }}
            />
            {/* Draw active ribbon loops */}
            <g transform="rotate(-30 80 210)">
              <motion.ellipse
                initial={{ scale: 0 }}
                animate={isBlooming ? { scale: 1 } : { scale: 0 }}
                transition={{ delay: 0.65 }}
                cx="80" cy="210" rx="10" ry="6" fill="#ec4899"
                style={{ transformOrigin: "80px 210px" }}
              />
            </g>
            <g transform="rotate(30 120 210)">
              <motion.ellipse
                initial={{ scale: 0 }}
                animate={isBlooming ? { scale: 1 } : { scale: 0 }}
                transition={{ delay: 0.68 }}
                cx="120" cy="210" rx="10" ry="6" fill="#ec4899"
                style={{ transformOrigin: "120px 210px" }}
              />
            </g>
          </g>
        );
    }
  };

  return (
    <div className="relative w-full max-w-[280px] aspect-[4/5] mx-auto flex items-center justify-center">
      {/* Glow aura in background mapping to colors.glow */}
      <motion.div
        className="absolute w-44 h-44 rounded-full blur-3xl pointer-events-none"
        style={{ background: colors.glow }}
        animate={isBlooming ? { scale: [0.8, 1.25, 1], opacity: [0.3, 0.8, 0.6] } : { scale: 0.8, opacity: 0 }}
        transition={{ duration: 3, ease: "easeOut" }}
      />

      {/* Floating Sparkles and Petal elements */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.id % 2 === 0 ? colors.primary : "#fef08a",
            opacity: 0,
            boxShadow: `0 0 ${p.size}px ${p.id % 2 === 0 ? colors.glow : "rgba(254, 240, 138, 0.4)"}`,
          }}
          animate={
            isBlooming
              ? {
                  y: [120, -150],
                  x: [0, (p.id % 2 === 0 ? 30 : -30)],
                  opacity: [0, 0.9, 0],
                  scale: [0.4, 1.1, 0.2],
                  rotate: [0, 360],
                }
              : {}
          }
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* The main SVG stage */}
      <svg
        id="flower-svg"
        viewBox="0 0 200 240"
        className="w-full h-full object-contain filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.15)] z-10"
      >
        {renderFlowerSVG()}
      </svg>
    </div>
  );
}
