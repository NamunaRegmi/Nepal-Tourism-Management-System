import { useState } from 'react';
import axios from 'axios';
import { Mountain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ResetPassword = ({ onNavigate }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const pathParts = window.location.pathname.split('/');
  const uid = pathParts[2];
  const token = pathParts[3];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/auth/reset-password/', {
        uid,
        token,
        new_password: newPassword
      });

      setSuccess(response.data.message);
      setTimeout(() => onNavigate('auth'), 2000);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Something went wrong. Try again.');
      }
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-fixed bg-cover bg-center p-4"
      style={{
        backgroundImage: "url('https://www.pixelstalk.net/wp-content/uploads/2016/06/Download-HD-Nature-Backgrounds.jpg')",
      }}
    >
      <div className="absolute inset-0 bg-black/30"></div>

      <div className="relative w-full max-w-md z-10">
        <Card className="border-2 shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Mountain className="h-10 w-10 text-blue-600" />
            </div>
            <CardTitle>Reset Your Password</CardTitle>
            <CardDescription>Enter your new password below</CardDescription>
          </CardHeader>

          <CardContent>
            {success ? (
              <div className="text-center py-4">
                <div className="text-green-600 text-lg font-semibold mb-2">
                  ✓ Password Reset Successful!
                </div>
                <p className="text-sm text-gray-600">Redirecting to login...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">Confirm Password</Label>
                  <Input
                    id="confirm-new-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <Button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Reset Password
                </Button>

                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => onNavigate('auth')}
                  className="w-full"
                >
                  Back to Login
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;