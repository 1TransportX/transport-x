import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  department: string | null;
  employee_id: string | null;
  hire_date: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  role: 'admin' | 'employee' | 'driver';
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  signUp: (email: string, password: string, firstName?: string, lastName?: string, role?: 'employee' | 'driver') => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  updateUserRole: (role: 'admin' | 'employee' | 'driver') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const createDefaultProfile = (userId: string, userEmail: string): UserProfile => {
    const now = new Date().toISOString();
    return {
      id: userId,
      email: userEmail,
      first_name: null,
      last_name: null,
      phone: null,
      department: null,
      employee_id: null,
      hire_date: null,
      is_active: true,
      created_at: now,
      updated_at: now,
      role: 'employee'
    };
  };

  const updateUserRole = async (role: 'admin' | 'employee' | 'driver') => {
    if (!user) return;
    
    try {
      console.log('=== Updating user role to:', role);
      
      // Use upsert to handle both insert and update cases
      const { error } = await supabase
        .from('user_roles')
        .upsert({ 
          user_id: user.id, 
          role 
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating role:', error);
        throw error;
      }

      console.log('=== Role updated successfully');
      
      // Refresh the profile to get the updated role
      await refreshProfile();
      
      toast({
        title: "Role Updated",
        description: `Your role has been updated to ${role}.`,
      });
    } catch (error) {
      console.error('Error in updateUserRole:', error);
      toast({
        title: "Error",
        description: "Failed to update role.",
        variant: "destructive"
      });
    }
  };

  const fetchUserProfile = async (userId: string, userEmail: string, forceRefresh: boolean = false) => {
    try {
      console.log('=== Fetching profile for user:', userId, 'forceRefresh:', forceRefresh);
      
      if (forceRefresh) {
        setProfile(null);
        console.log('=== Cleared existing profile data');
      }
      
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      console.log('=== Profile response:', { data: profileData, error: profileError });

      // Fetch role data with improved query
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('=== Role query response:', { 
        data: roleData, 
        error: roleError,
        userId: userId
      });

      let userProfile: UserProfile;

      // Determine the role
      let userRole: 'admin' | 'employee' | 'driver' = 'employee';
      if (roleData?.role) {
        userRole = roleData.role;
        console.log('=== Role found in database:', userRole);
      } else {
        console.log('=== No role found, using default employee role');
      }

      // If no profile exists, create a basic one
      if (!profileData) {
        console.log('No profile found, creating default');
        userProfile = createDefaultProfile(userId, userEmail);
        userProfile.role = userRole;
      } else {
        // Create user profile with role included
        userProfile = {
          ...profileData,
          role: userRole
        };
      }

      console.log('=== Final profile being set:', userProfile);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      // Create a fallback profile so the app doesn't get stuck
      const fallbackProfile = createDefaultProfile(userId, userEmail);
      console.log('Using fallback profile:', fallbackProfile);
      setProfile(fallbackProfile);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    console.log('=== RefreshProfile called - forcing fresh data fetch');
    if (user) {
      setIsLoading(true);
      // Force a fresh fetch with cache busting
      await fetchUserProfile(user.id, user.email || '', true);
    }
  };

  useEffect(() => {
    let mounted = true;
    let profileTimeout: NodeJS.Timeout;
    
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }

        console.log('Initial session:', !!session);
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            profileTimeout = setTimeout(() => {
              fetchUserProfile(session.user.id, session.user.email || '');
            }, 100);
          } else {
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('=== Auth state change:', event, !!session?.user);
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
            // Always fetch fresh profile data on sign in or token refresh
            console.log('=== Fetching fresh profile due to auth event');
            profileTimeout = setTimeout(() => {
              fetchUserProfile(session.user.id, session.user.email || '');
            }, 100);
          } else if (event === 'SIGNED_OUT') {
            setProfile(null);
            setIsLoading(false);
          }
        }
      }
    );

    // Set maximum loading timeout
    const maxLoadingTimeout = setTimeout(() => {
      if (mounted) {
        console.log('Maximum loading timeout reached, stopping loading');
        setIsLoading(false);
      }
    }, 15000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (profileTimeout) clearTimeout(profileTimeout);
      clearTimeout(maxLoadingTimeout);
    };
  }, []);

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string, role: 'employee' | 'driver' = 'employee') => {
    setIsLoading(true);
    
    const redirectUrl = `${window.location.origin}/`;
    
    console.log('=== SIGNUP PROCESS STARTING ===');
    console.log('=== Email:', email);
    console.log('=== Selected role:', role);
    console.log('=== Redirect URL:', redirectUrl);
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
          role: role
        }
      }
    });

    console.log('=== SignUp response:', { data: signUpData, error: signUpError });

    if (signUpError) {
      toast({
        title: "Sign Up Error",
        description: signUpError.message,
        variant: "destructive"
      });
      setIsLoading(false);
      return { error: signUpError };
    }

    toast({
      title: "Sign Up Successful",
      description: "Please check your email to confirm your account.",
    });

    setIsLoading(false);
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      toast({
        title: "Sign In Error",
        description: error.message,
        variant: "destructive"
      });
      setIsLoading(false);
    }
    // Note: Don't set isLoading to false here - let the auth state change handle it
    // This ensures we wait for the profile to be fetched before showing the dashboard

    return { error };
  };

  const signOut = async () => {
    setIsLoading(true);
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        title: "Sign Out Error",
        description: error.message,
        variant: "destructive"
      });
    }
    
    setUser(null);
    setProfile(null);
    setSession(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      session, 
      signUp, 
      signIn, 
      signOut, 
      isLoading,
      refreshProfile,
      updateUserRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
