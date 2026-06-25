import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast({
        title: 'Success',
        description: 'Logged in successfully',
      });
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      // @ts-ignore
      let errorMessage = 'Login failed. Please check your connection.';

      if (error instanceof Error) {
        errorMessage = error.message;
        // Map Firebase error codes to user-friendly messages
        if (errorMessage.includes('auth/invalid-credential') || errorMessage.includes('auth/user-not-found') || errorMessage.includes('auth/wrong-password')) {
          errorMessage = 'Incorrect email or password. Please try again.';
        } else if (errorMessage.includes('auth/too-many-requests')) {
          errorMessage = 'Too many failed attempts. Please try again later.';
        } else if (errorMessage.includes('network-request-failed')) {
          errorMessage = 'Network error. Please check your internet connection.';
        }
      }

      toast({
        title: 'Login Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
          <div className="mt-4 space-y-2 text-center">
            <Button
              variant="link"
              className="text-sm text-muted-foreground hover:text-primary p-0 h-auto"
              onClick={async () => {
                if (!email) {
                  toast({
                    title: 'Email Required',
                    description: 'Please enter your email address first.',
                    variant: 'destructive',
                  });
                  return;
                }
                setLoading(true);
                try {
                  await resetPassword(email);
                  toast({
                    title: 'Email Sent',
                    description: 'Password reset link has been sent to your email.',
                  });
                } catch (error) {
                  console.error('Reset password error:', error);
                  let errorMessage = 'Failed to send reset email.';
                  if (error instanceof Error && error.message.includes('auth/user-not-found')) {
                    errorMessage = 'No account found with this email.';
                  }
                  toast({
                    title: 'Error',
                    description: errorMessage,
                    variant: 'destructive',
                  });
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              Forgot password?
            </Button>
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>


    </div >
  );
}


