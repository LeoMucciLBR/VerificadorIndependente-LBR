
import * as React from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import { Star } from "lucide-react";

interface ExpandableCardProps {
  title: string;
  src?: string;
  description: string;
  score?: number;
  children?: React.ReactNode;
  className?: string;
  classNameExpanded?: string;
  [key: string]: any;
}

export function ExpandableCard({
  title,
  src,
  description,
  score,
  children,
  className,
  classNameExpanded,
  ...props
}: ExpandableCardProps) {
  const [active, setActive] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const id = React.useId();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // 3D State
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
      if (active || isClosing) return;
      const { left, top, width, height } = currentTarget.getBoundingClientRect();
      const xPct = (clientX - left) / width - 0.5;
      const yPct = (clientY - top) / height - 0.5;
      x.set(xPct);
      y.set(yPct);
  }

  function handleMouseLeave() {
      x.set(0);
      y.set(0);
  }

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-15deg", "15deg"]);

  // Reset 3D transforms when card is expanded
  React.useEffect(() => {
      if (active || isClosing) {
          x.set(0);
          y.set(0);
      }
  }, [active, isClosing, x, y]);

  const handleClose = () => {
    setIsClosing(true);
    setActive(false);
    setTimeout(() => {
      setIsClosing(false);
    }, 600); // Duration of layout animation
  };

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    if (active) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
       document.body.style.overflow = "";
    };
  }, [active]);

  const getScoreColor = (score?: number) => {
    if (!score && score !== 0) return "text-white";
    if (score >= 8) return "text-emerald-500";
    if (score >= 5) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <>
      {mounted && createPortal(
        <AnimatePresence>
          {active && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-md h-full w-full z-10"
            />
          )}
        </AnimatePresence>,
        document.body
      )}
      
      {mounted && createPortal(
        <AnimatePresence>
          {active && (
            <div
              className={cn(
                "fixed inset-0 grid place-items-center z-[100] p-4",
              )}
            >
              <motion.div
                layoutId={`card-${title}-${id}`}
                ref={cardRef}
                className={cn(
                  "w-full max-w-[850px] h-fit max-h-[90vh] flex flex-col overflow-y-auto overflow-x-hidden no-scrollbar [-webkit-overflow-scrolling:touch] rounded-3xl bg-zinc-50 shadow-sm dark:shadow-none dark:bg-zinc-950 relative",
                  classNameExpanded,
                )}
                {...props}
              >
                {src ? (
                    <motion.div layoutId={`image-${title}-${id}`}>
                    <div className="relative before:absolute before:inset-x-0 before:bottom-[-1px] before:h-[70px] before:z-50 before:bg-gradient-to-t dark:before:from-zinc-950 before:from-zinc-50">
                        <img
                        src={src}
                        alt={title}
                        className="w-full h-80 object-cover object-center"
                        />
                    </div>
                    </motion.div>
                ) : null}
                
                <div className="relative h-full before:fixed before:inset-x-0 before:bottom-0 before:h-[70px] before:z-50 before:bg-gradient-to-t dark:before:from-zinc-950 before:from-zinc-50">
                  <div className="flex justify-between items-start p-8 h-auto">
                    <div>
                      <motion.p
                        layoutId={`description-${description}-${id}`}
                        className="text-zinc-500 dark:text-zinc-400 text-lg"
                      >
                        {description}
                      </motion.p>
                      <motion.h3
                        layoutId={`title-${title}-${id}`}
                        className="font-semibold text-black dark:text-white text-4xl sm:text-4xl mt-0.5"
                      >
                        {title}
                      </motion.h3>
                    </div>
                    <motion.button
                      aria-label="Close card"
                      layoutId={`button-${title}-${id}`}
                      className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-950 text-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-950 dark:text-white/70 text-black/70 border border-gray-200/90 dark:border-zinc-900 hover:border-gray-300/90 hover:text-black dark:hover:text-white dark:hover:border-zinc-800 transition-colors duration-300 focus:outline-none"
                      onClick={handleClose}
                    >
                      <motion.div
                        animate={{ rotate: active ? 45 : 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 12h14" />
                          <path d="M12 5v14" />
                        </svg>
                      </motion.div>
                    </motion.button>
                  </div>
                  <div className="relative px-6 sm:px-8">
                    <motion.div
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-zinc-500 dark:text-zinc-400 text-base pb-10 flex flex-col items-start gap-4"
                    >
                      {children}
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <motion.div
        suppressHydrationWarning
        role="dialog"
        aria-labelledby={`card-title-${id}`}
        aria-modal="true"
        layoutId={`card-${title}-${id}`}
        onClick={() => setActive(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
            rotateX: (active || isClosing) ? 0 : rotateX,
            rotateY: (active || isClosing) ? 0 : rotateY,
            transformStyle: "preserve-3d",
        }}
        className={cn(
          "flex flex-col justify-between bg-zinc-50 shadow-sm dark:shadow-none dark:bg-zinc-950 rounded-2xl cursor-pointer border border-gray-200/70 dark:border-zinc-900 group",
          src ? "p-3 items-center" : "p-6 items-start h-56", // Increased height for text-only version
          className,
        )}
      >
        <div className={cn("flex flex-col w-full h-full transform-gpu", src ? "gap-4" : "justify-between")} style={{ transform: "translateZ(20px)" }}>
          {src ? (
                <motion.div layoutId={`image-${title}-${id}`}>
                <img
                    src={src}
                    alt={title}
                    className="w-64 h-56 rounded-lg object-cover object-center shadow-md group-hover:shadow-xl transition-shadow duration-300"
                />
                </motion.div>
          ) : null}
          
          <div className={cn("flex justify-between items-center w-full", !src && "items-start")}>
            <div className="flex flex-col w-full">
                

              {/* Title Section (Top) */}
              <motion.h3
                layoutId={`title-${title}-${id}`}
                className={cn(
                    "text-black dark:text-white font-bold",
                    src ? "md:text-left font-semibold" : "text-sm mb-1" // User requested text-sm
                )}
              >
                {title}
              </motion.h3>

               {/* Description Section (Middle) */}
              <motion.p
                layoutId={`description-${description}-${id}`}
                className={cn(
                    "text-zinc-500 dark:text-zinc-400 whitespace-pre-line",
                    src ? "md:text-left text-sm font-medium" : "text-[10px] mb-2 max-w-[90%] leading-tight" // User requested text-[10px]
                )}
              >
                {description}
              </motion.p>
              
              {/* Score Section (Bottom) - Only if no src (specialized layout) */}
              {!src && (
                   <motion.div 
                    layoutId={`score-${score ?? 'na'}-${id}`}
                    className="flex items-center gap-2 mt-auto"
                   >
                       {score !== undefined ? (
                         <>
                           <span className={cn("text-2xl font-bold", getScoreColor(score))}>
                               {score.toFixed(1)}
                           </span>
                           <Star className={cn("w-4 h-4 fill-current", getScoreColor(score))} />
                         </>
                       ) : (
                         <>
                           <span className="text-2xl font-bold text-zinc-400 dark:text-zinc-600">N/A</span>
                           <Star className="w-4 h-4 fill-current text-zinc-400 dark:text-zinc-600" />
                         </>
                       )}
                   </motion.div>
              )}


            </div>
            
            {/* Action Button - Only show for image cards, hide completely for text-only cards */}
            {src && (
              <motion.button
                aria-label="Open card"
                layoutId={`button-${title}-${id}`}
                className="h-6 w-6 shrink-0 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors duration-300 focus:outline-none"
              >
                <motion.div
                  animate={{ rotate: active ? 45 : 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                </motion.div>
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
