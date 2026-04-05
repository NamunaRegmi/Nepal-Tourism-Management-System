import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Mountain, Users, Shield, Building2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog';
import { notifyAppDataChanged } from '@/lib/dataSync';

const AuthModal = ({ isOpen, onClose, onNavigate }) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/auth/google/', {
        credential: credentialResponse.credential,
        role: selectedRole
      });

      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      notifyAppDataChanged();

      toast.success(`Welcome! Logged in as ${selectedRole}.`, {
        duration: 3000,
        icon: '✅',
      });

      onClose();
      const userRole = selectedRole;
      if (userRole === 'user') {
        onNavigate('destination-results');
      } else {
        onNavigate(`${userRole}-dashboard`);
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Google login failed. Please try again.');
      setError('Google login failed. Please try again.');
    }
  };

  const roles = [
    { id: 'user', label: 'User', icon: Users, description: 'Book tours and explore Nepal' },
    { id: 'guide', label: 'Tour Guide', icon: MapPin, description: 'List your profile and take bookings' },
    { id: 'provider', label: 'Travel Service Provider', icon: Building2, description: 'Offer tourism services' },
    { id: 'admin', label: 'Admin', icon: Shield, description: 'Manage the platform' },
  ];

  const handleSubmit = async (isSignup = false) => {
    setError('');

    if (!selectedRole) {
      setError('Please select a role first');
      return;
    }

    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (isSignup) {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    try {
      const endpoint = isSignup ? 'register' : 'login';
      const payload = {
        email: formData.email,
        password: formData.password,
        role: selectedRole
      };

      if (isSignup) {
        payload.name = formData.name;
      }

      const response = await axios.post(`http://127.0.0.1:8000/api/auth/${endpoint}/`, payload);

      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      notifyAppDataChanged();

      const message = isSignup 
        ? `Account created successfully! Welcome as ${selectedRole}.` 
        : `Logged in successfully as ${selectedRole}!`;
      toast.success(message, {
        duration: 3000,
        icon: '✅',
      });

      onClose();
      const userRole = selectedRole;
      if (userRole === 'user') {
        onNavigate('destination-results');
      } else {
        onNavigate(`${userRole}-dashboard`);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Authentication failed';
      toast.error(errorMsg);
      setError(errorMsg);
    }
  };

  if (showForgotPassword) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className="sm:max-w-md bg-white border-0 p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Reset Password</DialogTitle>
            <CardDescription>Enter your email to receive a password reset link</CardDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowForgotPassword(false);
                  setError('');
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={async () => {
                  if (!formData.email) {
                    setError('Please enter your email');
                    return;
                  }
                  try {
                    await axios.post('http://127.0.0.1:8000/api/auth/forgot-password/', {
                      email: formData.email
                    });
                    alert('Password reset email sent! Check your inbox.');
                    setShowForgotPassword(false);
                    setError('');
                  } catch (err) {
                    setError('Failed to send reset link');
                  }
                }}
              >
                Send Reset Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[425px] p-6 bg-slate-50 border border-gray-200">
        <DialogHeader className="text-center pb-2">
          <div className="flex justify-center mb-2">
            <div className="flex items-center gap-2">
              <Mountain className="h-8 w-8 text-blue-600" />
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Nepal Tourism
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-2">
          {!selectedRole ? (
            <div>
              <h3 className="text-center font-medium text-gray-700 mb-4">Select Your Role</h3>
              <div className="space-y-3">
                {roles.map((role) => (
                  <Card
                    key={role.id}
                    className="cursor-pointer border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all bg-white"
                    onClick={() => setSelectedRole(role.id)}
                  >
                    <CardHeader className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <role.icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-bold text-gray-800">{role.label}</CardTitle>
                          <CardDescription className="text-xs mt-1 text-gray-500">
                            {role.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4 p-2 bg-white rounded-lg flex items-center justify-between border shadow-sm">
                <Badge className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border-0">
                  {React.createElement(roles.find(r => r.id === selectedRole).icon, { className: "h-3.5 w-3.5" })}
                  {roles.find(r => r.id === selectedRole).label}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRole(null)}
                  className="h-8 text-xs text-gray-500 hover:text-gray-900"
                >
                  Change
                </Button>
              </div>

              <Tabs defaultValue="login" className="w-full">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="text-xs text-blue-600 hover:underline"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <Button
                    onClick={() => handleSubmit(false)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Login
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-slate-50 px-2 text-gray-500">Or continue with</span>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => setError('Google Login Failed')}
                      useOneTap
                    />
                  </div>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                  </div>

                  <Button
                    onClick={() => handleSubmit(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Sign Up
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
