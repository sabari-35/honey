import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
// import { LogIn, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      if (isSignUp) {
        if (!fullName.trim()) return toast.error("Full Name is required for registration.");

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });

        if (error) throw error;
        toast.success("Identity registered successfully! Welcome to the vault.");
        navigate('/shop');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        toast.success("Authentication accepted. Vault unlocked.");
        navigate('/shop');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/shop`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Error logging in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen mt-10 pt-20 pb-12 flex flex-col items-center justify-center px-4 relative ">

      {/* Background Orbs to match Neumorphic aesthetic */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gold-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gold-light/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="neumorphic-panel p-8 md:p-12 w-full max-w-md rounded-3xl flex flex-col items-center relative z-10">
          {/* <div className="display-inline w-20 h-20 rounded-2xl neumorphic-inset flex items-center justify-center text-gold-primary mb-8 shadow-inner">
            {isSignUp ? <UserPlus size={36} /> : <LogIn size={36} />}
          </div> */}

        <h1 className="font-display text-4xl text-gold-primary mb-3 uppercase tracking-widest text-center">
          {isSignUp ? 'Sign Up' : 'Login'}
        </h1>
        {/* <p className="text-text-secondary mb-10 text-center font-sans tracking-wide">
          {isSignUp ? 'Register to gain priority access to the Reserve Collection.' : 'Sign in to access your GOLDVAULT account and track your reserve orders.'}
        </p> */}

        <form onSubmit={handleAuth} className="w-full space-y-5">
          {isSignUp && (
            <Input
              label="Full Name"
              type="text"
              placeholder="Sabari"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required={isSignUp}
            />
          )}
          <Input
            label="Email Address"
            type="email"
            placeholder="sabari.psmail@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            size="lg"
            className="w-full mt-4 h-14 text-lg font-bold tracking-widest font-display"
            isLoading={isLoading}
          >
            {isSignUp ? 'Sign up' : 'Sign in'}
          </Button>
        </form>

        <div className="w-full flex items-center gap-4 my-8">
          <div className="h-px bg-glass-border flex-1"></div>
          <span className="text-text-muted text-xs uppercase tracking-widest font-bold">Or</span>
          <div className="h-px bg-glass-border flex-1"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full h-14 rounded-2xl bg-[#1A1A1E] border border-glass-border hover:border-gold-primary/50 text-text-primary hover:text-gold-primary transition-all flex items-center justify-center gap-4 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className={`w-6 h-6 grayscale-0 transition-all duration-300 ${isLoading ? 'opacity-50' : ''}`} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span className="font-sans font-bold tracking-widest text-sm uppercase">
            {isLoading ? 'Authenticating...' : 'Continue with Google'}
          </span>
        </button>

        <p className="mt-8 text-text-secondary text-sm">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="ml-2 text-gold-primary hover:text-gold-light font-bold underline decoration-transparent hover:decoration-gold-light transition-all cursor-pointer"
          >
            {isSignUp ? "Sign In" : "Register"}
          </button>
        </p>

      </div>
    </div>
  );
}
