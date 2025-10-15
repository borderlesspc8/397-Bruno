import { Card, CardContent, CardHeader } from "@/app/_components/ui/card";
import { Skeleton } from "@/app/_components/ui/skeleton";

interface SingleCardSkeletonProps {
  height?: string;
}

export function SingleCardSkeleton({ height = "400px" }: SingleCardSkeletonProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4">
        <Skeleton className="h-5 w-1/2 mb-2" />
        <Skeleton className="h-4 w-1/3" />
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <Skeleton className={`h-[${height}] w-full`} />
      </CardContent>
    </Card>
  );
}

interface TwoColumnSkeletonProps {
  height?: string;
}

export function TwoColumnSkeleton({ height = "300px" }: TwoColumnSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="overflow-hidden">
        <CardHeader className="p-4">
          <Skeleton className="h-5 w-1/2 mb-2" />
          <Skeleton className="h-4 w-1/3" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <Skeleton className={`h-[${height}] w-full`} />
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader className="p-4">
          <Skeleton className="h-5 w-1/2 mb-2" />
          <Skeleton className="h-4 w-1/3" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <Skeleton className={`h-[${height}] w-full`} />
        </CardContent>
      </Card>
    </div>
  );
}

export function ThreeColumnSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <CardHeader className="p-4">
            <Skeleton className="h-5 w-1/2 mb-2" />
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ListItemsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="w-full h-12" />
      ))}
    </div>
  );
}

export function DashboardSkeletons() {
  return {
    singleColumn: <SingleCardSkeleton />,
    twoColumns: <TwoColumnSkeleton />,
    threeColumns: <ThreeColumnSkeleton />,
    listItems: <ListItemsSkeleton />,
  };
} 
