import { getSupabase } from './supabase';
import { UserProfile, NutritionEntry, Review, ChatMessage } from '../types';

/**
 * API layer for Vitalis Bio
 * Provides typed functions to interact with Supabase tables.
 * Gracefully handles missing configuration by returning defaults/empty data.
 */

export const api = {
  // --- User Profile ---
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const client = getSupabase();
      const { data, error } = await client
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return {
        name: data.name,
        email: data.email,
        goal: data.goal,
        weight: data.weight,
        activityLevel: data.activity_level,
        proteinTarget: data.protein_target,
        isSubscribed: data.is_subscribed,
        avatarUrl: data.avatar_url,
      } as UserProfile;
    } catch (err) {
      console.warn('API getProfile failed (likely config):', err);
      return null;
    }
  },

  // --- Nutrition Entries ---
  async getNutritionEntries(userId: string): Promise<NutritionEntry[]> {
    try {
      const client = getSupabase();
      const { data, error } = await client
        .from('nutrition_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true }); // Ordering by created_at rather than date text

      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id,
        date: row.entry_date || row.date,
        protein: row.protein,
        calories: row.calories,
        label: row.label,
        type: row.entry_type || row.type
      })) as NutritionEntry[];
    } catch (err) {
      console.warn('API getNutritionEntries failed:', err);
      return [];
    }
  },

  async addNutritionEntry(userId: string, entry: Partial<NutritionEntry>) {
    try {
      const client = getSupabase();
      const { error } = await client
        .from('nutrition_entries')
        .insert({
          user_id: userId,
          entry_date: entry.date,
          protein: entry.protein,
          calories: entry.calories,
          label: entry.label,
          entry_type: entry.type
        });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('API addNutritionEntry failed:', err);
      return false;
    }
  },

  // --- Products ---
  async getProducts() {
    try {
      const client = getSupabase();
      const { data, error } = await client
        .from('products')
        .select('*')
        .order('price', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('API getProducts failed:', err);
      return [];
    }
  },

  // --- Reviews ---
  async getReviews(): Promise<Review[]> {
    try {
      const client = getSupabase();
      const { data, error } = await client
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as Review[]) || [];
    } catch (err) {
      console.warn('API getReviews failed:', err);
      return [];
    }
  },

  // --- Feed Events ---
  async getFeedEvents() {
    try {
      const client = getSupabase();
      const { data, error } = await client
        .from('feed_events')
        .select('event_type, description, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data || []).map(row => ({
        content: row.description, // Mapping to existing UI expectance
        description: row.description
      })) ;
    } catch (err) {
      console.warn('API getFeedEvents failed:', err);
      return [];
    }
  },

  // --- Chat Sessions ---
  async saveChatMessage(userId: string, sessionId: string, message: ChatMessage) {
    try {
      const client = getSupabase();
      const { error } = await client
        .from('chat_sessions')
        .insert({
          user_id: userId,
          role: message.role,
          content: message.content
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error saving chat message:', err);
    }
  },

  async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    try {
      const client = getSupabase();
      const { data, error } = await client
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(m => ({
        role: m.role,
        content: m.content,
        timestamp: new Date(m.created_at).getTime()
      }));
    } catch (err) {
      console.warn('API getChatHistory failed:', err);
      return [];
    }
  },

  async createProfile(profile: UserProfile & { id: string }) {
    try {
      const client = getSupabase();
      const dbProfile = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        goal: profile.goal,
        weight: profile.weight,
        activity_level: profile.activityLevel,
        protein_target: profile.proteinTarget,
        is_subscribed: profile.isSubscribed,
        avatar_url: profile.avatarUrl,
      };
      const { error } = await client
        .from('users')
        .insert([dbProfile]);
      
      if (error) {
        console.error('Detailed error creating user profile:', error);
        throw error;
      }
      return true;
    } catch (err) {
      console.error('Error creating user profile:', err);
      return false;
    }
  },
  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    try {
      const client = getSupabase();
      
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.goal !== undefined) dbUpdates.goal = updates.goal;
      if (updates.weight !== undefined) dbUpdates.weight = updates.weight;
      if (updates.activityLevel !== undefined) dbUpdates.activity_level = updates.activityLevel;
      if (updates.proteinTarget !== undefined) dbUpdates.protein_target = updates.proteinTarget;
      if (updates.isSubscribed !== undefined) dbUpdates.is_subscribed = updates.isSubscribed;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;

      console.log('API updateProfile: userId:', userId, 'dbUpdates:', dbUpdates);

      const { error } = await client
        .from('users')
        .update(dbUpdates)
        .eq('id', userId);
      
      if (error) {
        console.error('Detailed error updating user profile:', error);
        throw error;
      }
      return true;
    } catch (err) {
      console.error('Error updating user profile:', err);
      return false;
    }
  }
};
