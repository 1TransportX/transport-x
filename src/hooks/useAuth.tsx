
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
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const createFallbackProfile = (userId: string, userEmail: string, userData?: any): UserProfile => {
    const now = new Date().toISOString();
    console.log('Creating fallback profile for:', userId);
    return {
      id: userId,
      email: userEmail,
      first_name: userData?.user_metadata?.first_name || null,
      last_name: userData?.user_metadata?.last_name || null,
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

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Starting fetchUserProfile for user:', userId);
      
      // First check if profile exists
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      console.log('Profile query result:', { profileData, profileError });

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
        // For other errors, create a basic profile
        const fallbackProfile = createFallbackProfile(userId, user?.email || '');
        setProfile(fallbackProfile);
        return;
      }

      let finalProfileData = profileData;

      if (!profileData) {
        console.log('No profile found, attempting to create one...');
        try {
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                email: userData.user.email || '',
                first_name: userData.user.user_metadata?.first_name || null,
                last_name: userData.user.user_metadata?.last_name || null
              })
              .select()
              .maybeSingle();
            
            if (insertError) {
              console.error('Error creating profile:', insertError);
              // Create a fallback profile object
              finalProfileData = createFallbackProfile(userId, userData.user.email || '', userData.user);
            } else {
              finalProfileData = newProfile;
            }
          } else {
            console.log('No user data available, creating fallback');
            finalProfileData = createFallbackProfile(userId, '');
          }
        } catch (createError) {
          console.error('Error in profile creation:', createError);
          finalProfileData = createFallbackProfile(userId, user?.email || '');
        }
      }

      // Fetch user role
      let roleData = null;
      try {
        const { data: fetchedRole, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();

        if (roleError && roleError.code !== 'PGRST116') {
          console.error('Error fetching role:', roleError);
          roleData = { role: 'employee' };
        } else {
          roleData = fetchedRole;
        }

        if (!roleData) {
          console.log('No role found, attempting to create default role...');
          try {
            const { data: newRole, error: insertRoleError } = await supabase
              .from('user_roles')
              .insert({
                user_id: userId,
                role: 'employee'
              })
              .select()
              .maybeSingle();
              
            if (insertRoleError) {
              console.error('Error creating role:', insertRoleError);
              roleData = { role: 'employee' };
            } else {
              roleData = newRole;
            }
          } catch (createRoleError) {
            console.error('Error in role creation:', createRoleError);
            roleData = { role: 'employee' };
          }
        }
      } catch (roleError) {
        console.error('Error in role fetching:', roleError);
        roleData = { role: 'employee' };
      }

      console.log('Final role data:', roleData);

      const userProfile: UserProfile = {
        ...finalProfileData,
        role: roleData?.role || 'employee'
      };

      console.log('Setting final profile:', userProfile);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      // Create a minimal fallback profile to prevent infinite loading
      const fallbackProfile = createFallbackProfile(userId, user?.email || '');
      console.log('Using fallback profile due to error:', fallbackProfile);
      setProfile(fallbackProfile);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    // Get initial session
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

        console.log('Initial session:', session);
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await fetchUserProfile(session.user.id);
          }
          
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    getInitialSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user && event === 'SIGNED_IN') {
            await fetchUserProfile(session.user.id);
          } else if (event === 'SIGNED_OUT') {
            setProfile(null);
          }
          
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    setIsLoading(true);
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName
        }
      }
    });

    if (error) {
      toast({
        title: "Sign Up Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sign Up Successful",
        description: "Please check your email to confirm your account.",
      });
    }

    setIsLoading(false);
    return { error };
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
    }

    setIsLoading(false);
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
      isLoading 
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
