import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  title: string;
  description: string;
  className?: string;
};

export function SiteHeader({ title, description, className }: SiteHeaderProps) {
  return (
    <div
      className={cn(
        "flex min-h-(--header-height) items-center gap-4 border-b border-border/40 bg-background/75 px-4 backdrop-blur-xl supports-backdrop-filter:bg-background/60",
        className,
      )}
    >
      <SidebarTrigger className="shrink-0 rounded-md border border-border/50 bg-muted/40 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold tracking-tight text-foreground">
          {title}
        </p>
        <p className="truncate text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="hidden items-center gap-2 md:flex">
        <Badge
          variant="outline"
          className="border-border/50 bg-muted/30 font-mono text-[10px] tracking-wide text-muted-foreground"
        >
          Live workspace
        </Badge>
        <Badge
          variant="outline"
          className="border-primary/30 bg-primary/8 font-mono text-[10px] tracking-wide text-primary"
        >
          Premium theme
        </Badge>
      </div>
    </div>
  );
}
