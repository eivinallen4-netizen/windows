import { SiteHeader } from "@/components/site-header";
import { ReviewShowcaseCard } from "@/components/review-showcase-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getReviews } from "@/lib/reviews";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const reviews = await getReviews();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f7fbff_0%,_#eef5fa_100%)]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl space-y-5 px-4 py-8 sm:space-y-6">
        <Card className="overflow-hidden border-white/70 bg-white/85 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
          <CardHeader className="gap-3 pb-4">
            <Badge className="w-fit bg-[#0b6fb2] text-white hover:bg-[#0b6fb2]">Customer Results</Badge>
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
