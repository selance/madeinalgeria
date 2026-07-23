import { cva } from "class-variance-authority";

// Editorial buttons — flat fills, no bevel overlays. A solid button carries
// a hard 2px bottom edge INSIDE its box (border-b-2 in the scale's dark step)
// so every variant is exactly the same outer height; pressing hides the edge
// and darkens the fill. Outline is a crisp 1.5px rule; ghost is bare text
// that takes a faint tint on hover.
// Variant keys and sizes are the stable public API — restyle, never rename.

// Primary button styles (ink)
const primarystyles = {
  solid:
    "bg-primary-500 text-neutral-50 border-b-2 border-b-primary-800 hover:bg-primary-600 active:border-b-transparent active:bg-primary-700",
  outline:
    "bg-transparent border-[1.5px] border-primary-500 text-primary-600 hover:bg-primary-500/5 active:bg-primary-500/10",
  ghost:
    "outline-none text-primary-500 hover:bg-primary-500/5 active:bg-primary-500/10 hover:text-primary-600 active:text-primary-700",
};

// secondary button styles (vermilion accent)
const secondarystyles = {
  solid:
    "bg-secondary-500 text-neutral-50 border-b-2 border-b-secondary-800 hover:bg-secondary-600 active:border-b-transparent active:bg-secondary-700",
  outline:
    "bg-transparent border-[1.5px] border-secondary-500 text-secondary-600 hover:bg-secondary-50 active:bg-secondary-100",
  ghost:
    "outline-none text-secondary-600 hover:bg-secondary-500/10 active:bg-secondary-500/15 hover:text-secondary-700 active:text-secondary-800",
};

// dark button styles
const darkstyles = {
  solid:
    "bg-neutral-800 text-neutral-50 border-b-2 border-b-neutral-950 hover:bg-neutral-900 active:border-b-transparent active:bg-neutral-950",
  outline:
    "bg-transparent border-[1.5px] border-neutral-800 text-neutral-800 hover:bg-neutral-800/5 active:bg-neutral-800/10",
  ghost:
    "outline-none text-neutral-700 hover:bg-neutral-700/10 active:bg-neutral-700/15 hover:text-neutral-800 active:text-neutral-900",
};

// light button styles
const lightstyles = {
  solid:
    "bg-neutral-100 border border-neutral-200 border-b-2 border-b-neutral-300 text-neutral-700 hover:bg-neutral-200 active:border-b-transparent active:bg-neutral-200",
  outline:
    "bg-transparent border-[1.5px] border-neutral-300 text-neutral-500 hover:bg-neutral-100 active:bg-neutral-200 hover:text-neutral-600 active:text-neutral-700",
  ghost:
    "outline-none text-neutral-500 hover:bg-neutral-300/20 active:bg-neutral-300/30 hover:text-neutral-600 active:text-neutral-700",
};

// white button styles
const whitestyles = {
  solid:
    "bg-white border border-neutral-200 border-b-2 border-b-neutral-300 text-neutral-700 hover:bg-neutral-50 active:border-b-transparent active:bg-neutral-100",
};

// success button styles
const successstyles = {
  solid:
    "bg-success-500 text-neutral-50 border-b-2 border-b-success-800 hover:bg-success-600 active:border-b-transparent active:bg-success-700",
  outline:
    "bg-transparent border-[1.5px] border-success-500 text-success-600 hover:bg-success-50 active:bg-success-100",
  ghost:
    "outline-none text-success-600 hover:bg-success-500/10 active:bg-success-500/15 hover:text-success-700 active:text-success-800",
};

// error button styles
const errorstyles = {
  solid:
    "bg-error-500 text-neutral-50 border-b-2 border-b-error-800 hover:bg-error-600 active:border-b-transparent active:bg-error-700",
  outline:
    "bg-transparent border-[1.5px] border-error-500 text-error-600 hover:bg-error-50 active:bg-error-100",
  ghost:
    "outline-none text-error-600 hover:bg-error-500/10 active:bg-error-500/15 hover:text-error-700 active:text-error-800",
};

