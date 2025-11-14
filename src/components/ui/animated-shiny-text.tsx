"use client";

import * as React from "react";
import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

export interface AnimatedTextProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string;
  gradientColors?: string;
  gradientAnimationDuration?: number;
  hoverEffect?: boolean;
  className?: string;
  textClassName?: string;
}

export function AnimatedText({
  text,
  gradientColors = "linear-gradient(90deg, #38bdf8, #a855f7, #38bdf8)",
  gradientAnimationDuration = 3,
  hoverEffect = false,
  className,
  textClassName,
  ...props
}: AnimatedTextProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  const textVariants: Variants = {
    initial: {
      backgroundPosition: "0 0",
    },
    animate: {
      backgroundPosition: "100% 0",
      transition: {
        duration: gradientAnimationDuration,
        repeat: Infinity,
        repeatType: "reverse" as const,
      },
    },
  };

  return (
    <div className={cn("flex items-center justify-center py-4", className)} {...props}>
      <motion.h1
        className={cn(
          "text-[2.75rem] font-semibold leading-none sm:text-[3.25rem] md:text-[3.75rem] lg:text-[4.25rem] xl:text-[4.75rem]",
          textClassName,
        )}
        style={{
          background: gradientColors,
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textShadow: isHovered ? "0 0 12px rgba(148,163,253,0.4)" : "none",
        }}
        variants={textVariants}
        initial="initial"
        animate="animate"
        onHoverStart={() => hoverEffect && setIsHovered(true)}
        onHoverEnd={() => hoverEffect && setIsHovered(false)}
      >
        {text}
      </motion.h1>
    </div>
  );
}