import { useCallback, useEffect, useState } from 'react';
import { Compass, Mountain, ShieldCheck, Users, MapPin, Package, HeartHandshake } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { destinationService, guideService, packageService } from '@/services/api';
import { useAppDataSync } from '@/lib/dataSync';

const HIGHLIGHTS = [
  {
    icon: Mountain,
    title: 'Built for Nepal travel',
    description: 'Destinations, stays, guides, and packages are organized around how people actually plan trips across Nepal.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified booking flow',
    description: 'The platform supports hotel bookings, guide requests, and payment verification from one place.',
  },
  {
    icon: HeartHandshake,
    title: 'Local-first tourism',
    description: 'Providers and guides can publish listings directly so travelers see local tourism businesses, not just generic travel copy.',
  },
];

const JOURNEY_STEPS = [
  'Browse destinations by terrain, province, or travel style.',
  'Compare tours and local guides based on what you want to experience.',
  'Book stays or send guide requests from the same app.',
  'Manage bookings, wishlist items, and profile details from your dashboard.',
];

export default function About({ onNavigate }) {
  const [stats, setStats] = useState({
    destinations: 0,
    tours: 0,
    guides: 0,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [destinationRes, packageRes, guideRes] = await Promise.all([
        destinationService.getAll().catch(() => ({ data: [] })),
        packageService.getAll().catch(() => ({ data: [] })),
        guideService.list().catch(() => ({ data: [] })),
      ]);

      setStats({
        destinations: destinationRes.data?.length || 0,
        tours: packageRes.data?.length || 0,
        guides: guideRes.data?.length || 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useAppDataSync(load);

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-[linear-gradient(135deg,_#082f49,_#0f172a_55%,_#155e75)] text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">About Nepal Tourism</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
            A travel platform shaped around real trips in Nepal.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-200 md:text-lg">
            This system brings together destinations, tour packages, hotel bookings, and local guides so travelers can plan Nepal journeys without jumping across disconnected pages and tools.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <Card className="border-white/10 bg-white/10 text-white shadow-none backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="text-sm uppercase tracking-[0.2em] text-cyan-200">Destinations</div>
                <div className="mt-2 text-3xl font-bold">{loading ? '...' : stats.destinations}</div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/10 text-white shadow-none backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="text-sm uppercase tracking-[0.2em] text-cyan-200">Tours</div>
                <div className="mt-2 text-3xl font-bold">{loading ? '...' : stats.tours}</div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/10 text-white shadow-none backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="text-sm uppercase tracking-[0.2em] text-cyan-200">Guides</div>
                <div className="mt-2 text-3xl font-bold">{loading ? '...' : stats.guides}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {HIGHLIGHTS.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="border-slate-200 shadow-sm">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="pt-4 text-xl">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-600">
                  {item.description}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-700">What You Can Do Here</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              Use the platform the way a traveler actually plans a trip.
            </h2>
            <div className="mt-6 space-y-4">
              {JOURNEY_STEPS.map((step, index) => (
                <div key={step} className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <p className="pt-2 text-slate-700">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <Card className="border-slate-200 bg-slate-950 text-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Why this matters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-slate-300">
              <div className="flex gap-3">
                <Compass className="mt-0.5 h-5 w-5 text-cyan-300" />
                <p>Travelers get clearer discovery instead of generic page labels leading to unrelated content.</p>
              </div>
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-cyan-300" />
                <p>Destinations connect to terrain, location, and nearby stays so browsing feels geographic, not random.</p>
              </div>
              <div className="flex gap-3">
                <Package className="mt-0.5 h-5 w-5 text-cyan-300" />
                <p>Tours and packages are surfaced as their own product category instead of being buried inside unrelated pages.</p>
              </div>
              <div className="flex gap-3">
                <Users className="mt-0.5 h-5 w-5 text-cyan-300" />
                <p>Guides have a dedicated discovery flow, which is important because hiring a guide is not the same action as booking a hotel.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <Card className="overflow-hidden border-slate-200 bg-[linear-gradient(135deg,_#e0f2fe,_#f8fafc_55%,_#cffafe)] shadow-sm">
          <CardContent className="flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-10">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Start with the right page</h2>
              <p className="mt-3 text-slate-700">
                Browse destinations if you want places, tours if you want ready-made itineraries, and guides if you want local experts.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button className="bg-slate-900 hover:bg-slate-800" onClick={() => onNavigate('destination-results')}>
                Explore destinations
              </Button>
              <Button variant="outline" onClick={() => onNavigate('tours')}>
                View tours
              </Button>
              <Button variant="outline" onClick={() => onNavigate('guides')}>
                Find guides
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
