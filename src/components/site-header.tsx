import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  title: string;
  description: string;
  className?: string;
};

export function SiteHeader({
  title,
  description,
  className,
}: SiteHeaderProps) {
  return (
    <div
      className={cn(
        "flex min-h-(--header-height) items-center gap-4 border-b border-white/6 bg-red-900/90 px-4 backdrop-blur-xl supports-backdrop-filter:bg-black/12",
        className,
      )}
    >
      <SidebarTrigger className="shrink-0 rounded-full border border-white/10 bg-white/6 md:hidden" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-foreground">{title}</p>
        <p className="truncate text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="hidden items-center gap-2 md:flex">
        <Badge className="border-white/8 bg-white/6 text-foreground" variant="outline">
          Live workspace
        </Badge>
        <Badge className="border-primary/25 bg-primary/12 text-primary-foreground" variant="outline">
          Premium theme
        </Badge>
      </div>
    </div>
  );
}
