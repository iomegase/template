import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type MetricItem = {
  label: string;
  value: string;
  hint: string;
  badge?: string;
};

export function MetricGrid({ items }: { items: MetricItem[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card
          key={item.label}
          className="bg-linear-to-b from-sidebar-accent/40 to-card shadow-xs"
        >
          <CardHeader>
            <CardDescription>{item.label}</CardDescription>
            <CardTitle className="text-2xl font-semibold tracking-tight">
              {item.value}
            </CardTitle>
            {item.badge ? (
              <CardAction>
                <Badge variant="outline">{item.badge}</Badge>
              </CardAction>
            ) : null}
          </CardHeader>
          <CardFooter className="text-sm text-muted-foreground">
            {item.hint}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
