import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { roomService } from '@/services/api';
import { notifyAppDataChanged } from '@/lib/dataSync';

const RoomManager = ({ hotel, onClose }) => {
    const [rooms, setRooms] = useState([]);
    const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
    const [newRoom, setNewRoom] = useState({
        room_type: '', price: '', capacity: '', quantity: 1, amenities: '', is_available: true
    });

    const fetchRooms = useCallback(async () => {
        if (!hotel) return;
        try {
            const response = await roomService.getByHotel(hotel.id);
            setRooms(response.data);
        } catch (err) {
            console.error("Failed to fetch rooms", err);
        }
    }, [hotel]);

    useEffect(() => {
        // Initial room load is an external sync, so fetching here is intentional.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchRooms();
    }, [fetchRooms]);

    const handleCreateRoom = async () => {
        if (!newRoom.room_type || !newRoom.price) {
            alert("Please fill in required fields");
            return;
        }
        try {
            await roomService.create(hotel.id, newRoom);
            setIsAddRoomOpen(false);
            setNewRoom({ room_type: '', price: '', capacity: '', quantity: 1, amenities: '', is_available: true });
            fetchRooms();
            notifyAppDataChanged();
        } catch (err) {
            console.error("Failed to create room", err);
            alert("Failed to create room");
        }
    };

    const handleDeleteRoom = async (id) => {
        if (!confirm("Are you sure?")) return;
        try {
            await roomService.delete(id);
            fetchRooms();
            notifyAppDataChanged();
        } catch (err) {
            console.error("Failed to delete room", err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">Manage Rooms for {hotel.name}</h2>
                    <p className="text-gray-500">Add or remove rooms available for booking</p>
                </div>
                <Button variant="outline" onClick={onClose}>Close Manager</Button>
            </div>

            <div className="flex justify-end">
                <Dialog open={isAddRoomOpen} onOpenChange={setIsAddRoomOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-green-600 text-white"><Plus className="h-4 w-4 mr-2" /> Add Room</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Room Type</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="type">Room Type (e.g., Deluxe, Standard)</Label>
                                <Input id="type" value={newRoom.room_type} onChange={e => setNewRoom({ ...newRoom, room_type: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="price">Price ($)</Label>
                                    <Input id="price" type="number" value={newRoom.price} onChange={e => setNewRoom({ ...newRoom, price: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="capacity">Capacity (Guests)</Label>
                                    <Input id="capacity" type="number" value={newRoom.capacity} onChange={e => setNewRoom({ ...newRoom, capacity: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="amenities">Amenities (comma separated)</Label>
                                <Input id="amenities" value={newRoom.amenities} onChange={e => setNewRoom({ ...newRoom, amenities: e.target.value })} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateRoom}>Add Room</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4">
                {rooms.map(room => (
                    <Card key={room.id} className="flex justify-between items-center p-4">
                        <div>
                            <h3 className="font-bold text-lg">{room.room_type}</h3>
                            <p className="text-sm text-gray-500">Max {room.capacity} guests • {room.amenities}</p>
                            <p className="font-semibold text-green-600">${room.price} / night</p>
                        </div>
                        <div className="flex gap-2">
                            <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleDeleteRoom(room.id)}>
                                <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                    </Card>
                ))}
                {rooms.length === 0 && <p className="text-center text-gray-500">No rooms added yet.</p>}
            </div>
        </div>
    );
};

export default RoomManager;
