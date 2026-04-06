"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type SuccessClientProps = {
  sessionId: string | null;
  type: "quote" | "purchase";
};

export default function SuccessClient({ sessionId, type }: SuccessClientProps) {
  const router = useRouter();
  const statusMessage =
    type === "purchase"
      ? "Payment confirmed. Your job is being created on our server now."
      : null;

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/");
    }, 6000);

    return () => clearTimeout(timer);
  }, [router]);

  const copy =
    type === "quote"
      ? {
          title: "Quote Sent",
          description: "Your quote was saved and emailed. We will follow up shortly.",
        }
      : {
          title: "Payment Successful",
          description: "Your checkout is complete. We will follow up shortly.",
        };

  return (
    <div className="min-h-screen">
      <main className="px-4 py-8 sm:py-12">
        <Card className="w-full border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">{copy.title}</CardTitle>
            <CardDescription>{copy.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sessionId ? <p className="text-sm text-muted-foreground">Session: {sessionId}</p> : null}
            {type === "purchase" && statusMessage ? <p className="text-sm text-muted-foreground">{statusMessage}</p> : null}
            <p className="text-xs text-muted-foreground">Returning to the home page in a few seconds.</p>
            <Button type="button" onClick={() => router.push("/")}>
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
