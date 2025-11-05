import { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  action?: React.ReactNode;
}

export function SectionHeader({ icon: Icon, title, action }: SectionHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <h4 className="text-xl font-bold flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--orange-primary))] to-[hsl(var(--orange-dark))] flex items-center justify-center shadow-md">
          <Icon className="h-5 w-5 text-white" />
        </div>
        <span className="bg-gradient-to-r from-[hsl(var(--orange-primary))] to-[hsl(var(--yellow-primary))] bg-clip-text text-transparent">
          {title}
        </span>
      </h4>
      {action}
    </div>
  );
}

