import { useState, useEffect, useRef } from 'react'
import { Button, Card } from './ui'
import { loadUserSession, getStoredAuthToken } from '@/lib/storage'
import type { ChatMessage } from '@/lib/types'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { io, Socket } from 'socket.io-client'

interface ChatBoxProps {
  bookingId: string
  currentUserId: string
  currentUserName: string
  currentUserRole: 'client' | 'cleaner'
}

export default function ChatBox({
  bookingId,
  currentUserId,
  currentUserName,
  currentUserRole
}: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])


  useEffect(() => {

    const fetchMessages = async () => {
      try {
        const response = await api.get(`/chat/${bookingId}`)

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.chatRoom && data.chatRoom.messages) {

            if (data.chatRoom.messages.length !== messages.length) {

              const transformedMessages = data.chatRoom.messages.map((msg: any) => ({
                id: msg._id,
                bookingId: bookingId,
                senderId: msg.sender._id || msg.sender,
                senderName: msg.sender.name || (msg.senderRole === 'client' ? 'Client' : 'Cleaner'),
                senderRole: msg.senderRole,
                message: msg.message,
                timestamp: msg.timestamp,
                read: msg.senderRole === currentUserRole ? msg.readByCleaner || msg.readByClient : true,
                imageUrl: msg.imageUrl,
              }));
              setMessages(transformedMessages);
            }
          }
        }
      } catch (error) {

        console.error('Error fetching messages:', error)

        if (messages.length === 0) {
          toast.error('Failed to load messages. Please try again.');
        }
      }
    }

    fetchMessages()


    const interval = setInterval(fetchMessages, 5000)

    return () => clearInterval(interval)
  }, [bookingId, currentUserId, currentUserName, currentUserRole, messages.length])


  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        const viewportHeight = window.innerHeight;
        const documentHeight = document.documentElement.clientHeight;
        const heightDifference = Math.abs(documentHeight - viewportHeight);
        
        setIsKeyboardVisible(heightDifference > 150);
        
        // Scroll to bottom when keyboard visibility changes
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    };
    
    // Listen for both resize and orientationchange events
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);


  useEffect(() => {
    let socket: Socket | null = null;
    const session = loadUserSession();

    if (!session?.id) return;

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

      socket.on('newMessage', (data) => {
        const { message: newMessage } = data || {}

        if (newMessage && newMessage.bookingId === bookingId &&
          !messages.some(msg => msg.id === newMessage.id)) {

          const transformedMessage = {
            id: newMessage._id || Date.now().toString(),
            bookingId: bookingId,
            senderId: newMessage.senderId || newMessage.sender,
            senderName: newMessage.senderName || (newMessage.senderRole === 'client' ? 'Client' : 'Cleaner'),
            senderRole: newMessage.senderRole,
            message: newMessage.message,
            timestamp: newMessage.timestamp || new Date().toISOString(),
            read: newMessage.read || false,
            imageUrl: newMessage.imageUrl,
          };
          setMessages(prev => [...prev, transformedMessage]);
        }
      });

      return () => {
        if (socket) socket.disconnect();
      }
    } catch (e) {
      console.error('Failed to setup Socket for chat:', e)
    }
  }, [bookingId, messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      const response = await api.post(`/chat/${bookingId}/message`, {
        message: newMessage.trim()
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.message) {
          setMessages(prev => [...prev, data.message])
          setNewMessage('')
        } else {
          toast.error(data.message || 'Failed to send message')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.message || 'Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message. Please try again.')
    }
  }

  const handleImageUpload = () => {
    toast('Image upload coming soon!', { icon: '📸' })
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()


    const isToday = date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()

    if (isToday) {

      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }

    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays < 1) {
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m`
      if (diffHours < 24) return `${diffHours}h`
    }


    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }


  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groups: { [key: string]: ChatMessage[] } = {}

    messages.forEach(message => {
      const date = new Date(message.timestamp)
      const today = new Date();
      const dateKey = date.toISOString().split('T')[0];
      const todayKey = today.toISOString().split('T')[0];


      const displayKey = dateKey === todayKey ? 'Today' : dateKey;

      if (!groups[displayKey]) {
        groups[displayKey] = []
      }

      groups[displayKey].push(message)
    })

    return groups
  }

  return (
    <Card className={`flex flex-col ${isKeyboardVisible ? 'h-[60vh]' : 'h-[500px]'} max-h-[70vh]`}>
      { }
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Chat</h3>
            <p className="text-xs text-gray-500">Booking #{bookingId.slice(0, 8)}</p>
          </div>
        </div>
      </div>

      { }
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesEndRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">No messages yet</p>
            <p className="text-xs">Start the conversation!</p>
          </div>
        ) : (
          Object.entries(groupMessagesByDate(messages)).map(([date, dateMessages]) => (
            <div key={date}>
              <div className="text-center my-4">
                <span className="inline-block px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
                  {date === 'Today'
                    ? 'Today'
                    : new Date(date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                </span>
              </div>
              {dateMessages.map((msg) => {
                const isOwnMessage = msg.senderRole === currentUserRole

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}
                  >
                    <div className={`max-w-[80%] ${isOwnMessage ? 'order-2' : 'order-1'} ${isOwnMessage ? 'ml-auto' : 'mr-auto'}`}>
                      <div
                        className={`rounded-2xl px-4 py-2 ${isOwnMessage
                            ? 'bg-blue-500 text-white rounded-br-none'
                            : 'bg-green-500 text-white rounded-bl-none'
                          }`}
                      >
                        {!isOwnMessage && msg.senderName && (
                          <p className="text-xs font-semibold mb-1">{msg.senderName}</p>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                        {msg.imageUrl && (
                          <img
                            src={msg.imageUrl}
                            alt="Shared"
                            className="mt-2 rounded-lg max-w-full"
                          />
                        )}
                      </div>
                      <div className={`text-xs ${isOwnMessage ? 'text-blue-100' : 'text-green-100'} mt-1 flex ${isOwnMessage ? 'flex-row-reverse justify-end' : 'justify-start'}`}>
                        <span>{formatTime(msg.timestamp)}</span>
                        {isOwnMessage && msg.read && (
                          <span className="ml-1">✓✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      { }
      <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
        <div className="flex gap-2 items-center">


          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              className={`w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none ${isKeyboardVisible ? 'z-10' : ''}`}
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
              onFocus={(e) => {
                // Ensure the input stays visible when keyboard appears
                setTimeout(() => {
                  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                  
                  // Additional scroll to ensure input is visible
                  e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 100);
              }}
            />
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="p-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full shadow-md hover:shadow-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </div>
      </div>
    </Card>
  )
}