// warning button styles
const warningstyles = {
  solid:
    "bg-warning-500 text-neutral-50 border-b-2 border-b-warning-800 hover:bg-warning-600 active:border-b-transparent active:bg-warning-700",
  outline:
    "bg-transparent border-[1.5px] border-warning-600 text-warning-700 hover:bg-warning-50 active:bg-warning-100",
  ghost:
    "outline-none text-warning-700 hover:bg-warning-500/10 active:bg-warning-500/15 hover:text-warning-800 active:text-warning-900",
};

// info button styles
const infostyles = {
  solid:
    "bg-info-500 text-neutral-50 border-b-2 border-b-info-800 hover:bg-info-600 active:border-b-transparent active:bg-info-700",
  outline:
    "bg-transparent border-[1.5px] border-info-500 text-info-600 hover:bg-info-50 active:bg-info-100",
  ghost:
    "outline-none text-info-600 hover:bg-info-500/10 active:bg-info-500/15 hover:text-info-700 active:text-info-800",
};

// emerald button styles
const emeraldstyles = {
  solid:
    "bg-emerald-500 text-neutral-50 border-b-2 border-b-emerald-800 hover:bg-emerald-600 active:border-b-transparent active:bg-emerald-700",
  outline:
    "bg-transparent border-[1.5px] border-emerald-500 text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100",
  ghost:
    "outline-none text-emerald-600 hover:bg-emerald-500/10 active:bg-emerald-500/15 hover:text-emerald-700 active:text-emerald-800",
};

const sidebarIconStyles =
  "bg-white border border-neutral-200 drop-shadow-default-sm text-neutral-700 !size-[38px]";

const softRoundedButtonStyles =
  "bg-neutral-50 border border-neutral-200 !rounded-full text-neutral-600 hover:bg-neutral-100";
const softButtonStyles =
  "bg-neutral-50 border border-neutral-200 text-neutral-600 hover:bg-neutral-100";

// size styles
const sizestyles = {
  default: "h-[34px] px-3  text-sm",
  sm: "h-[32px] px-3 text-xs",
  lg: "h-[38px] px-3  text-base",
  icon: "size-[34px] px-0 ",
  "large-icon": "size-[38px] min-w-[38px] min-h-[38px] px-0 ",
  "small-icon": "size-[32px] min-w-[32px] min-h-[32px] px-0 ",
};

// button variants
export const buttonVariants = cva(
  "gap-2 rounded cursor-pointer inline-flex items-center justify-center font-medium transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50 disabled:pointer-events-none disabled:opacity-50 ",
  {
    variants: {
      variant: {
        "sidebar-icon": sidebarIconStyles,
        soft: softButtonStyles,
        "soft-rounded": softRoundedButtonStyles,
        "primary-solid": primarystyles.solid,
        "primary-outline": primarystyles.outline,
        "primary-ghost": primarystyles.ghost,
        "secondary-solid": secondarystyles.solid,
        "secondary-outline": secondarystyles.outline,
        "secondary-ghost": secondarystyles.ghost,
        "dark-solid": darkstyles.solid,
        "dark-outline": darkstyles.outline,
        "dark-ghost": darkstyles.ghost,
        "light-solid": lightstyles.solid,
        "white-solid": whitestyles.solid,
        "light-outline": lightstyles.outline,
        "light-ghost": lightstyles.ghost,
        "success-solid": successstyles.solid,
        "success-outline": successstyles.outline,
        "success-ghost": successstyles.ghost,
        "error-solid": errorstyles.solid,
        "error-outline": errorstyles.outline,
        "error-ghost": errorstyles.ghost,
        "warning-solid": warningstyles.solid,
        "warning-outline": warningstyles.outline,
        "warning-ghost": warningstyles.ghost,
        "info-solid": infostyles.solid,
        "info-outline": infostyles.outline,
        "info-ghost": infostyles.ghost,
        "emerald-solid": emeraldstyles.solid,
        "emerald-outline": emeraldstyles.outline,
        "emerald-ghost": emeraldstyles.ghost,
      },
      size: sizestyles,
    },
    defaultVariants: {
      variant: "primary-solid",
      size: "default",
    },
  },
);
