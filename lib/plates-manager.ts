// lib/plates-manager.ts
// Plates Currency Management System

import { supabase } from '@/constants/supabase';
import { PushNotificationService } from './services/push-notifications';

export interface PlatesTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: 'earned' | 'spent' | 'bonus' | 'refund';
  source: string;
  description: string;
  created_at: string;
}

export interface PlatesDiscount {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed_amount' | 'plates';
  discount_value: number;
  min_purchase_amount: number;
  max_uses: number;
  used_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

export class PlatesManager {
  /**
   * Get user's plate balance
   */
  static async getBalance(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('plate_balance')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return data?.plate_balance || 0;
    } catch (error) {
      console.error('Error getting plate balance:', error);
      return 0;
    }
  }

  /**
   * Add plates to user's balance
   */
  static async addPlates(
    userId: string,
    amount: number,
    source: string,
    description: string,
    sendNotification: boolean = true
  ): Promise<boolean> {
    try {
      // Get current balance
      const currentBalance = await this.getBalance(userId);
      const newBalance = currentBalance + amount;

      // Update balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ plate_balance: newBalance })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Record transaction
      const { error: transactionError } = await supabase
        .from('plates_transactions')
        .insert({
          user_id: userId,
          amount,
          transaction_type: 'earned',
          source,
          description,
        });

      if (transactionError) throw transactionError;

      // Send push notification for plates earned
      if (sendNotification) {
        try {
          const prefs = await PushNotificationService.getNotificationPreferences(userId);
          if (prefs.plates_earned) {
            await PushNotificationService.notifyPlatesEarned(amount, description);
          }
        } catch (notifError) {
          console.error('Error sending notification:', notifError);
          // Don't fail the whole operation if notification fails
        }
      }

      return true;
    } catch (error) {
      console.error('Error adding plates:', error);
      return false;
    }
  }

  /**
   * Spend plates from user's balance
   */
  static async spendPlates(
    userId: string,
    amount: number,
    source: string,
    description: string
  ): Promise<boolean> {
    try {
      // Get current balance
      const currentBalance = await this.getBalance(userId);

      if (currentBalance < amount) {
        throw new Error('Insufficient plates balance');
      }

      const newBalance = currentBalance - amount;

      // Update balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ plate_balance: newBalance })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Record transaction
      const { error: transactionError } = await supabase
        .from('plates_transactions')
        .insert({
          user_id: userId,
          amount: -amount,
          transaction_type: 'spent',
          source,
          description,
        });

      if (transactionError) throw transactionError;

      return true;
    } catch (error) {
      console.error('Error spending plates:', error);
      return false;
    }
  }

  /**
   * Get user's transaction history
   */
  static async getTransactionHistory(userId: string): Promise<PlatesTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('plates_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  /**
   * Validate and apply discount code
   */
  static async validateDiscountCode(code: string): Promise<PlatesDiscount | null> {
    try {
      const { data, error } = await supabase
        .from('plates_discounts')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error) throw error;

      if (!data) return null;

      // Check validity dates
      const now = new Date();
      const validFrom = new Date(data.valid_from);
      const validUntil = new Date(data.valid_until);

      if (now < validFrom || now > validUntil) {
        return null;
      }

      // Check max uses
      if (data.max_uses > 0 && data.used_count >= data.max_uses) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error validating discount code:', error);
      return null;
    }
  }

  /**
   * Apply discount code to purchase
   */
  static async applyDiscountCode(
    userId: string,
    code: string,
    purchaseAmount: number
  ): Promise<{ success: boolean; discount: PlatesDiscount | null; discountAmount: number }> {
    try {
      const discount = await this.validateDiscountCode(code);

      if (!discount) {
        return { success: false, discount: null, discountAmount: 0 };
      }

      // Check minimum purchase amount
      if (purchaseAmount < discount.min_purchase_amount) {
        return { success: false, discount: null, discountAmount: 0 };
      }

      let discountAmount = 0;

      if (discount.discount_type === 'percentage') {
        discountAmount = (purchaseAmount * discount.discount_value) / 100;
      } else if (discount.discount_type === 'fixed_amount') {
        discountAmount = discount.discount_value;
      } else if (discount.discount_type === 'plates') {
        // Award plates instead of discount
        await this.addPlates(
          userId,
          discount.discount_value,
          'discount_code',
          `קוד הנחה: ${code}`
        );
      }

      // Increment used count
      const { error: updateError } = await supabase
        .from('plates_discounts')
        .update({ used_count: discount.used_count + 1 })
        .eq('id', discount.id);

      if (updateError) throw updateError;

      return { success: true, discount, discountAmount };
    } catch (error) {
      console.error('Error applying discount code:', error);
      return { success: false, discount: null, discountAmount: 0 };
    }
  }

  /**
   * Award plates for achievement
   */
  static async awardAchievementPlates(
    userId: string,
    achievementName: string,
    points: number
  ): Promise<boolean> {
    const success = await this.addPlates(
      userId,
      points,
      'achievement',
      `הושג הישג: ${achievementName}`,
      false // Don't send generic notification
    );

    // Send achievement-specific notification
    if (success) {
      try {
        const prefs = await PushNotificationService.getNotificationPreferences(userId);
        if (prefs.achievements) {
          await PushNotificationService.notifyAchievementUnlocked(achievementName, points);
        }
      } catch (error) {
        console.error('Error sending achievement notification:', error);
      }
    }

    return success;
  }

  /**
   * Award plates for workout
   */
  static async awardWorkoutPlates(userId: string, workoutId: string): Promise<boolean> {
    // Award 10 plates per workout
    return await this.addPlates(userId, 10, 'workout', `אימון הושלם`);
  }

  /**
   * Award plates for class attendance
   */
  static async awardClassPlates(userId: string, classId: string): Promise<boolean> {
    // Award 15 plates per class
    return await this.addPlates(userId, 15, 'class_attendance', `השתתפות בשיעור`);
  }

  /**
   * Calculate plates discount for purchase
   */
  static calculatePlatesDiscount(
    platesBalance: number,
    purchaseAmount: number,
    platesUsed: number
  ): number {
    // 1 plate = 1 ILS discount
    const maxDiscount = Math.min(platesBalance, purchaseAmount * 0.5, platesUsed);
    return maxDiscount;
  }

  /**
   * Use plates for purchase discount
   */
  static async usePlatesForDiscount(
    userId: string,
    platesUsed: number,
    orderId: string
  ): Promise<boolean> {
    return await this.spendPlates(
      userId,
      platesUsed,
      'purchase_discount',
      `הנחה בהזמנה #${orderId}`
    );
  }
}
