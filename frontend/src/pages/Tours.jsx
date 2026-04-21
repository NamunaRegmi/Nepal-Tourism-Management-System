import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, MapPin, Package, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { packageService } from '@/services/api';
import { useAppDataSync } from '@/lib/dataSync';

const FALLBACK_TOUR_IMAGE = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80';

const formatCurrency = (value) =>
  `Rs. ${Number(value || 0).toLocaleString('en-NP', { maximumFractionDigits: 0 })}`;

export default function Tours({ onNavigate }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await packageService.getAll();
      setPackages(response.data || []);
    } catch (err) {
      console.error('Failed to load packages', err);
      setPackages([]);
      setError('Failed to load tours right now.');
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
      <section className="bg-[linear-gradient(140deg,_#083344,_#0f172a_58%,_#14532d)] text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-200">Tours</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
            Ready-made Nepal tours and travel packages.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-200 md:text-lg">
            Browse fixed-duration packages offered by providers. These are better for travelers who want a complete trip structure instead of building everything destination by destination.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Available tours</h2>
            <p className="mt-2 text-slate-600">
              Packages combine destinations, trip duration, and provider pricing in one listing.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
            {loading ? 'Loading tours...' : `${packages.length} tour${packages.length === 1 ? '' : 's'} available`}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[0, 1].map((item) => (
              <div key={item} className="h-80 animate-pulse rounded-3xl border border-slate-200 bg-white" />
            ))}
          </div>
        ) : packages.length === 0 ? (
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-10 text-center">
              <Package className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-4 text-xl font-semibold text-slate-900">No tours available</h3>
              <p className="mt-2 text-slate-600">
                Packages have not been published yet. Browse destinations or guides instead.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button onClick={() => onNavigate('destination-results')} className="bg-slate-900 hover:bg-slate-800">
                  Browse destinations
                </Button>
                <Button variant="outline" onClick={() => onNavigate('guides')}>
                  View guides
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {packages.map((tour) => (
              <Card key={tour.id} className="overflow-hidden border-slate-200 shadow-sm">
                <div className="h-56 overflow-hidden bg-slate-200">
                  <img
                    src={tour.image_url || tour.image || FALLBACK_TOUR_IMAGE}
                    alt={tour.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-2xl text-slate-900">{tour.name}</CardTitle>
                    <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                      {formatCurrency(tour.price)}
                    </div>
                  </div>
                  <p className="text-slate-600">{tour.description}</p>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <CalendarDays className="h-4 w-4" />
                        <span className="text-xs font-semibold uppercase tracking-[0.18em]">Duration</span>
                      </div>
                      <div className="mt-2 font-semibold text-slate-900">{tour.duration_days} days</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Users className="h-4 w-4" />
                        <span className="text-xs font-semibold uppercase tracking-[0.18em]">Provider</span>
                      </div>
                      <div className="mt-2 font-semibold text-slate-900">{tour.provider_name || 'Provider'}</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <MapPin className="h-4 w-4" />
                        <span className="text-xs font-semibold uppercase tracking-[0.18em]">Stops</span>
                      </div>
                      <div className="mt-2 font-semibold text-slate-900">{tour.destinations?.length || 0}</div>
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Destinations</p>
                    <div className="flex flex-wrap gap-2">
                      {tour.destinations?.map((destination) => (
                        <span
                          key={destination.id}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700"
                        >
                          {destination.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button className="bg-slate-900 hover:bg-slate-800" onClick={() => onNavigate('auth')}>
                      Sign in to book
                    </Button>
                    <Button variant="outline" onClick={() => onNavigate('destination-results')}>
                      Explore destinations
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
