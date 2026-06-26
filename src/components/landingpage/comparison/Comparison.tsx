"use client";

import * as React from "react";
import { useState } from "react";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import "./Comparison.css";

// --- Utility Function (from @/lib/utils) ---

/**
 * A utility function to conditionally join class names.
 * Requires `clsx` and `tailwind-merge` to be installed.
 * `npm install clsx tailwind-merge`
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Card Components ---

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function AnimatedCard({ className, ...props }: CardProps) {
  return (
    <div
      role="region"
      aria-labelledby="card-title"
      aria-describedby="card-description"
      className={cn(
        "group/animated-card relative w-[356px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-900 dark:bg-black",
        className
      )}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }: CardProps) {
  return (
    <div
      role="group"
      className={cn(
        "flex flex-col space-y-1.5 border-t border-zinc-200 p-4 dark:border-zinc-900",
        className
      )}
      {...props}
    />
  );
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn(
        "text-lg font-semibold leading-none tracking-tight text-black dark:text-white",
        className
      )}
      {...props}
    />
  );
}

interface CardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

export function CardDescription({ className, ...props }: CardDescriptionProps) {
  return (
    <p
      className={cn(
        "text-sm text-neutral-500 dark:text-neutral-400",
        className
      )}
      {...props}
    />
  );
}

export function CardVisual({ className, ...props }: CardProps) {
  return (
    <div
      className={cn("h-[180px] w-[356px] overflow-hidden", className)}
      {...props}
    />
  );
}

// --- Visual3 Component and its Sub-components ---

interface Visual3Props {
  mainColor?: string;
  secondaryColor?: string;
  gridColor?: string;
  hovered: boolean;
  capsules?: { label: string; color: string }[];
  hoverCapsules?: { label: string; color: string }[];
}

export const Visual3 = React.memo(({
  mainColor = "#8b5cf6",
  secondaryColor = "#fbbf24",
  gridColor = "#80808015",
  hovered,
  capsules,
  hoverCapsules,
}: Visual3Props) => {
  const overlayStyle = React.useMemo(() => ({
    "--color": mainColor,
    "--secondary-color": secondaryColor,
  } as React.CSSProperties), [mainColor, secondaryColor]);

  return (
    <>
      <div
        className="absolute inset-0 z-20"
        style={overlayStyle}
      />

      <div className="relative h-[180px] w-[356px] overflow-hidden rounded-t-lg">
        <Layer4
          color={mainColor}
          secondaryColor={secondaryColor}
          hovered={hovered}
        />
        <Layer3 color={mainColor} />
        <Layer2 color={mainColor} />
        <Layer1
          color={mainColor}
          secondaryColor={secondaryColor}
          hovered={hovered}
          capsules={capsules}
          hoverCapsules={hoverCapsules}
        />
        <EllipseGradient color={mainColor} />
        <GridLayer color={gridColor} />
      </div>
    </>
  );
});

interface LayerProps {
  color: string;
  secondaryColor?: string;
  hovered?: boolean;
}

const GridLayer = React.memo(({ color }: { color: string }) => {
  const style = React.useMemo(() => ({ "--grid-color": color } as React.CSSProperties), [color]);
  return (
    <div
      style={style}
      className="pointer-events-none absolute inset-0 z-[4] h-full w-full bg-transparent bg-[linear-gradient(to_right,var(--grid-color)_1px,transparent_1px),linear-gradient(to_bottom,var(--grid-color)_1px,transparent_1px)] bg-[size:20px_20px] bg-center opacity-70 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]"
    />
  );
});

const EllipseGradient = React.memo(({ color }: { color: string }) => {
  return (
    <div className="absolute inset-0 z-[5] flex h-full w-full items-center justify-center">
      <svg
        width="356"
        height="196"
        viewBox="0 0 356 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="356" height="180" fill="url(#paint0_radial_12_207)" />
        <defs>
          <radialGradient
            id="paint0_radial_12_207"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(178 98) rotate(90) scale(98 178)"
          >
            <stop stopColor={color} stopOpacity="0.25" />
            <stop offset="0.34" stopColor={color} stopOpacity="0.15" />
            <stop offset="1" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
});

const Layer1 = React.memo(({
  color,
  secondaryColor,
  hovered,
  capsules,
  hoverCapsules,
}: LayerProps & {
  capsules?: { label: string; color: string }[];
  hoverCapsules?: { label: string; color: string }[];
}) => {
  const style = React.useMemo(() => ({
    "--color": color,
    "--secondary-color": secondaryColor,
  } as React.CSSProperties), [color, secondaryColor]);

  const activeCapsules = hovered ? hoverCapsules : capsules;

  if (!activeCapsules || activeCapsules.length === 0) return null;

  return (
    <div
      className="absolute top-4 left-4 z-[8] flex items-center gap-1"
      style={style}
    >
      {activeCapsules.map((cap, idx) => (
        <div
          key={idx}
          className="flex shrink-0 items-center rounded-full border border-zinc-200 bg-white/25 px-1.5 py-0.5 backdrop-blur-sm transition-opacity duration-300 ease-in-out dark:border-zinc-800 dark:bg-black/25"
        >
          <div
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: cap.color }}
          />
          <span className="ml-1 text-[10px] text-black dark:text-white">
            {cap.label}
          </span>
        </div>
      ))}
    </div>
  );
});

const Layer2 = React.memo(({ color }: { color: string }) => {
  const style = React.useMemo(() => ({ "--color": color } as React.CSSProperties), [color]);
  return (
    <div
      className="group relative h-full w-[356px]"
      style={style}
    >
      <div className="ease-[cubic-bezier(0.6, 0.6, 0, 1)] absolute inset-0 z-[7] flex w-[356px] translate-y-full items-start justify-center bg-transparent p-4 transition-transform duration-500 group-hover/animated-card:translate-y-0">
        <div className="ease-[cubic-bezier(0.6, 0, 1)] rounded-md border border-zinc-200 bg-white/25 p-1.5 opacity-0 backdrop-blur-sm transition-opacity duration-500 group-hover/animated-card:opacity-100 dark:border-zinc-800 dark:bg-black/25">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 shrink-0 rounded-full bg-[var(--color)]" />
            <p className="text-xs text-black dark:text-white">
              Random Data Visualization
            </p>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Displaying some interesting stats.
          </p>
        </div>
      </div>
    </div>
  );
});

const Layer3 = React.memo(({ color }: { color: string }) => {
  return (
    <div className="ease-[cubic-bezier(0.6, 0.6, 0, 1)] absolute inset-0 z-[6] flex translate-y-full items-center justify-center opacity-0 transition-all duration-500 group-hover/animated-card:translate-y-0 group-hover/animated-card:opacity-100">
      <svg
        width="356"
        height="180"
        viewBox="0 0 356 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="356" height="180" fill="url(#paint0_linear_29_3)" />
        <defs>
          <linearGradient
            id="paint0_linear_29_3"
            x1="178"
            y1="0"
            x2="178"
            y2="180"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0.35" stopColor={color} stopOpacity="0" />
            <stop offset="1" stopColor={color} stopOpacity="0.3" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
});

const Layer4 = React.memo(({ color, secondaryColor, hovered }: LayerProps) => {
  const rectsData = React.useMemo(() => [
    {
      width: 15,
      height: 20,
      y: 110,
      hoverHeight: 20,
      hoverY: 130,
      x: 40,
      fill: "currentColor",
      hoverFill: secondaryColor,
    },
    {
      width: 15,
      height: 20,
      y: 90,
      hoverHeight: 20,
      hoverY: 130,
      x: 60,
      fill: color,
      hoverFill: color,
    },
    {
      width: 15,
      height: 40,
      y: 70,
      hoverHeight: 30,
      hoverY: 120,
      x: 80,
      fill: color,
      hoverFill: color,
    },
    {
      width: 15,
      height: 30,
      y: 80,
      hoverHeight: 50,
      hoverY: 100,
      x: 100,
      fill: color,
      hoverFill: color,
    },
    {
      width: 15,
      height: 30,
      y: 110,
      hoverHeight: 40,
      hoverY: 110,
      x: 120,
      fill: "currentColor",
      hoverFill: secondaryColor,
    },
    {
      width: 15,
      height: 50,
      y: 110,
      hoverHeight: 20,
      hoverY: 130,
      x: 140,
      fill: "currentColor",
      hoverFill: secondaryColor,
    },
    {
      width: 15,
      height: 50,
      y: 60,
      hoverHeight: 30,
      hoverY: 120,
      x: 160,
      fill: color,
      hoverFill: color,
    },
    {
      width: 15,
      height: 30,
      y: 80,
      hoverHeight: 20,
      hoverY: 130,
      x: 180,
      fill: color,
      hoverFill: color,
    },
    {
      width: 15,
      height: 20,
      y: 110,
      hoverHeight: 40,
      hoverY: 110,
      x: 200,
      fill: "currentColor",
      hoverFill: secondaryColor,
    },
    {
      width: 15,
      height: 40,
      y: 70,
      hoverHeight: 60,
      hoverY: 90,
      x: 220,
      fill: color,
      hoverFill: color,
    },
    {
      width: 15,
      height: 30,
      y: 110,
      hoverHeight: 70,
      hoverY: 80,
      x: 240,
      fill: "currentColor",
      hoverFill: secondaryColor,
    },
    {
      width: 15,
      height: 50,
      y: 110,
      hoverHeight: 50,
      hoverY: 100,
      x: 260,
      fill: "currentColor",
      hoverFill: secondaryColor,
    },
    {
      width: 15,
      height: 20,
      y: 110,
      hoverHeight: 80,
      hoverY: 70,
      x: 280,
      fill: "currentColor",
      hoverFill: secondaryColor,
    },
    {
      width: 15,
      height: 30,
      y: 80,
      hoverHeight: 90,
      hoverY: 60,
      x: 300,
      fill: color,
      hoverFill: color,
    },
  ], [color, secondaryColor]);

  return (
    <div className="ease-[cubic-bezier(0.6, 0.6, 0, 1)] absolute inset-0 z-[8] flex h-[180px] w-[356px] items-center justify-center text-neutral-800/10 transition-transform duration-500 group-hover/animated-card:scale-150 dark:text-white/15">
      <svg width="356" height="180" xmlns="http://www.w3.org/2000/svg">
        {rectsData.map((rect, index) => (
          <rect
            key={index}
            width={rect.width}
            height={hovered ? rect.hoverHeight : rect.height}
            x={rect.x}
            y={hovered ? rect.hoverY : rect.y}
            fill={hovered ? rect.hoverFill : rect.fill}
            rx="2"
            ry="2"
            className="ease-[cubic-bezier(0.6, 0.6, 0, 1)] transition-all duration-500"
          />
        ))}
      </svg>
    </div>
  );
});

// --- Individual Card Wrapper with hover states and text swapping ---

interface ComparisonCardProps {
  category: string;
  competitorTitle: string;
  competitorDesc: string;
  physicaTitle: string;
  physicaDesc: string;
  capsules: { label: string; color: string }[];
  hoverCapsules: { label: string; color: string }[];
}

const ComparisonCard = React.memo(({
  competitorTitle,
  competitorDesc,
  physicaTitle,
  physicaDesc,
  capsules,
  hoverCapsules,
}: ComparisonCardProps) => {
  const [hovered, setHovered] = useState(false);

  const handleMouseEnter = React.useCallback(() => setHovered(true), []);
  const handleMouseLeave = React.useCallback(() => setHovered(false), []);

  return (
    <AnimatedCard
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <CardVisual>
        <Visual3
          hovered={hovered}
          capsules={capsules}
          hoverCapsules={hoverCapsules}
        />
      </CardVisual>
      <CardBody>
        <CardTitle>{hovered ? physicaTitle : competitorTitle}</CardTitle>
        <CardDescription>
          {hovered ? physicaDesc : competitorDesc}
        </CardDescription>
      </CardBody>
    </AnimatedCard>
  );
});

// --- Main Comparison Component (renders 3-3 grid of 6 custom comparison cards) ---

export function Comparison() {
  const comparisonData: ComparisonCardProps[] = [
    {
      category: "scope",
      competitorTitle: "General Knowledge Focus",
      competitorDesc: "General assistants are designed for general conversational tasks, producing generic text with limited physics depth.",
      physicaTitle: "Physica AI: Physics Grounded",
      physicaDesc: "Architected specifically for physics research. Expertly interprets complex equations and extracts novel scientific contributions.",
      capsules: [
        { label: "GPT-4: General", color: "#ef4444" },
        { label: "Claude: General", color: "#f97316" }
      ],
      hoverCapsules: [
        { label: "Physica: Focused", color: "#10b981" },
        { label: "100% Physics RAG", color: "#3b82f6" }
      ]
    },
    {
      category: "speed",
      competitorTitle: "Competitor Response Speed",
      competitorDesc: "Retrieving, reading, and synthesizing queries across multiple research papers manually takes 10 to 15 seconds.",
      physicaTitle: "Physica AI: Parallel Inference",
      physicaDesc: "Executes citation parsing, mathematical verification, and data retrieval in parallel, responding in under 3 seconds.",
      capsules: [
        { label: "GPT-4: ~15s", color: "#ef4444" },
        { label: "Claude: ~12s", color: "#f97316" }
      ],
      hoverCapsules: [
        { label: "Physica: ~2.8s", color: "#10b981" },
        { label: "Speedup: 5x+", color: "#3b82f6" }
      ]
    },
    {
      category: "quality",
      competitorTitle: "Standard Web Corpora",
      competitorDesc: "General AI models are trained on unstructured web scrapes, resulting in inaccurate variables or constants.",
      physicaTitle: "Physica AI: 10M+ Physics Papers",
      physicaDesc: "Trained and evaluated on over 10M+ verified physics research papers, arXiv archives, constants, and math textbooks.",
      capsules: [
        { label: "GPT: Web Scrapes", color: "#ef4444" },
        { label: "Claude: Mixed Media", color: "#f97316" }
      ],
      hoverCapsules: [
        { label: "Physica: Verified DB", color: "#10b981" },
        { label: "10M+ Papers", color: "#3b82f6" }
      ]
    },
    {
      category: "discovery",
      competitorTitle: "Manual Document Search",
      competitorDesc: "Requires the researcher to manually locate research articles on external databases and copy-paste text or upload PDFs.",
      physicaTitle: "Physica AI: Auto Discovery",
      physicaDesc: "Integrated feed semantic search. Instantly navigates publication indexes, traces similar work, and retrieves citations.",
      capsules: [
        { label: "GPT: User Uploads", color: "#ef4444" },
        { label: "Claude: Manual Lookups", color: "#f97316" }
      ],
      hoverCapsules: [
        { label: "Physica: Semantic index", color: "#10b981" },
        { label: "Direct Feed Access", color: "#3b82f6" }
      ]
    },
    {
      category: "citations",
      competitorTitle: "Citation Hallucinations",
      competitorDesc: "General-purpose assistants frequently hallucinate citations, invent papers, and make wrong attributions.",
      physicaTitle: "Physica AI: Citation Grounded",
      physicaDesc: "Every response is strictly grounded in indexed publication bodies, ensuring fully referenced claims with 0% hallucinations.",
      capsules: [
        { label: "GPT: 20% Halluc.", color: "#ef4444" },
        { label: "Claude: Loose Citations", color: "#f97316" }
      ],
      hoverCapsules: [
        { label: "Physica: 0% Halluc.", color: "#10b981" },
        { label: "Strictly Grounded", color: "#3b82f6" }
      ]
    },
    {
      category: "simulations",
      competitorTitle: "Static Projections",
      competitorDesc: "Competitor models offer static textual descriptions without calculation environments or live interactive dynamics.",
      physicaTitle: "Physica AI: Live Simulations",
      physicaDesc: "Computes physical equations and models live interactive simulations down to individual atoms.",
      capsules: [
        { label: "GPT: Static Text Only", color: "#ef4444" },
        { label: "Claude: No Sandbox", color: "#f97316" }
      ],
      hoverCapsules: [
        { label: "Physica: Live Sandbox", color: "#10b981" },
        { label: "Atomic Simulation", color: "#3b82f6" }
      ]
    }
  ];

  return (
    <section className="comparison-section" id="comparison">
      <div className="comparison-container">
        <h2 className="comparison-section-title" id="comparison-title">
          Performance Benchmarks
        </h2>
        <p className="comparison-section-subtitle" id="comparison-subtitle">
          Comparing our physics research engine against industry standards and general AI models.
        </p>

        <div className="comparison-hint-capsule" id="comparison-hint">
          <svg className="hint-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block' }}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
          <span>Hover cards to see comparison</span>
        </div>

        <div className="comparison-grid">
          {comparisonData.map((data, index) => (
            <ComparisonCard key={index} {...data} />
          ))}
        </div>
      </div>
    </section>
  );
}
