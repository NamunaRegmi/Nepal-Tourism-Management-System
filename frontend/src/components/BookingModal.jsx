import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { roomService, bookingService } from '@/services/api';
import { CheckCircle, Calendar, Building2, ArrowRight, ShieldCheck, Smartphone } from 'lucide-react';

const STEPS = { SELECT: 'select', CONFIRM: 'confirm' };

const formatNPR = (amount) => `Rs. ${Number(amount).toLocaleString('en-NP')}`;

const BookingModal = ({ hotel, isOpen, onClose, onSuccess }) => {
    const [step, setStep] = useState(STEPS.SELECT);
    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (hotel && isOpen) {
            fetchRooms();
            setStep(STEPS.SELECT);
            setError('');
            setSelectedRoom(null);
            setStartDate('');
            setEndDate('');
        }
    }, [hotel, isOpen]);

    const fetchRooms = async () => {
        try {
            const response = await roomService.getByHotel(hotel.id);
            setRooms(response.data);
        } catch (err) {
            setError('Failed to load rooms.');
        }
    };

    const getDiffDays = () => {
        if (!startDate || !endDate) return 0;
        return Math.max(0, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)));
    };

    const getSelectedRoom = () => rooms.find(r => String(r.id) === String(selectedRoom));
    const getTotalPrice = () => {
        const room = getSelectedRoom();
        return room ? Number(room.price) * getDiffDays() : 0;
    };

    const handleConfirmBooking = async () => {
        if (!selectedRoom) { setError('Please select a room.'); return; }
        if (!startDate || !endDate) { setError('Please select check-in and check-out dates.'); return; }
        if (getDiffDays() <= 0) { setError('Check-out must be after check-in.'); return; }
        setError('');

        setLoading(true);
        try {
            await bookingService.create({
                room: selectedRoom,
                start_date: startDate,
                end_date: endDate,
                total_price: getTotalPrice(),
                status: 'pending',
            });
            setStep(STEPS.CONFIRM);
        } catch (err) {
            setError('Booking failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDone = () => {
        onSuccess?.();
        onClose();
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl">

                {/* Modal Title inside Step 1 instead of step indicators */}

                {/* ── STEP 1: SELECT ROOM ─────────────────────── */}
                {step === STEPS.SELECT && (
                    <>
                        <DialogHeader className="px-6 pt-5 pb-2">
                            <DialogTitle className="flex items-center gap-2 text-lg">
                                <Building2 className="h-5 w-5 text-green-600" />
                                Book a Room at {hotel?.name}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="px-6 grid gap-4 py-4">
                            {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}

                            <div className="grid gap-2">
                                <Label>Select Room Type</Label>
                                <Select onValueChange={(v) => setSelectedRoom(v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a room type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rooms.map(room => (
                                            <SelectItem key={room.id} value={String(room.id)}>
                                                {room.room_type} — {formatNPR(room.price)}/night ({room.capacity} guests)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {getSelectedRoom() && (
                                    <p className="text-xs text-gray-500">{getSelectedRoom().description}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-1">
                                    <Label className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Check-in</Label>
                                    <Input type="date" value={startDate} min={today} onChange={e => setStartDate(e.target.value)} />
                                </div>
                                <div className="grid gap-1">
                                    <Label className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Check-out</Label>
                                    <Input type="date" value={endDate} min={startDate || today} onChange={e => setEndDate(e.target.value)} />
                                </div>
                            </div>

                            {getSelectedRoom() && getDiffDays() > 0 && (
                                <div className="bg-green-50 border border-green-100 p-4 rounded-xl">
                                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                                        <span>{formatNPR(getSelectedRoom().price)} × {getDiffDays()} night{getDiffDays() > 1 ? 's' : ''}</span>
                                        <span>{formatNPR(getTotalPrice())}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-green-800 text-base border-t border-green-200 pt-2 mt-2">
                                        <span>Total Amount</span>
                                        <span>{formatNPR(getTotalPrice())}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="px-6 pb-6 gap-2">
                            <Button variant="outline" onClick={onClose}>Cancel</Button>
                            <Button onClick={handleConfirmBooking} disabled={loading} className="bg-blue-600 hover:bg-blue-700 gap-2">
                                {loading ? 'Processing...' : 'Confirm Booking'} <ArrowRight className="h-4 w-4" />
                            </Button>
                        </DialogFooter>
                    </>
                )}



                {/* ── STEP 3: CONFIRMED ───────────────────────── */}
                {step === STEPS.CONFIRM && (
                    <div className="flex flex-col items-center text-center px-8 py-10">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5">
                            <CheckCircle className="h-12 w-12 text-green-500" />
                        </div>
                        <div className="text-green-600 font-bold text-sm uppercase tracking-widest mb-1">Payment Successful</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 w-full text-left text-sm mb-5 space-y-1">
                            <div className="flex justify-between"><span className="text-gray-500">Hotel</span><span className="font-semibold">{hotel?.name}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Room</span><span className="font-semibold">{getSelectedRoom()?.room_type}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Check-in</span><span>{startDate}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Check-out</span><span>{endDate}</span></div>
                            <div className="flex justify-between border-t pt-2 mt-2"><span className="text-gray-700 font-semibold">Total Cost</span><span className="font-bold text-gray-900">{formatNPR(getTotalPrice())}</span></div>
                        </div>
                        <p className="text-xs text-gray-500 mb-6">Payment will be collected at the property or via Khalti later. Your booking is pending hotel approval.</p>
                        <Button onClick={handleDone} className="bg-blue-600 hover:bg-blue-700 px-10">Done</Button>
                    </div>
                )}

            </DialogContent>
        </Dialog>
    );
};

export default BookingModal;
