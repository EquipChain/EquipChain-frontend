import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { generateMetadata as makeMetadata } from "@/src/lib/seo/metadata";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { Breadcrumbs } from "@/src/components/ui/Breadcrumbs";
import { Card, CardHeader, CardContent } from "@/src/components/ui/Card";
import { StatusBadge } from "@/src/components/ui/Badge";
import { Progress } from "@/src/components/ui/Progress";
import { Button } from "@/src/components/ui/Button";
import { sampleMeters, sampleReadingHistory, meterUnit } from "@/src/lib/fixtures/demo";
import { ErrorBoundary } from "@/src/components/common/ErrorBoundary";
import {
  formatConsumption,
  formatCurrency,
  formatDate,
  formatStellarAddress,
} from "@/src/lib/utils/format";
import { breadcrumbListSchema } from "@/src/lib/seo/json-ld";

// ============================================================================
// Meter detail — per-meter profile page
// ============================================================================
// The meters table has always dead-ended: no way to inspect a single
// meter's readings, rate, or owner. This route renders the full profile.
// It is a server component over the fixture list today; when the backend
// lands, only the data source changes (params.id -> fetch).

// Recharts is heavy (~100KB gz): the history chart loads in its own chunk
// so the detail page's static content paints first, with a matching
// skeleton in the meantime.
const MeterReadingHistoryChart = dynamic(
  () => import("@/src/components/charts/MeterReadingHistoryChart").then(
    (mod) => mod.MeterReadingHistoryChart
  ),
  {
    loading: () => (
      <div className="h-60 animate-pulse rounded-lg bg-surface-tertiary" aria-hidden="true" />
    ),
    ssr: false,
  }
);

interface MeterDetailProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: MeterDetailProps): Promise<Metadata> {
  const { id } = await params;
  const meter = sampleMeters.find((m) => m.id === id);
  return makeMetadata({
    title: meter ? `Meter ${meter.name}` : "Meter not found",
    description: meter
      ? `Readings, rate, and ownership details for ${meter.name} (${meter.type} meter).`
      : "This meter does not exist.",
    path: `/meters/${id}`,
  });
}

export default async function MeterDetailPage({ params }: MeterDetailProps) {
  const { id } = await params;
  const meter = sampleMeters.find((m) => m.id === id);
  if (!meter) notFound();

  const unit = meterUnit(meter);
  const jsonLd = breadcrumbListSchema([
    { name: "Home", path: "/" },
    { name: "Meters", path: "/meters" },
    { name: meter.name, path: `/meters/${meter.id}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex flex-col gap-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Meters", href: "/meters" },
            { label: meter.name },
          ]}
        />

        <Link href="/meters">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            All meters
          </Button>
        </Link>

        <PageHeader
          title={meter.name}
          description={`${meter.type} meter · ${meter.id}`}
          actions={<StatusBadge status={meter.status} />}
        />

        <Card>
          <CardHeader
            title="Reading history"
            description="Cumulative readings over the last 30 days"
          />
          <CardContent>
            {/* Chart-libs can throw on odd data; contain the blast radius so
                the rest of the profile survives a rendering failure. */}
            <ErrorBoundary sectionName="reading history chart">
              <MeterReadingHistoryChart
                data={sampleReadingHistory(meter, 30)}
                unit={unit}
                ariaLabel={`Cumulative readings for ${meter.name} over the last 30 days`}
              />
            </ErrorBoundary>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Readings" description="Current meter state" />
            <CardContent className="space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-text-secondary">Last reading</span>
                <span className="text-xl font-bold text-text-primary">
                  {formatConsumption(meter.lastReading, unit)}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-text-secondary">Total consumption</span>
                <span className="text-sm font-medium text-text-primary">
                  {formatConsumption(meter.totalConsumption, unit)}
                </span>
              </div>
              <Progress
                value={
                  meter.totalConsumption > 0
                    ? (meter.lastReading / meter.totalConsumption) * 100
                    : 0
                }
                ariaLabel="Last reading relative to lifetime consumption"
              />
              <p className="text-xs text-text-muted">
                Last updated <time dateTime={meter.lastUpdated}>{formatDate(meter.lastUpdated)}</time>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Billing" description="Rate and ownership" />
            <CardContent className="space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-text-secondary">Rate</span>
                <span className="text-sm font-medium text-text-primary">
                  {formatCurrency(meter.rate, "USD", 2)} per {unit}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-text-secondary">Owner</span>
                <span className="font-mono text-xs text-text-primary">
                  {formatStellarAddress(meter.ownerAddress, 8)}
                </span>
              </div>
              {meter.location && (
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-text-secondary">Location</span>
                  <span className="text-sm text-text-primary">{meter.location}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-text-secondary">Registered</span>
                <time dateTime={meter.registeredAt} className="text-sm text-text-primary">
                  {formatDate(meter.registeredAt)}
                </time>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
