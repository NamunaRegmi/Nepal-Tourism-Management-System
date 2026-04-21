import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarRange, Package as PackageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { bookingService } from '@/services/api';
import { notifyAppDataChanged } from '@/lib/dataSync';

const formatNPR = (amount) => `Rs. ${Number(amount || 0).toLocaleString('en-NP')}`;

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(dateString, daysToAdd) {
  if (!dateString) return '';
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + daysToAdd);
  return formatDateInput(date);
}

export default function PackageBookingModal({ tour, isOpen, onClose }) {
  const [startDate, setStartDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setStartDate('');
      setError('');
      setSubmitting(false);
    }
  }, [isOpen]);

  const durationDays = Math.max(Number(tour?.duration_days || 1), 1);
  const endDate = startDate ? addDays(startDate, durationDays - 1) : '';
  const today = formatDateInput(new Date());

  const handleSubmit = async () => {
    if (!tour?.id) {
      setError('Tour package could not be loaded.');
      return;
    }

    if (!startDate) {
      setError('Choose a start date.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await bookingService.create({
        package: tour.id,
        start_date: startDate,
        end_date: endDate || startDate,
        total_price: Number(tour.price || 0),
        status: 'pending',
      });

      notifyAppDataChanged();
      onClose();
      toast.success('Package booking created. Continue with payment.');
      window.location.href = `/payment?bookingId=${response.data.id}`;
    } catch (err) {
      const responseData = err.response?.data;
      const detail =
        responseData?.non_field_errors?.[0] ||
        responseData?.detail ||
        responseData?.error ||
        'Could not create the booking.';
      setError(detail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <PackageIcon className="h-5 w-5 text-emerald-600" />
            Book {tour?.name || 'package'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">{tour?.name}</p>
                <p className="mt-1 text-sm text-slate-600">{tour?.provider_name || 'Tour provider'}</p>
              </div>
              <div className="text-right text-sm font-semibold text-emerald-700">
                {formatNPR(tour?.price)}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
              <CalendarRange className="h-4 w-4 text-slate-500" />
              <span>{durationDays} day{durationDays === 1 ? '' : 's'} package</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="package-start-date">Tour start date</Label>
            <Input
              id="package-start-date"
              type="date"
              min={today}
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tour ends</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{endDate || 'Select a start date'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Total</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{formatNPR(tour?.price)}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button className="bg-slate-900 hover:bg-slate-800" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating booking...' : 'Continue to payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
