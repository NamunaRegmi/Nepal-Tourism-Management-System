import { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, Save, X, Upload, MapPin, Calendar, Users, DollarSign, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { packageService } from '@/services/api';
import { createObjectPreview, getCloudinaryUploadEnabled, uploadImageToCloudinary } from '@/services/cloudinary';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { DEFAULT_IMAGES, GRADIENTS, BUTTON_STYLES, DEFAULTS, PLACEHOLDERS } from '@/config/constants';

const PackageManager = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [packageForm, setPackageForm] = useState({
    name: '',
    description: '',
    price: '',
    duration_days: '',
    max_people: '',
    destination: '',
    itinerary: '',
    included_services: '',
    image: ''
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await packageService.getMyPackages();
      setPackages(response.data || []);
    } catch (error) {
      console.error('Failed to fetch packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPackage = () => {
    setPackageForm({
      name: '',
      description: '',
      price: '',
      duration_days: '',
      max_people: '',
      destination: '',
      itinerary: '',
      included_services: '',
      image: ''
    });
    setImageFile(null);
    setImagePreview('');
    setEditingPackage(null);
    setIsAdding(true);
    setDialogOpen(true);
  };

  const handleEditPackage = (pkg) => {
    setPackageForm({
      name: pkg.name || '',
      description: pkg.description || '',
      price: pkg.price || '',
      duration_days: pkg.duration_days || '',
      max_people: pkg.max_people || '',
      destination: pkg.destination || '',
      itinerary: pkg.itinerary || '',
      included_services: pkg.included_services || '',
      image: pkg.image || ''
    });
    setImageFile(null);
    setImagePreview(pkg.image || '');
    setEditingPackage(pkg);
    setIsAdding(false);
    setDialogOpen(true);
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      window.alert('Please choose a valid image file.');
      event.target.value = '';
      return;
    }

    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(createObjectPreview(file));
  };

  const handleSavePackage = async () => {
    if (!packageForm.name.trim() || !packageForm.description.trim()) {
      toast.error('Please fill in the package name and description.');
      return;
    }

    if (!packageForm.price || Number(packageForm.price) <= 0) {
      toast.error('Please enter a valid price.');
      return;
    }

    if (!packageForm.duration_days || Number(packageForm.duration_days) <= 0) {
      toast.error('Please enter a valid duration in days.');
      return;
    }

    setSaving(true);
    try {
      let imageUrl = (packageForm.image && String(packageForm.image).trim()) || '';
      
      if (imageFile) {
        imageUrl = await uploadImageToCloudinary(imageFile, 'nepal-tourism/packages');
      }

      const payload = {
        name: packageForm.name.trim(),
        description: packageForm.description.trim(),
        price: packageForm.price,
        duration_days: packageForm.duration_days,
        max_people: packageForm.max_people || DEFAULTS.maxPeople,
        destination: packageForm.destination.trim(),
        itinerary: packageForm.itinerary.trim(),
        included_services: packageForm.included_services.trim(),
        image: imageUrl || DEFAULT_IMAGES.package,
      };

      if (isAdding) {
        await packageService.create(payload);
        toast.success('Package created successfully!');
      } else if (editingPackage) {
        await packageService.update(editingPackage.id, payload);
        toast.success('Package updated successfully!');
      }

      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      
      setImageFile(null);
      setImagePreview('');
      setDialogOpen(false);
      fetchPackages();
    } catch (error) {
      console.error('Failed to save package:', error);
      const errorMessage = error.response?.data 
        ? (typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data))
        : (error.message || 'Could not save package. Please check all fields.');
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = (pkg) => {
    setPackageToDelete(pkg);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!packageToDelete) return;
    
    setDeleting(true);
    try {
      console.log('Deleting package:', packageToDelete.id);
      const response = await packageService.delete(packageToDelete.id);
      console.log('Delete response:', response);
      toast.success(`${packageToDelete.name} deleted successfully!`);
      setDeleteDialogOpen(false);
      setPackageToDelete(null);
      fetchPackages();
    } catch (error) {
      console.error('Failed to delete package:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Could not delete this package.';
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setPackageToDelete(null);
  };

  const filteredPackages = packages.filter((pkg) => {
    const q = searchQuery.toLowerCase();
    const name = (pkg.name || '').toLowerCase();
    const dest = (pkg.destination || '').toLowerCase();
    const desc = (pkg.description || '').toLowerCase();
    return name.includes(q) || dest.includes(q) || desc.includes(q);
  });

  const formatCurrency = (amount) => {
    const n = Number(amount);
    if (!Number.isFinite(n)) return 'Rs. 0';
    return `Rs. ${Math.round(n).toLocaleString('en-NP')}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Package className="h-5 w-5 mr-2 text-blue-600" />
              <CardTitle>Tour Packages</CardTitle>
            </div>
            <Button 
              type="button"
              className={`${BUTTON_STYLES.secondary} pointer-events-auto cursor-pointer z-10`}
              onClick={handleAddPackage}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Package
            </Button>
          </div>
          <CardDescription>
            Manage your tour packages that customers can book
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search packages by name, destination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          {loading ? (
            <div className="text-center py-8">Loading packages...</div>
          ) : filteredPackages.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery ? 'No packages found matching your search.' : 'No packages yet. Add your first tour package!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPackages.map((pkg) => (
                <Card key={pkg.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={pkg.image || DEFAULT_IMAGES.package}
                      alt={pkg.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 flex space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEditPackage(pkg)}
                        className="bg-white/90 hover:bg-white"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openDeleteDialog(pkg)}
                        className="bg-white/90 hover:bg-white text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {pkg.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                        {pkg.destination || 'Nepal'}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 text-green-600" />
                        {pkg.duration_days} days
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2 text-purple-600" />
                        Max {pkg.max_people} people
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm text-gray-500">Price</span>
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(pkg.price)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isAdding ? 'Add New Tour Package' : 'Edit Tour Package'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Package Name *</Label>
                <Input
                  id="name"
                  value={packageForm.name}
                  onChange={(e) => setPackageForm({...packageForm, name: e.target.value})}
                  placeholder="e.g., Everest Base Camp Trek"
                />
              </div>
              <div>
                <Label htmlFor="destination">Destination *</Label>
                <Input
                  id="destination"
                  value={packageForm.destination}
                  onChange={(e) => setPackageForm({...packageForm, destination: e.target.value})}
                  placeholder="e.g., Everest Region"
                />
              </div>
              <div>
                <Label htmlFor="price">Price (Rs.) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={packageForm.price}
                  onChange={(e) => setPackageForm({...packageForm, price: e.target.value})}
                  placeholder="e.g., 50000"
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (Days) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={packageForm.duration_days}
                  onChange={(e) => setPackageForm({...packageForm, duration_days: e.target.value})}
                  placeholder="e.g., 14"
                />
              </div>
              <div>
                <Label htmlFor="max_people">Max People</Label>
                <Input
                  id="max_people"
                  type="number"
                  value={packageForm.max_people}
                  onChange={(e) => setPackageForm({...packageForm, max_people: e.target.value})}
                  placeholder={PLACEHOLDERS.maxPeople}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={packageForm.description}
                onChange={(e) => setPackageForm({...packageForm, description: e.target.value})}
                placeholder="Describe your tour package..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="itinerary">Itinerary</Label>
              <Textarea
                id="itinerary"
                value={packageForm.itinerary}
                onChange={(e) => setPackageForm({...packageForm, itinerary: e.target.value})}
                placeholder={PLACEHOLDERS.itinerary}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="included_services">Included Services</Label>
              <Textarea
                id="included_services"
                value={packageForm.included_services}
                onChange={(e) => setPackageForm({...packageForm, included_services: e.target.value})}
                placeholder="Accommodation, Meals, Guide, Transportation..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="package_image_file">Package Image</Label>
              <Input
                id="package_image_file"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Package preview"
                  className="mt-3 h-40 w-full rounded-md object-cover border border-slate-200"
                />
              )}
              <p className="mt-2 text-xs text-slate-500">
                {getCloudinaryUploadEnabled()
                  ? 'Choose a file to upload to Cloudinary, or use the image URL field below.'
                  : 'Cloudinary env vars are missing. Use the image URL field below.'}
              </p>
            </div>

            <div>
              <Label htmlFor="package_image_url">Package Image URL</Label>
              <Input
                id="package_image_url"
                value={packageForm.image}
                onChange={(e) => setPackageForm({ ...packageForm, image: e.target.value })}
                placeholder={PLACEHOLDERS.imageUrl}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSavePackage} 
              disabled={
                !packageForm.name.trim() || 
                !packageForm.description.trim() || 
                !packageForm.price || 
                !packageForm.duration_days ||
                saving ||
                (imageFile && !getCloudinaryUploadEnabled())
              }
              className={BUTTON_STYLES.secondary}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : isAdding ? 'Add Package' : 'Update Package'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center space-x-2">
              <div className={`${DEFAULTS.avatarSize.small} rounded-full bg-red-100 flex items-center justify-center`}>
                <AlertTriangle className={`${DEFAULTS.iconSize.medium} text-red-600`} />
              </div>
              <div>
                <DialogTitle>Delete Package</DialogTitle>
                <DialogDescription>
                  This action cannot be undone
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-900">
                {packageToDelete?.name}
              </span>
              ? This package will be removed from your listings and customers will no longer be able to book it.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={cancelDelete}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? 'Deleting...' : 'Delete Package'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PackageManager;
