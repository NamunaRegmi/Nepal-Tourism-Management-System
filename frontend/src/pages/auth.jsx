import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import React, { useState } from 'react';
import { Mountain, Users, Shield, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const Auth = ({ onNavigate }) => {
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
      
      alert('Login successful!');
      const userRole = selectedRole;
      onNavigate(`${userRole}-dashboard`);
    } catch (error) {
      console.error('Login failed:', error);
      setError('Google login failed. Please try again.');
    }
  };

  const roles = [
    { id: 'user', label: 'User', icon: Users, description: 'Book tours and explore Nepal' },
    { id: 'admin', label: 'Admin', icon: Shield, description: 'Manage the platform' },
    { id: 'provider', label: 'Travel Service Provider', icon: Building2, description: 'Offer tourism services' }
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

      const userRole = selectedRole;
      onNavigate(`${userRole}-dashboard`);
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Authentication failed';
      setError(errorMsg);
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-fixed bg-cover bg-center p-4"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1350&q=80')",
      }}
    >
      <div className="absolute inset-0 bg-black/30"></div>

      <div className="relative w-full max-w-md z-10">
        <Button 
          variant="ghost"
          onClick={() => onNavigate('home')}
          className="mb-4 text-white"
        >
          ← Back to Home
        </Button>

        <Card className="border border-white/30 shadow-2xl bg-white/5 backdrop-blur-md">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-2">
                <Mountain className="h-10 w-10 text-white" />
                <span className="text-2xl font-bold text-white">
                  Nepal Tourism
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {!selectedRole ? (
              <div>
                <CardTitle className="text-center mb-6 text-white">Select Your Role</CardTitle>
                <div className="space-y-3">
                  {roles.map((role) => (
                    <Card
                      key={role.id}
                      className="cursor-pointer border border-white/30 hover:border-white/50 hover:bg-white/10 transition-all bg-white/5 backdrop-blur-md"
                      onClick={() => setSelectedRole(role.id)}
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <role.icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-base text-white">{role.label}</CardTitle>
                            <CardDescription className="text-sm mt-1 text-white/70">
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
                <div className="mb-6 p-3 bg-white/10 backdrop-blur rounded-lg flex items-center justify-between border border-white/30">
                  <Badge className="flex items-center gap-2 bg-white/20 text-white hover:bg-white/30">
                    {React.createElement(roles.find(r => r.id === selectedRole).icon, { className: "h-4 w-4" })}
                    {roles.find(r => r.id === selectedRole).label}
                  </Badge>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedRole(null)}
                    className="text-white hover:bg-white/20"
                  >
                    Change
                  </Button>
                </div>

                <Tabs defaultValue="login" className="w-full">
                  {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg backdrop-blur">
                      <p className="text-red-200 text-sm">{error}</p>
                    </div>
                  )}
                  
                  <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/10 backdrop-blur">
                    <TabsTrigger value="login" className="text-white">Login</TabsTrigger>
                    <TabsTrigger value="signup" className="text-white">Sign Up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-white">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                      />
                    </div>

                    <div className="flex justify-end">
                      <button 
                        type="button"
                        className="text-sm text-white/80 hover:text-white hover:underline"
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
                        <span className="w-full border-t border-white/20" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-transparent px-2 text-white/70">Or continue with</span>
                      </div>
                    </div>

                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => setError('Google Login Failed')}
                      useOneTap
                    />
                  </TabsContent>

                  <TabsContent value="signup" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-white">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-white">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-white">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
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
          </CardContent>
        </Card>
        
        {showForgotPassword && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4 border border-white/30 shadow-2xl bg-white/10 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white">Reset Password</CardTitle>
                <CardDescription className="text-white/70">Enter your email to receive a password reset link</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
                {error && <p className="text-red-200 text-sm">{error}</p>}
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    className="flex-1 text-white border-white/30 hover:bg-white/10"
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
                        const response = await axios.post('http://127.0.0.1:8000/api/auth/forgot-password/', {
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
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;