/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  name: string;
  email: string;
  goal: 'muscle_gain' | 'weight_loss' | 'endurance' | 'health';
  weight: number; // kg
  activityLevel: 'sedentary' | 'moderate' | 'active' | 'athlete';
  proteinTarget: number; // g/day
  isSubscribed: boolean;
  avatarUrl?: string;
}

export interface NutritionEntry {
  id: string;
  date: string;
  protein: number;
  calories: number;
  label: string;
  type: 'meal' | 'supplement';
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  type: 'post-workout' | 'snack' | 'pre-workout';
  scientificInsight: string;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  productName: string;
  avatarUrl?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
