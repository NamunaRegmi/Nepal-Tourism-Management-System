import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, MapPin, Languages, Award, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { guideService } from '@/services/api';
import GuideBookModal from '@/components/GuideBookModal';
import { useAppDataSync } from '@/lib/dataSync';

export default function GuideDetail({ guideId, onNavigate }) {
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookOpen, setBookOpen] = useState(false);

  const load = useCallback(async () => {
    if (!guideId) return;
    try {
      setLoading(true);
      const res = await guideService.getById(guideId);
      setGuide(res.data);
    } catch (e) {
      console.error(e);
      setGuide(null);
    } finally {
      setLoading(false);
    }
  }, [guideId]);

  useEffect(() => {
    load();
  }, [load]);

  useAppDataSync(load);

  if (!guideId) {
    return (
      <div className="p-8 text-center">
        <Button onClick={() => onNavigate('guides')}>Back to guides</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin h-10 w-10 border-2 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-600">Guide not found.</p>
        <Button onClick={() => onNavigate('guides')}>Back to guides</Button>
      </div>
    );
  }

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
  const userRaw = typeof localStorage !== 'undefined' ? localStorage.getItem('user') : null;
  let role = 'guest';
  try {
    role = userRaw ? JSON.parse(userRaw).role : 'guest';
  } catch {
    /* ignore */
  }
  const canBook = token && role === 'user';

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Button variant="ghost" className="mb-4 gap-2" onClick={() => onNavigate('guides')}>
          <ArrowLeft className="h-4 w-4" /> All guides
        </Button>

        <Card className="overflow-hidden border-slate-200">
          <div className="h-56 bg-slate-200">
            <img
              src={guide.image || guide.user?.profile_picture || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800'}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <CardHeader>
            <CardTitle className="text-2xl">{guide.display_name || guide.user?.username}</CardTitle>
            {guide.headline && <p className="text-slate-600">{guide.headline}</p>}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-2 font-semibold text-emerald-700">
                <IndianRupee className="h-4 w-4" />
                Rs. {Number(guide.daily_rate || 0).toLocaleString('en-IN')} / day
              </span>
              {guide.years_experience > 0 && (
                <span className="flex items-center gap-2 text-slate-600">
                  <Award className="h-4 w-4" />
                  {guide.years_experience}+ years experience
                </span>
              )}
            </div>

            {guide.bio && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">About</h3>
                <p className="text-slate-600 whitespace-pre-line">{guide.bio}</p>
              </div>
            )}

            {Array.isArray(guide.languages) && guide.languages.length > 0 && (
              <div className="flex items-start gap-2">
                <Languages className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-900">Languages</h3>
                  <p className="text-slate-600">{guide.languages.join(' · ')}</p>
                </div>
              </div>
            )}

            {guide.destinations?.length > 0 && (
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-900">Destinations</h3>
                  <p className="text-slate-600">{guide.destinations.map((d) => d.name).join(', ')}</p>
                </div>
              </div>
            )}

            {guide.certifications && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Certifications</h3>
                <p className="text-slate-600 whitespace-pre-line">{guide.certifications}</p>
              </div>
            )}

            <div className="pt-4 border-t">
              {canBook ? (
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => setBookOpen(true)}>
                  Request to book
                </Button>
              ) : (
                <p className="text-sm text-slate-500 text-center">
                  {token ? 'Switch to a traveler account to book a guide.' : 'Log in as a traveler to request this guide.'}
                </p>
              )}
              {!token && (
                <Button variant="outline" className="w-full mt-2" onClick={() => onNavigate('auth')}>
                  Log in
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <GuideBookModal guide={guide} isOpen={bookOpen} onClose={() => setBookOpen(false)} />
    </div>
  );
}
