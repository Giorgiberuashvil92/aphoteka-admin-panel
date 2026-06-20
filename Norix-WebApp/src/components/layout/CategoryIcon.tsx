import {
  Activity,
  Baby,
  Bandage,
  BedDouble,
  FlaskConical,
  Flower2,
  Folder,
  Gift,
  Heart,
  Home,
  Leaf,
  Pill,
  ShieldCheck,
  ShoppingBasket,
  Smile,
  Sparkles,
  Stethoscope,
  User,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  heart: Heart,
  sparkles: Sparkles,
  happy: Smile,
  rose: Flower2,
  man: User,
  medical: Pill,
  bandage: Bandage,
  pulse: Activity,
  nutrition: Leaf,
  bed: BedDouble,
  flask: FlaskConical,
  "shield-checkmark": ShieldCheck,
  shield: ShieldCheck,
  folder: Folder,
  gift: Gift,
  food: ShoppingBasket,
  home: Home,
  baby: Baby,
  stethoscope: Stethoscope,
};

interface CategoryIconProps {
  icon?: string;
  className?: string;
}

export function CategoryIcon({ icon, className = "h-6 w-6" }: CategoryIconProps) {
  const Icon = (icon && ICON_MAP[icon]) || Folder;
  return <Icon className={className} strokeWidth={1.75} />;
}
