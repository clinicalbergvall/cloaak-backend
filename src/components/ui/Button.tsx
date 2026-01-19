import React, { useState, useEffect, useRef } from 'react';

// Workaround for React import issues
const { forwardRef } = React as any;
import toast from "react-hot-toast";
import { loadUserSession, getStoredAuthToken } from "@/lib/storage";
import { Card } from "./Card";
import { authAPI, api } from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";

interface ButtonProps {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  children?: any;
  disabled?: boolean;
}
export const Button = forwardRef(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth,
      loading,
      className = "",
      children,
      disabled,
      ...props
    }: ButtonProps,
    ref: any,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 shadow-sm hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5";

    const variants = {
      primary:
        "bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:from-yellow-300 hover:to-yellow-400 shadow-lg hover:shadow-xl",
      secondary:
        "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 shadow-lg hover:shadow-xl",
      outline:
        "border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-lg hover:shadow-xl",
      ghost: "text-gray-600 hover:bg-gray-100 hover:shadow-md",
      destructive:
        "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl",
    };

    const sizes = {
      xs: "px-2 py-1 text-xs",
      sm: "px-3 py-2 text-xs",
      md: "px-4 py-2.5 text-sm",
      lg: "px-6 py-3 text-base",
    };
    return (
      <button
        ref={ref}
        className={`${baseStyles} ${(variants as any)[variant!]} ${(sizes as any)[size!]} ${fullWidth ? "w-full" : ""} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = "Button";


interface CarouselImage {
  id: number;
  title: string;
  description: string;
  image: string;
}

interface ImageCarouselProps {
  images: CarouselImage[];
  interval?: number; 
}

export const ImageCarousel = ({
  images,
  interval = 4000,
}: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prevIndex: number) => (prevIndex + 1) % images.length);
        setIsAnimating(false);
      }, 300); 
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval]);

  const currentImage = images[currentIndex];

  return (
    <div className="relative w-full h-64 overflow-hidden rounded-lg shadow-sm border border-gray-200">
      {}
      <div className="relative w-full h-full">
        {images.map((image, index) => (
          <div
            key={image.id}
            className={`absolute inset-0 transition-all duration-700 ease-in-out transform ${
              index === currentIndex
                ? "translate-x-0 opacity-100 scale-100"
                : index === (currentIndex - 1 + images.length) % images.length
                  ? "-translate-x-full opacity-0 scale-95"
                  : "translate-x-full opacity-0 scale-95"
            }`}
          >
            <img
              src={image.image}
              alt={image.title}
              className="w-full h-full object-cover"
              onError={(e: any) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target.parentElement!.style.background =
                  "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {}
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <h3 className="font-bold text-lg mb-1">{image.title}</h3>
              <p className="text-sm opacity-90">{image.description}</p>
            </div>
          </div>
        ))}
      </div>

      {}
      <div className="absolute bottom-4 right-4 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setIsAnimating(true);
              setTimeout(() => {
                setCurrentIndex(index);
                setIsAnimating(false);
              }, 300);
            }}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "bg-yellow-400 w-8"
                : "bg-white/60 hover:bg-white/80"
            }`}
          />
        ))}
      </div>

      {}
      <button
        onClick={() => {
          setIsAnimating(true);
          setTimeout(() => {
            setCurrentIndex(
              (prevIndex: number) => (prevIndex - 1 + images.length) % images.length,
            );
            setIsAnimating(false);
          }, 300);
        }}
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-lg transition-all shadow-sm border border-gray-200"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <button
        onClick={() => {
          setIsAnimating(true);
          setTimeout(() => {
            setCurrentIndex((prevIndex: number) => (prevIndex + 1) % images.length);
            setIsAnimating(false);
          }, 300);
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-lg transition-all shadow-sm border border-gray-200"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );
};


interface LoginData {
  identifier: string; 
  password: string;
}

interface RegisterData {
  name: string;
  phone: string;
  password: string;
  role?: "client" | "cleaner";
}

interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
  };
  errors?: Array<{ msg: string }>;
}

