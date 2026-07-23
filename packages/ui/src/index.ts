// Root entry: utilities and CVA variant maps. Components are imported per
// file ("@mia/ui/components/button") so apps only bundle what they use.
export { cn } from "./lib/utils";
export { getAvatarInitial, getAvatarTile, isPlaceholderLogoUrl } from "./lib/avatar";
export * from "./styles/ui/buttons";
export * from "./styles/ui/input";
export { useIsMobile } from "./hooks/useIsMobile";
