import React, { useState, useEffect } from 'react';

// Workaround for React import issues
const createContext = (React as any).createContext;
const useContext = (React as any).useContext;

import { toast } from 'react-hot-toast'
import { io, Socket } from 'socket.io-client'
import { logger } from '@/lib/logger'
import { loadUserSession } from '@/lib/storage'
import { NotificationService } from '@/lib/browserNotificationService'

export interface Notification {
  id: string
  type: 'service_complete' | 'payment_success' | 'cleaner_accepted' | 'cleaner_on_way' | 'new_message' | 'info' | 'booking_created' | 'booking_accepted' | 'booking_completed' | 'payment_completed' | 'payout_processed' | 'newMessage' | 'cleaner_status_update'
  title: string
  message: string
  bookingId?: string
  read: boolean
  createdAt: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotification: (id: string) => void
  clearAll: () => void
  toastMuted: boolean
  toggleToastMute: () => void
}

const NotificationContext = createContext(undefined as NotificationContextType | undefined)

const STORAGE_KEY = 'cleancloak_notifications'
const TOAST_MUTE_KEY = 'cleancloak_toast_mute'

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(() => {

    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (error) {
        logger.error('Failed to parse stored notifications', error instanceof Error ? error : undefined, { eventId: 'parse-notifications-error' });
        return []
      }
    }
    return []
  })
  const [toastMuted, setToastMuted] = useState<boolean>(() => {
    const stored = localStorage.getItem(TOAST_MUTE_KEY)
    return stored === 'true'
  })


  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
  }, [notifications])

  useEffect(() => {
    localStorage.setItem(TOAST_MUTE_KEY, String(toastMuted))
  }, [toastMuted])


  useEffect(() => {
    let socket: Socket | null = null;
    const session = loadUserSession();

    if (!session?.id) {
      console.log('No user session found, skipping socket connection');
      return;
    }

    // Register for FCM notifications
    const registerFCMNotifications = async () => {
      try {
        const permissionGranted = await NotificationService.requestPermission();
        if (permissionGranted) {
          const token = await NotificationService.getDeviceToken();
          if (token) {
            // Send token to backend
            await fetch('/api/users/device-token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
              },
              body: JSON.stringify({ deviceToken: token })
            });
            console.log('FCM token registered successfully');
          }
        }
      } catch (error) {
        console.error('Error registering for FCM notifications:', error);
      }
    };

    registerFCMNotifications();

    try {
      const OVERRIDE_API_URL = localStorage.getItem('apiOverride') || ''
      const VITE_API_URL = import.meta.env.VITE_API_URL
      const base = OVERRIDE_API_URL || VITE_API_URL || window.location.origin
      const socketUrl = base.endsWith('/api') ? base.slice(0, -4) : base;

      socket = io(socketUrl, {
        query: { userId: session.id },
        transports: ['websocket'],
        withCredentials: true
      });

      socket.on('connect', () => {
        console.log('🚀 Socket.io connected');
      });

      socket.on('connect_error', (error) => {
        logger.error('Socket connection error', error instanceof Error ? error : undefined, { eventId: 'socket-connection-error' });
      });

      const eventTypes = [
        'booking_created',
        'booking_accepted',
        'booking_completed',
        'payment_completed',
        'payout_processed',
        'newMessage',
        'cleaner_status_update'
      ];

      eventTypes.forEach(type => {
        socket?.on(type, (data) => {
          processNotification(type, data);
        });
      });

      // Listen for FCM messages
      NotificationService.onMessageReceived((payload: any) => {
        processNotification('fcm_message', payload);
      });

      return () => {
        if (socket) socket.disconnect();
      }
    } catch (error) {
      logger.error('Failed to setup Socket for notifications', error instanceof Error ? error : undefined, { eventId: 'socket-setup-error' });
    }
  }, [])

  const unreadCount = notifications.filter((n: Notification) => !n.read).length

  const processNotification = (type: string, data: any) => {

    const titleMap: Record<string, string> = {
      booking_created: 'New Booking',
      booking_accepted: 'Job Accepted',
      booking_completed: 'Job Completed',
      payment_completed: 'Payment Received',
      payout_processed: 'Payout Sent',
      newMessage: 'New Message',
      cleaner_status_update: 'Cleaner Update',
      fcm_message: 'New Notification',
    }
    const messageMap: Record<string, (d: any) => string> = {
      booking_created: (d) => `A ${d?.serviceCategory || 'service'} booking is now pending`,
      booking_accepted: (d) => `Booking ${d?.bookingId?.slice?.(0, 8) || ''} accepted`,
      booking_completed: (d) => `Booking ${d?.bookingId?.slice?.(0, 8) || ''} marked completed`,
      payment_completed: (d) => `Payment confirmed for booking ${d?.bookingId?.slice?.(0, 8) || ''}`,
      payout_processed: (d) => `Payout processed for booking ${d?.bookingId?.slice?.(0, 8) || ''}`,
      newMessage: (d) => `New message${d?.message?.senderName ? ` from ${d.message.senderName}` : ''}${d?.bookingId ? ` for booking ${d.bookingId.slice(0, 8)}` : ''}`,
      cleaner_status_update: (d) => `Cleaner status updated to ${d?.status || 'new status'}`,
      fcm_message: (d) => d?.notification?.body || 'You have received a notification',
    }

    const title = titleMap[type] || 'Update'
    const messageBuilder = messageMap[type]
    const message = messageBuilder ? messageBuilder(data) : 'New activity'

    setNotifications((prev: Notification[]) => ([
      {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: (type === 'booking_completed' ? 'service_complete' :
          type === 'payment_completed' ? 'payment_success' :
            type === 'booking_accepted' ? 'cleaner_accepted' :
              type === 'newMessage' ? 'new_message' :
                type === 'cleaner_status_update' ? 'cleaner_on_way' :
                  type === 'fcm_message' ? 'info' :
                    type || 'info') as Notification['type'],
        title,
        message,
        bookingId: data?.bookingId || data?.data?.bookingId,
        read: false,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]))

    if (!toastMuted) {
      toast.custom((t: any) => (
        <div
          className={`${t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-slate-900 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-yellow-400/20 border border-slate-700/50 backdrop-blur-xl overflow-hidden`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.162 6 8.375 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-white">
                  {title}
                </p>
                <p className="mt-1 text-sm text-slate-200">
                  {message}
                </p>
              </div>
            </div>
          </div>
          <div className="flex">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border-l border-slate-700 p-4 flex items-center justify-center text-slate-300 hover:text-white transition-colors duration-200 outline-none focus:outline-none"
            >
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))
    }
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      read: false
    } as Notification;

    setNotifications((prev: Notification[]) => [newNotification, ...prev])
  }

  const markAsRead = (id: string) => {
    setNotifications((prev: Notification[]) =>
      prev.map((n: Notification) => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev: Notification[]) =>
      prev.map((n: Notification) => ({ ...n, read: true }))
    )
  }

  const clearNotification = (id: string) => {
    setNotifications((prev: Notification[]) => prev.filter((n: Notification) => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const toggleToastMute = () => {
    setToastMuted((prev: boolean) => !prev)
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAll,
        toastMuted,
        toggleToastMute
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}