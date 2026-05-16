import { supabase } from './supabaseClient';

export interface UserProfile {
    id?: string;
    account_id?: string;
    name: string;
    role: 'student' | 'teacher' | 'principal';
    gradeLevel?: string;
    avatarUrl: string;
    themeColor: string;
}

export const UserManager = {
    getProfiles: async (): Promise<UserProfile[]> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];
            
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('account_id', user.id);
                
            if (error) throw error;
            
            return data.map(p => ({
                id: p.id,
                name: p.name,
                role: p.role as any,
                gradeLevel: p.grade_level,
                avatarUrl: p.avatar_url,
                themeColor: p.theme_color
            }));
        } catch (e) {
            console.error('Error fetching profiles', e);
            return [];
        }
    },

    saveProfile: async (profile: UserProfile): Promise<void> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const existing = await UserManager.getProfileByName(profile.name);

            if (existing && existing.id) {
                await supabase
                    .from('profiles')
                    .update({
                        role: profile.role,
                        grade_level: profile.gradeLevel,
                        avatar_url: profile.avatarUrl,
                        theme_color: profile.themeColor
                    })
                    .eq('id', existing.id);
            } else {
                await supabase
                    .from('profiles')
                    .insert({
                        account_id: user.id,
                        name: profile.name,
                        role: profile.role,
                        grade_level: profile.gradeLevel,
                        avatar_url: profile.avatarUrl,
                        theme_color: profile.themeColor
                    });
            }
        } catch (e) {
            console.error('Error saving profile', e);
        }
    },

    updateAvatar: async (name: string, newAvatarUrl: string): Promise<void> => {
        try {
            const existing = await UserManager.getProfileByName(name);
            if (existing && existing.id) {
                await supabase
                    .from('profiles')
                    .update({ avatar_url: newAvatarUrl })
                    .eq('id', existing.id);
            }
        } catch (e) {
            console.error('Error updating avatar', e);
        }
    },

    deleteProfile: async (name: string): Promise<void> => {
        try {
            const existing = await UserManager.getProfileByName(name);
            if (existing && existing.id) {
                await supabase
                    .from('profiles')
                    .delete()
                    .eq('id', existing.id);
            }
        } catch (e) {
            console.error('Error deleting profile', e);
        }
    },

    getProfileByName: async (name: string): Promise<UserProfile | undefined> => {
        const profiles = await UserManager.getProfiles();
        return profiles.find(p => p.name.toLowerCase() === name.toLowerCase());
    }
};
