import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { ReviewShowcaseCard } from "@/components/review-showcase-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getReviews } from "@/lib/reviews";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Reviews",
};

export default async function ReviewsPage() {
  const reviews = await getReviews();

  return (
    <div className="app-page-shell-soft">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl space-y-5 px-4 py-8 sm:space-y-6">
        <Card className="app-surface-panel">
          <CardHeader className="gap-3 pb-4">
            <Badge className="w-fit bg-primary text-primary-foreground hover:bg-primary">Customer Results</Badge>
            <CardTitle className="text-2xl sm:text-3xl">Before & After Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Drag across each image to compare before and after cleaning results.
            </p>
          </CardContent>
        </Card>

        <section className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {reviews.map((review) => (
            <ReviewShowcaseCard key={review.id} review={review} />
          ))}
        </section>
      </main>
    </div>
  );
}
