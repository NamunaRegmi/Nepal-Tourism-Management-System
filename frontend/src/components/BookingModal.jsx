import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { roomService, bookingService } from '@/services/api';
import { notifyAppDataChanged } from '@/lib/dataSync';
import khaltiService from '@/services/khaltiService';
import esewaService from '@/services/esewaService';
import { CheckCircle, Calendar, Building2, ArrowRight, ShieldCheck, Smartphone, CreditCard, Wallet } from 'lucide-react';

const STEPS = { SELECT: 'select', PAYMENT: 'payment', CONFIRM: 'confirm' };

const formatNPR = (amount) => `Rs. ${Number(amount).toLocaleString('en-NP')}`;

const BookingModal = ({ hotel, isOpen, onClose, onSuccess }) => {
    const [step, setStep] = useState(STEPS.SELECT);
    const [rooms, setRooms] = useState([]);
    const [roomsLoading, setRoomsLoading] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [bookingId, setBookingId] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('khalti');

    useEffect(() => {
        if (hotel && isOpen && rooms.length === 0 && !roomsLoading) {
            console.log('%c=== BOOKING MODAL OPENED ===', 'color: darkblue; font-size: 14px; font-weight: bold;');
            console.log('Hotel name:', hotel.name);
            console.log('Hotel ID:', hotel.id);
            console.log('Checking for embedded rooms...');
            console.log('hotel.rooms:', hotel.rooms);
            
            // Try to load rooms from embedded property first
            if (hotel.rooms && Array.isArray(hotel.rooms) && hotel.rooms.length > 0) {
                console.log('%c✓ Found ' + hotel.rooms.length + ' rooms embedded in hotel object', 'color: green; font-weight: bold; font-size: 12px;');
                setRooms(hotel.rooms);
            } else {
                // If no embedded rooms, fetch from API
                console.log('%c⚠ No rooms embedded, attempting API fetch...', 'color: orange; font-weight: bold; font-size: 12px;');
                loadRoomsFromAPI(hotel.id);
            }
        }
    }, [hotel, isOpen, rooms.length, roomsLoading]);

    const loadRoomsFromAPI = async (hotelId) => {
        if (!hotelId) {
            console.error('Hotel ID is missing');
            setError('Hotel information is missing');
            setRooms([]);
            setRoomsLoading(false);
            return;
        }

        setRoomsLoading(true);
        try {
            console.log(`Fetching rooms from API for hotel ID: ${hotelId}`);
            const response = await roomService.getByHotel(hotelId);
            const roomsData = response.data || [];
            
            if (roomsData.length === 0) {
                console.warn(`No rooms returned for hotel ${hotelId}`);
                setError('No rooms available for this hotel');
            } else {
                console.log(`✓ Loaded ${roomsData.length} rooms from API`);
                setRooms(roomsData);
                setError('');
            }
        } catch (err) {
            console.error('API fetch failed:', err.message);
            setError('Failed to load rooms. Please try again.');
        } finally {
            setRoomsLoading(false);
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

    const handleConfirmBooking = async (skipPayment = false) => {
        console.log('=== handleConfirmBooking called ===');
        console.log('skipPayment:', skipPayment);
        console.log('selectedRoom:', selectedRoom);
        console.log('startDate:', startDate);
        console.log('endDate:', endDate);
        
        if (!selectedRoom) { setError('Please select a room.'); return; }
        if (!startDate || !endDate) { setError('Please select check-in and check-out dates.'); return; }
        if (getDiffDays() <= 0) { setError('Check-out must be after check-in.'); return; }
        setError('');

        setLoading(true);
        try {
            console.log('Creating booking...');
            const response = await bookingService.create({
                room: Number(selectedRoom),
                start_date: startDate,
                end_date: endDate,
                total_price: getTotalPrice(),
                status: 'pending',
            });
            console.log('Booking created:', response.data);
            const newBookingId = response.data.id;
            setBookingId(newBookingId);
            notifyAppDataChanged();
            
            if (skipPayment) {
                console.log('Skipping payment, going to CONFIRM step');
                toast.success('Booking confirmed! Check your email for booking details.', {
                    duration: 4000,
                    icon: '🎉',
                });
                onSuccess?.();
                onClose();
            } else {
                console.log('Redirecting to payment page');
                // Close modal and navigate to payment page
                onClose();
                // Navigate to payment page with booking ID
                window.location.href = `/payment?bookingId=${newBookingId}`;
            }
        } catch (err) {
            console.error('Booking creation failed:', err);
            setError(err.response?.data?.error || 'Booking failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        if (!bookingId) {
            setError('Booking ID not found.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            console.log(`Starting ${paymentMethod} payment process for booking:`, bookingId);
            
            if (paymentMethod === 'khalti') {
                // Initiate Khalti payment
                const paymentResponse = await khaltiService.initiatePayment(bookingId);
                
                console.log('Khalti payment initiation successful:', paymentResponse);
                
                if (paymentResponse.payment_url) {
                    console.log('Opening Khalti payment window:', paymentResponse.payment_url);
                    await khaltiService.openPaymentWindow(paymentResponse.payment_url);
                    setStep(STEPS.CONFIRM);
                } else {
                    setError('Invalid payment response received.');
                }
            } else if (paymentMethod === 'esewa') {
                // Initiate eSewa payment
                const successUrl = `${window.location.origin}/payment/esewa/success`;
                const failureUrl = `${window.location.origin}/payment/esewa/failure`;
                
                console.log('Initiating eSewa payment...');
                await esewaService.processPayment(bookingId, successUrl, failureUrl);
                
                // eSewa will redirect to success/failure page
                // No need to show confirm step here as user will be redirected
            }
        } catch (err) {
            console.error('Payment error:', err);
            
            if (err.message === 'Payment window closed') {
                setError('Payment was cancelled.');
            } else {
                setError(err.message || 'Payment failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDone = () => {
        notifyAppDataChanged();
        toast.success('Booking confirmed! Check your email for booking details.', {
            duration: 4000,
            icon: '🎉',
        });
        onSuccess?.();
        onClose();
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <Dialog key={isOpen ? `open-${hotel?.id}` : 'closed'} open={isOpen} onOpenChange={onClose}>
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
                                {roomsLoading ? (
                                    <div className="p-3 bg-gray-100 rounded-lg text-center text-gray-600 text-sm">
                                        Loading available rooms...
                                    </div>
                                ) : rooms.length === 0 ? (
                                    <div className="space-y-2">
                                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                                            No rooms available for this hotel at the moment.
                                        </div>
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => loadRoomsFromAPI(hotel.id)}
                                            className="w-full"
                                        >
                                            Retry Loading Rooms
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Select onValueChange={(v) => setSelectedRoom(v)} value={selectedRoom || ''}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Choose a room type" />
                                            </SelectTrigger>
                                            <SelectContent position="popper">
                                                {rooms && rooms.length > 0 ? (
                                                    rooms.map((room) => (
                                                        <SelectItem key={`room-${room.id}`} value={String(room.id)}>
                                                            {room.room_type} — {formatNPR(room.price)}/night ({room.capacity} guests)
                                                        </SelectItem>
                                                    ))
                                                ) : null}
                                            </SelectContent>
                                        </Select>
                                        {getSelectedRoom() && (
                                            <p className="text-xs text-gray-500 mt-1">{getSelectedRoom().description}</p>
                                        )}
                                    </div>
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

                        <DialogFooter className="px-6 pb-6 gap-2 flex-col sm:flex-row">
                            <Button variant="outline" onClick={onClose}>Cancel</Button>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button 
                                    onClick={() => handleConfirmBooking(true)} 
                                    disabled={loading} 
                                    variant="outline"
                                    className="flex-1 sm:flex-none gap-2"
                                >
                                    {loading ? 'Processing...' : 'Book Now'}
                                </Button>
                                <Button 
                                    onClick={() => handleConfirmBooking(false)} 
                                    disabled={loading} 
                                    className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 gap-2"
                                >
                                    {loading ? 'Processing...' : 'Proceed to Payment'} <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </DialogFooter>
                    </>
                )}

                {/* ── STEP 2: PAYMENT ───────────────────────── */}
                {step === STEPS.PAYMENT && (
                    <>
                        <DialogHeader className="px-6 pt-5 pb-2">
                            <DialogTitle className="flex items-center gap-2 text-lg">
                                <CreditCard className="h-5 w-5 text-blue-600" />
                                Complete Payment
                            </DialogTitle>
                        </DialogHeader>

                        <div className="px-6 py-4">
                            {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded mb-4">{error}</div>}

                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-4">
                                <div className="flex justify-between text-sm text-gray-600 mb-1">
                                    <span>Hotel</span><span className="font-semibold">{hotel?.name}</span></div>
                                <div className="flex justify-between text-sm text-gray-600 mb-1">
                                    <span>Room</span><span className="font-semibold">{getSelectedRoom()?.room_type}</span></div>
                                <div className="flex justify-between text-sm text-gray-600 mb-1">
                                    <span>Check-in</span><span>{startDate}</span></div>
                                <div className="flex justify-between text-sm text-gray-600 mb-1">
                                    <span>Check-out</span><span>{endDate}</span></div>
                                <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2 mt-2">
                                    <span>Total Amount</span>
                                    <span>{formatNPR(getTotalPrice())}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label className="mb-3 block">Select Payment Method</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('khalti')}
                                            className={`p-4 border-2 rounded-lg transition-all ${
                                                paymentMethod === 'khalti'
                                                    ? 'border-purple-600 bg-purple-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <Smartphone className={`h-8 w-8 ${paymentMethod === 'khalti' ? 'text-purple-600' : 'text-gray-400'}`} />
                                                <span className={`font-semibold text-sm ${paymentMethod === 'khalti' ? 'text-purple-600' : 'text-gray-600'}`}>
                                                    Khalti
                                                </span>
                                            </div>
                                        </button>
                                        
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('esewa')}
                                            className={`p-4 border-2 rounded-lg transition-all ${
                                                paymentMethod === 'esewa'
                                                    ? 'border-green-600 bg-green-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <Wallet className={`h-8 w-8 ${paymentMethod === 'esewa' ? 'text-green-600' : 'text-gray-400'}`} />
                                                <span className={`font-semibold text-sm ${paymentMethod === 'esewa' ? 'text-green-600' : 'text-gray-600'}`}>
                                                    eSewa
                                                </span>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {paymentMethod === 'khalti' && (
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Smartphone className="h-8 w-8 text-purple-600" />
                                        </div>
                                        <h4 className="font-semibold text-gray-900 mb-2">Pay with Khalti</h4>
                                        <p className="text-sm text-gray-600 mb-4">
                                            Secure payment via Khalti digital wallet. You'll be redirected to Khalti's secure payment gateway.
                                        </p>
                                    </div>
                                )}

                                {paymentMethod === 'esewa' && (
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Wallet className="h-8 w-8 text-green-600" />
                                        </div>
                                        <h4 className="font-semibold text-gray-900 mb-2">Pay with eSewa</h4>
                                        <p className="text-sm text-gray-600 mb-4">
                                            Secure payment via eSewa digital wallet. You'll be redirected to eSewa's secure payment gateway.
                                        </p>
                                    </div>
                                )}

                                <div className={`${paymentMethod === 'khalti' ? 'bg-purple-50 border-purple-100' : 'bg-green-50 border-green-100'} border rounded-lg p-3`}>
                                    <div className="flex items-start gap-2">
                                        <ShieldCheck className={`h-4 w-4 ${paymentMethod === 'khalti' ? 'text-purple-600' : 'text-green-600'} mt-0.5 flex-shrink-0`} />
                                        <div className={`text-xs ${paymentMethod === 'khalti' ? 'text-purple-800' : 'text-green-800'}`}>
                                            <strong>Secure Payment:</strong> Your payment information is encrypted and secure. {paymentMethod === 'khalti' ? 'Khalti' : 'eSewa'} supports multiple payment methods including mobile banking, cards, and wallet balance.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="px-6 pb-6 gap-2">
                            <Button variant="outline" onClick={onClose}>Cancel</Button>
                            <Button 
                                onClick={handlePayment} 
                                disabled={loading} 
                                className={`gap-2 ${
                                    paymentMethod === 'khalti' 
                                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                                        : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                                }`}
                            >
                                {loading ? 'Processing...' : `Pay with ${paymentMethod === 'khalti' ? 'Khalti' : 'eSewa'}`} 
                                {paymentMethod === 'khalti' ? <Smartphone className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
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
                        <div className="text-green-600 font-bold text-sm uppercase tracking-widest mb-1">Success!</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {bookingId && bookingService.getPaymentStatus?.(bookingId) === 'paid' ? 'Booking Confirmed!' : 'Booking Received'}
                        </h3>
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 w-full text-left text-sm mb-5 space-y-1">
                            <div className="flex justify-between"><span className="text-gray-500">Hotel</span><span className="font-semibold">{hotel?.name}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Room</span><span className="font-semibold">{getSelectedRoom()?.room_type}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Check-in</span><span>{startDate}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Check-out</span><span>{endDate}</span></div>
                            <div className="flex justify-between border-t pt-2 mt-2"><span className="text-gray-700 font-semibold">Total Cost</span><span className="font-bold text-gray-900">{formatNPR(getTotalPrice())}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Booking Status</span><span className="font-semibold text-green-600">Confirmed</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Payment Status</span><span className="font-semibold text-yellow-600">Pending</span></div>
                        </div>
                        <p className="text-xs text-gray-500 mb-6">Your booking has been confirmed. You can complete payment anytime before check-in. A confirmation email has been sent to your registered email address.</p>
                        <Button onClick={handleDone} className="bg-blue-600 hover:bg-blue-700 px-10">Done</Button>
                    </div>
                )}

            </DialogContent>
        </Dialog>
    );
};

export default BookingModal;