export const LoginForm = ({
  onAuthSuccess,
}: {
  onAuthSuccess: (user: Record<string, any>) => void;
}) => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [apiStatus, setApiStatus] = useState<{ ok: boolean; base: string } | null>(null);
  const [formData, setFormData] = useState<LoginData | RegisterData>({
    phone: "",
    password: "",
    name: "",
    role: "cleaner" as "client" | "cleaner",
  });

  const handleInputChange = (
    e: any,
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = isLogin
        ? await authAPI.login(
            (formData as LoginData).identifier,
            (formData as LoginData).password,
          )
        : await authAPI.register(formData);

      if (data.success && data.user) {
        
        localStorage.setItem(
          "cleancloak-user-session",
          JSON.stringify({
            userType: data.user.role as "client" | "cleaner" | "admin",
            name: data.user.name,
            phone: data.user.phone,
            lastSignedIn: new Date().toISOString(),
          }),
        );

        toast.success(data.message);
        onAuthSuccess(data.user);
      } else {
        if (data.errors) {
          data.errors.forEach((error: any) => toast.error(error.msg));
        } else {
          toast.error(data.message || "Authentication failed");
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Network error. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    api.get('/health', { signal: controller.signal })
      .then((r) => setApiStatus({ ok: r.ok, base: API_BASE_URL }))
      .catch(() => setApiStatus({ ok: false, base: API_BASE_URL }))
      .finally(() => clearTimeout(timeout));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isLogin ? "Sign in to your account" : "Create your account"}
          </h2>
        </div>
        <Card className="p-8">
          {apiStatus && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                apiStatus.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
              }`}
            >
              API {apiStatus.ok ? "reachable" : "unreachable"}
            </div>
          )}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={isLogin ? "" : (formData as RegisterData).name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </>
            )}

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                {isLogin ? "Phone Number" : "Phone Number (Kenyan)"}
              </label>
              <input
                id="phone"
                name={isLogin ? "identifier" : "phone"}
                type="tel"
                pattern={isLogin ? undefined : "0[17]\\d{8}"}
                placeholder={
                  isLogin
                    ? "07XXXXXXXX or 01XXXXXXXX"
                    : "07XXXXXXXX or 01XXXXXXXX"
                }
                required
                value={
                  isLogin
                    ? (formData as LoginData).identifier || ""
                    : (formData as RegisterData).phone || ""
                }
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <Button
                type="submit"
                disabled={loading}
                loading={loading}
                className="w-full"
              >
                {isLogin ? "Sign In" : "Sign Up"}
              </Button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-600 hover:text-blue-500 text-sm"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};


interface ChatMessage {
  id: string;
  sender?: string;
  senderId: string;
  senderName?: string;
  content?: string;
  message?: string;
  timestamp: string;
}

interface ChatRoom {
  id: string;
  bookingId: string;
  client: {
    id: string;
    name: string;
  };
  cleaner: {
    id: string;
    name: string;
  };
  messages: ChatMessage[];
  createdAt: string;
}

interface ChatProps {
  bookingId: string;
  currentUserId: string;
  currentUserRole: "client" | "cleaner";
}

export const ChatComponent = ({
  bookingId,
  currentUserId,
  currentUserRole,
}: ChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchChatRoom();
    
    
    const interval = setInterval(fetchChatRoom, 5000);
    
    return () => clearInterval(interval);
  }, [bookingId]);

  
  useEffect(() => {
    if (!chatRoom) return;
    
    try {
      
      const OVERRIDE_API_URL = localStorage.getItem('apiOverride') || ''
      const VITE_API_URL = import.meta.env.VITE_API_URL
      const base = OVERRIDE_API_URL || VITE_API_URL || window.location.origin
      const apiUrl = base.endsWith('/api') ? base : `${base}/api`
      const url = `${apiUrl}/events`
      const es = new EventSource(url, { withCredentials: true })

      
      es.addEventListener('message', (evt: MessageEvent) => {
        try {
          const payload = JSON.parse(evt.data)
          const { type, message: newMessage } = payload || {}
          
          
          if (type === 'newMessage' && newMessage && newMessage.bookingId === bookingId && 
              !messages.some((msg: ChatMessage) => msg.id === newMessage.id)) {
            setMessages((prev: ChatMessage[]) => [...prev, newMessage])
          }
        } catch (e) {
          console.error('Error processing SSE message:', e)
        }
      })

      
      es.addEventListener('newMessage', (evt: MessageEvent) => {
        try {
          const payload = JSON.parse(evt.data)
          const { message: newMessage } = payload || {}
          
          
          if (newMessage && newMessage.bookingId === bookingId && 
              !messages.some((msg: ChatMessage) => msg.id === newMessage.id)) {
            setMessages((prev: ChatMessage[]) => [...prev, newMessage])
          }
        } catch (e) {
          console.error('Error processing SSE message:', e)
        }
      })

      es.addEventListener('error', (evt: MessageEvent) => {
        console.error('SSE connection error:', evt);
      })

      return () => {
        es.close()
      }
    } catch (e) {
      console.error('Failed to setup SSE for chat:', e)
    }
  }, [bookingId, chatRoom, messages]);

  const fetchChatRoom = async () => {
    try {
      const response = await api.get(`/chat/${bookingId}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setChatRoom(data.chatRoom);
          
          if (data.chatRoom.messages && data.chatRoom.messages.length !== messages.length) {
            setMessages(data.chatRoom.messages || []);
          }
        }
      } else if (response.status === 404) {
        
        await createChatRoom();
      } else {
        const errorData = await response.json().catch(() => ({}));
        
        if (!chatRoom) {
          toast.error(errorData.message || "Failed to load chat");
        }
      }
    } catch (error) {
      console.error("Error fetching chat room:", error);
      
      if (!chatRoom) {
        toast.error("Failed to load chat. Please try again.");
      }
    } finally {
      if (!chatRoom) {
        setLoading(false);
      }
    }
  };

  const createChatRoom = async () => {
    try {
      const response = await api.post('/chat', { bookingId });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setChatRoom(data.chatRoom);
          setMessages([]);
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to create chat room");
      }
    } catch (error) {
      console.error("Error creating chat room:", error);
      toast.error("Failed to create chat room");
    }
  };

  const sendMessage = async (e: any) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatRoom) return;

    try {
      const response = await api.post(`/chat/${bookingId}/message`, { 
        message: newMessage.trim()
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          
          if (data.message) {
            setMessages((prev: ChatMessage[]) => [...prev, data.message]);
          }
          setNewMessage("");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    
    const isToday = date.getDate() === now.getDate() &&
                  date.getMonth() === now.getMonth() &&
                  date.getFullYear() === now.getFullYear();
    
    if (isToday) {
      
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m`;
      if (diffHours < 24) return `${diffHours}h`;
    }
    
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card className="h-[500px] flex flex-col">
      <div className="p-4 border-b flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-semibold">
            {(currentUserRole === "client"
              ? chatRoom?.cleaner?.name?.charAt(0)
              : chatRoom?.client?.name?.charAt(0)) || '?'}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {currentUserRole === "client"
                ? chatRoom?.cleaner?.name
                : chatRoom?.client?.name}
            </h3>
          </div>
        </div>

      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-lg font-medium mb-1">No messages yet</p>
            <p className="text-sm">Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((message: ChatMessage) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === currentUserId ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl ${
                  message.senderId === currentUserId
                    ? "bg-yellow-500 text-white rounded-br-none"
                    : "bg-white text-gray-900 rounded-bl-none shadow-sm"
                }`}
              >
                {message.senderName && message.senderId !== currentUserId && (
                  <div className="text-xs font-semibold mb-1">{message.senderName}</div>
                )}
                <div className="whitespace-pre-wrap break-words">{message.content || message.message}</div>
                <div className={`text-xs mt-1 ${message.senderId === currentUserId ? "text-yellow-100" : "text-gray-500"}`}>
                  {formatTime(message.timestamp)}
                  {message.senderId === currentUserId && (
                    <span className="ml-1">✓✓</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 border-t bg-white">
        <div className="flex gap-2 items-center">
          <button 
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
            title="Attach"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              placeholder="Type a message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          <Button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full shadow-md hover:shadow-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </div>
      </form>
    </Card>
  );
};