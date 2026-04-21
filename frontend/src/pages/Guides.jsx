import { useState, useEffect, useCallback } from 'react';
import { MapPin, Languages, Calendar, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { guideService, destinationService } from '@/services/api';
import { useAppDataSync } from '@/lib/dataSync';

export default function Guides({ onSelectGuide }) {
  const [guides, setGuides] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [filterDest, setFilterDest] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [gRes, dRes] = await Promise.all([
        guideService.list(filterDest ? { destination: filterDest } : {}),
        destinationService.getAll(),
      ]);
      setGuides(gRes.data || []);
      setDestinations(dRes.data || []);
    } catch (e) {
      console.error(e);
      setGuides([]);
    } finally {
      setLoading(false);
    }
  }, [filterDest]);

  useEffect(() => {
    load();
  }, [load]);

  useAppDataSync(load);

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="bg-gradient-to-r from-emerald-700 to-teal-600 text-white py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Tour guides</h1>
          <p className="mt-2 text-emerald-100 max-w-2xl">
            Licensed local guides for treks, culture tours, and city walks across Nepal. Pick someone who knows your destination.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-6">
        <Card className="shadow-md border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Filter by destination</CardTitle>
            <CardDescription>Show guides who operate in a specific area</CardDescription>
          </CardHeader>
          <CardContent>
            <select
              className="w-full md:w-72 h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={filterDest}
              onChange={(e) => setFilterDest(e.target.value)}
            >
              <option value="">All destinations</option>
              {destinations.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.name}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        <div className="mt-8">
          {loading ? (
            <div className="text-center py-16 text-slate-500">Loading guides…</div>
          ) : guides.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              No guides listed yet. Guides can sign up and publish a profile from their dashboard.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {guides.map((g) => (
                <Card key={g.id} className="overflow-hidden border-slate-200 hover:shadow-lg transition-shadow">
                  <div className="flex h-40 bg-slate-200">
                    <img
                      src={g.image_url || g.image || g.user?.profile_picture || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600'}
                      alt={g.display_name || g.user?.username || 'Tour guide'}
                      className="w-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl">{g.display_name || g.user?.username}</CardTitle>
                    {g.headline && <CardDescription className="text-slate-600">{g.headline}</CardDescription>}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                      {g.years_experience > 0 && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" /> {g.years_experience}+ yrs
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-semibold text-emerald-700">
                        Rs. {Number(g.daily_rate || 0).toLocaleString('en-IN')}/day
                      </span>
                    </div>
                    {Array.isArray(g.languages) && g.languages.length > 0 && (
                      <div className="flex items-start gap-2 text-sm text-slate-600">
                        <Languages className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{g.languages.join(' · ')}</span>
                      </div>
                    )}
                    {g.destinations?.length > 0 && (
                      <div className="flex items-start gap-2 text-sm text-slate-600">
                        <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{g.destinations.map((d) => d.name).join(', ')}</span>
                      </div>
                    )}
                    <Button
                      className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => onSelectGuide(g.id)}
                    >
                      View profile <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
