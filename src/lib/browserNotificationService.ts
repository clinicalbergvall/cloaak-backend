// @ts-ignore - Firebase messaging type issue
import { getToken, onMessage } from 'firebase/messaging';
// @ts-ignore - Firebase messaging type issue
import { getMessaging } from 'firebase/messaging';
import { app } from './firebase';

// Get the messaging instance
const messaging: any = typeof window !== 'undefined' && 'serviceWorker' in navigator ? getMessaging(app) : undefined;

export class NotificationService {
  static async requestPermission(): Promise<boolean> {
    if (!messaging) return false;
    
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        return true;
      } else {
        console.log('Notification permission not granted.');
        return false;
      }
    } catch (err) {
      console.error('Unable to get permission to notify.', err);
      return false;
    }
  }

  static async getDeviceToken(): Promise<string | null> {
    if (!messaging) return null;
    
    try {
      // Use your VAPID key here
      const vapidKey = "BGrMebHqHQnMZfaKsqP-MVGMkmRr3NMisjyzxskkMXoWlYoJAbr-Yl6CzYZwDMwY3Z7MaiNVd2VDh0r6cigC3gY";
      const token = await getToken(messaging, { vapidKey });
      console.log('FCM Registration Token:', token);
      return token;
    } catch (err) {
      console.error('An error occurred while retrieving token. ', err);
      return null;
    }
  }

  static onMessageReceived(callback: (payload: any) => void): void {
    if (!messaging) return;
    
    onMessage(messaging, (payload: any) => {
      console.log('Foreground message received: ', payload);
      callback(payload);
    });
  }

  static showPopupNotification(title: string, options: NotificationOptions): Notification | undefined {
    if (Notification.permission === 'granted') {
      return new Notification(title, options);
    }
  }
}