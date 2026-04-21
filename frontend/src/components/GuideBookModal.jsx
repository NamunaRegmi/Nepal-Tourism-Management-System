import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { guideBookingService } from '@/services/api';
import { notifyAppDataChanged } from '@/lib/dataSync';
import { CalendarRange } from 'lucide-react';

export default function GuideBookModal({ guide, isOpen, onClose, onSuccess }) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setStart('');
    setEnd('');
    setNotes('');
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const daysInclusive = () => {
    if (!start || !end) return 0;
    const a = new Date(start);
    const b = new Date(end);
    const d = Math.ceil((b - a) / (86400000)) + 1;
    return d > 0 ? d : 0;
  };

  const estimatedTotal = () => {
    const d = daysInclusive();
    const rate = Number(guide?.daily_rate || 0);
    return d * rate;
  };

  const handleSubmit = async () => {
    setError('');
    if (!start || !end) {
      setError('Choose start and end dates.');
      return;
    }
    if (new Date(end) < new Date(start)) {
      setError('End date must be on or after start date.');
      return;
    }
    setLoading(true);
    try {
      await guideBookingService.create({
        guide_profile: guide.id,
        start_date: start,
        end_date: end,
        notes: notes.trim(),
      });
      notifyAppDataChanged();
      onSuccess?.();
      handleClose();
    } catch (e) {
      const responseData = e.response?.data;
      const msg =
        responseData?.non_field_errors?.[0] ||
        responseData?.guide_profile?.[0] ||
        responseData?.end_date?.[0] ||
        responseData?.detail ||
        responseData?.error ||
        'Could not create booking.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-emerald-600" />
            Book {guide?.display_name || 'guide'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>From</Label>
              <Input type="date" min={today} value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <Label>To</Label>
              <Input type="date" min={start || today} value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Input
              placeholder="Group size, trek name, special needs…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          {daysInclusive() > 0 && (
            <p className="text-sm text-slate-600">
              ~{daysInclusive()} day{daysInclusive() > 1 ? 's' : ''} × Rs.{' '}
              {Number(guide?.daily_rate || 0).toLocaleString('en-IN')} ≈{' '}
              <strong className="text-emerald-800">Rs. {estimatedTotal().toLocaleString('en-IN')}</strong> (confirmed by
              server)
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Sending…' : 'Request booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
