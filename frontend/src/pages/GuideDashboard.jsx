import { useState, useEffect, useCallback } from 'react';
import { LogOut, Save, CalendarCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { guideService, guideBookingService, destinationService } from '@/services/api';
import { createObjectPreview, getCloudinaryUploadEnabled, uploadImageToCloudinary } from '@/services/cloudinary';
import { useAppDataSync, notifyAppDataChanged } from '@/lib/dataSync';
import { cn } from '@/lib/utils';

function toMoneyNumber(value) {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export default function GuideDashboard({ onNavigate }) {
  const [hasProfile, setHasProfile] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState('');

  const [form, setForm] = useState({
    headline: '',
    bio: '',
    languages: '',
    years_experience: '0',
    daily_rate: '',
    certifications: '',
    image: '',
    destination_ids: [],
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [destRes, bookRes] = await Promise.all([
        destinationService.getAll(),
        guideBookingService.list().catch(() => ({ data: [] })),
      ]);
      setDestinations(destRes.data || []);
      setBookings(bookRes.data || []);

      try {
        const pRes = await guideService.getMyProfile();
        setHasProfile(true);
        setForm({
          headline: pRes.data.headline || '',
          bio: pRes.data.bio || '',
          languages: Array.isArray(pRes.data.languages) ? pRes.data.languages.join(', ') : '',
          years_experience: String(pRes.data.years_experience ?? 0),
          daily_rate: String(pRes.data.daily_rate ?? ''),
          certifications: pRes.data.certifications || '',
          image: pRes.data.image || '',
          destination_ids: (pRes.data.destinations || []).map((d) => d.id),
        });
        setProfileImagePreview(pRes.data.image || '');
        setProfileImageFile(null);
      } catch {
        setHasProfile(false);
        setProfileImagePreview('');
        setProfileImageFile(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useAppDataSync(load);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    onNavigate('home');
  };

  const toggleDestination = (id) => {
    const sid = Number(id);
    setForm((f) => ({
      ...f,
      destination_ids: f.destination_ids.includes(sid)
        ? f.destination_ids.filter((x) => x !== sid)
        : [...f.destination_ids, sid],
    }));
  };

  const buildPayload = () => ({
    headline: form.headline.trim(),
    bio: form.bio.trim(),
    languages: form.languages,
    years_experience: parseInt(form.years_experience, 10) || 0,
    daily_rate: form.daily_rate,
    certifications: form.certifications.trim(),
    image: form.image.trim() || undefined,
    destination_ids: form.destination_ids,
  });

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      window.alert('Choose a valid image file.');
      event.target.value = '';
      return;
    }

    if (profileImagePreview && profileImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(profileImagePreview);
    }

    setProfileImageFile(file);
    setProfileImagePreview(createObjectPreview(file));
  };

  const handleSaveProfile = async () => {
    if (!form.daily_rate || toMoneyNumber(form.daily_rate) <= 0) {
      window.alert('Set a valid daily rate (NPR).');
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (profileImageFile) {
        payload.image = await uploadImageToCloudinary(profileImageFile, 'nepal-tourism/guides');
      }
      if (hasProfile) {
        await guideService.updateMyProfile(payload);
      } else {
        await guideService.createMyProfile(payload);
        setHasProfile(true);
      }
      notifyAppDataChanged();
      await load();
    } catch (e) {
      window.alert(e.response?.data ? JSON.stringify(e.response.data) : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleBookingStatus = async (id, status) => {
    try {
      await guideBookingService.update(id, { status });
      notifyAppDataChanged();
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin h-10 w-10 border-2 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <User className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Guide dashboard</h1>
              <p className="text-sm text-slate-500">Your public profile and booking requests</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onNavigate('guides')}>
              View public listing
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1">
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{hasProfile ? 'Edit your profile' : 'Publish your guide profile'}</CardTitle>
            <CardDescription>
              Travelers see this on the Tour guides page. Set your daily rate and areas you cover.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Headline</Label>
              <Input
                value={form.headline}
                onChange={(e) => setForm({ ...form, headline: e.target.value })}
                placeholder="e.g. Everest region trekking specialist"
              />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea
                rows={4}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Tell travelers about your experience and style."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Languages (comma-separated)</Label>
                <Input
                  value={form.languages}
                  onChange={(e) => setForm({ ...form, languages: e.target.value })}
                  placeholder="English, Nepali, Hindi"
                />
              </div>
              <div>
                <Label>Years experience</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.years_experience}
                  onChange={(e) => setForm({ ...form, years_experience: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Daily rate (NPR) *</Label>
              <Input
                type="number"
                min={1}
                value={form.daily_rate}
                onChange={(e) => setForm({ ...form, daily_rate: e.target.value })}
                placeholder="5000"
              />
            </div>
            <div>
              <Label>Profile image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
              />
              {profileImagePreview && (
                <img
                  src={profileImagePreview}
                  alt="Guide profile preview"
                  className="mt-3 h-32 w-full rounded-md object-cover border border-slate-200"
                />
              )}
              <p className="mt-2 text-xs text-slate-500">
                {getCloudinaryUploadEnabled()
                  ? 'Choose a file to upload to Cloudinary, or leave it empty and use an image URL below.'
                  : 'Cloudinary env vars are missing, so file upload is disabled. Use the image URL field below.'}
              </p>
            </div>
            <div>
              <Label>Profile image URL</Label>
              <Input
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Certifications</Label>
              <Textarea
                rows={2}
                value={form.certifications}
                onChange={(e) => setForm({ ...form, certifications: e.target.value })}
                placeholder="License IDs, training, associations…"
              />
            </div>
            <div>
              <Label className="mb-2 block">Destinations you guide in</Label>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border rounded-md p-2 bg-white">
                {destinations.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDestination(d.id)}
                    className={cn(
                      'text-xs px-2 py-1 rounded-full border transition-colors',
                      form.destination_ids.includes(d.id)
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 border-slate-200 hover:border-emerald-400'
                    )}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            </div>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={handleSaveProfile} disabled={saving || (profileImageFile && !getCloudinaryUploadEnabled())}>
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : hasProfile ? 'Update profile' : 'Publish profile'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-emerald-600" />
              Booking requests
            </CardTitle>
            <CardDescription>Confirm or decline requests from travelers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!hasProfile && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
                Publish your profile first — then travelers can find you and send requests.
              </p>
            )}
            {bookings.length === 0 ? (
              <p className="text-slate-500 text-sm">No guide bookings yet.</p>
            ) : (
              bookings.map((b) => (
                <div key={b.id} className="border rounded-lg p-4 space-y-2 bg-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-slate-900">{b.user?.first_name || b.user?.username}</p>
                      <p className="text-sm text-slate-500">
                        {b.start_date} → {b.end_date}
                      </p>
                    </div>
                    <Badge variant={b.status === 'confirmed' ? 'default' : 'secondary'}>{b.status}</Badge>
                  </div>
                  <p className="text-sm text-slate-600">
                    Rs. {Number(b.total_price || 0).toLocaleString('en-IN')}
                  </p>
                  {b.notes && <p className="text-xs text-slate-500">{b.notes}</p>}
                  {b.status === 'pending' && (
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="bg-emerald-600" onClick={() => handleBookingStatus(b.id, 'confirmed')}>
                        Confirm
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleBookingStatus(b.id, 'cancelled')}>
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
