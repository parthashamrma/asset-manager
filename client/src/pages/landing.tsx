import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, ArrowRight, Loader2 } from "lucide-react";

export function LandingPage() {
  const { login, register, user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setLocation(user.role === 'teacher' ? "/teacher" : "/student");
    }
  }, [user, setLocation]);

  const onLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      await login({
        username: formData.get("username") as string,
        password: formData.get("password") as string,
      });
      // Will redirect via useEffect
    } catch (err: any) {
      toast({ title: "Login Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      await register({
        username: formData.get("username") as string,
        password: formData.get("password") as string,
        name: formData.get("name") as string,
        role: formData.get("role") as 'teacher' | 'student',
      });
      toast({ title: "Registration Successful", description: "Welcome to Astra!" });
    } catch (err: any) {
      toast({ title: "Registration Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/30 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Left Col: Branding */}
        <div className="space-y-8 hidden lg:block">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25">
              <GraduationCap className="w-8 h-8" />
            </div>
            <span className="font-display font-bold text-3xl text-foreground">Astra</span>
          </div>
          
          <h1 className="text-5xl font-display font-extrabold text-foreground leading-tight text-balance">
            Modern Attendance <br/> Management for <span className="text-primary text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Institutions</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-md">
            A seamless, professional portal for tracking attendance, managing leaves, and analyzing student performance effortlessly.
          </p>
          
          <div className="grid grid-cols-2 gap-6 pt-4">
            <div className="border-l-4 border-primary pl-4">
              <p className="font-display font-bold text-2xl text-foreground">99.9%</p>
              <p className="text-sm text-muted-foreground">Uptime Guarantee</p>
            </div>
            <div className="border-l-4 border-blue-400 pl-4">
              <p className="font-display font-bold text-2xl text-foreground">Real-time</p>
              <p className="text-sm text-muted-foreground">Analytics & Sync</p>
            </div>
          </div>
        </div>

        {/* Right Col: Auth Card */}
        <Card className="w-full max-w-md mx-auto shadow-2xl shadow-black/5 border-white/20 glass-panel">
          <CardHeader className="text-center pb-2">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
              <GraduationCap className="w-8 h-8 text-primary" />
              <span className="font-display font-bold text-2xl">Astra</span>
            </div>
            <CardTitle className="font-display text-2xl">Welcome Back</CardTitle>
            <CardDescription>Enter your credentials to access the portal</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={onLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username">Roll No / Faculty ID</Label>
                    <Input id="login-username" name="username" required className="bg-white/50" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="login-password">Password</Label>
                      <span className="text-xs text-primary hover:underline cursor-pointer">Forgot password?</span>
                    </div>
                    <Input id="login-password" name="password" type="password" required className="bg-white/50" />
                  </div>
                  <Button type="submit" className="w-full mt-4 h-11 text-base font-medium shadow-md transition-transform hover:-translate-y-0.5" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={onRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Full Name</Label>
                    <Input id="reg-name" name="name" required className="bg-white/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-username">Roll No / Faculty ID</Label>
                    <Input id="reg-username" name="username" required className="bg-white/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-role">Role</Label>
                    <select id="reg-role" name="role" required className="flex h-10 w-full rounded-md border border-input bg-white/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <Input id="reg-password" name="password" type="password" required className="bg-white/50" />
                  </div>
                  <Button type="submit" className="w-full mt-4 h-11 text-base font-medium shadow-md transition-transform hover:-translate-y-0.5" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
