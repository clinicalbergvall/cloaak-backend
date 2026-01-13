declare global {
  // Define JSX namespace to support JSX elements
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
  
  interface Window {
    Capacitor?: any;
    toast?: any;
  }
}

// Capacitor HTTP plugin type definitions
interface CapacitorHttpRequest {
  url: string;
  method: string;
  headers?: any;
  data?: any;
}

interface CapacitorHttpResponse {
  status: { code: number; text: string } | number;
  headers?: any;
  data: any;
}

interface CapacitorHttpPlugin {
  request(options: CapacitorHttpRequest): Promise<CapacitorHttpResponse>;
}

declare module '@capacitor/http' {
  export const Http: CapacitorHttpPlugin;
}


// Add type declarations for Capacitor plugins
declare module '@capacitor/app' {
  export interface AppInfo {
    name: string;
    bundleId: string;
    version: string;
    build: string;
  }
  
  export interface AppState {
    isActive: boolean;
  }
  
  export interface URLOpenListenerEvent {
    url: string;
  }
  
  export interface AppLaunchUrl {
    url?: string;
  }
  
  export class App {
    static exitApp(): void;
    static getInfo(): Promise<AppInfo>;
    static getState(): Promise<AppState>;
    static getLaunchUrl(): Promise<AppLaunchUrl>;
    static minimizeApp(): Promise<void>;
    static addListener(eventName: 'appStateChange', listenerFunc: (state: AppState) => void): Promise<void>;
    static addListener(eventName: 'appUrlOpen', listenerFunc: (event: URLOpenListenerEvent) => void): Promise<void>;
    static addListener(eventName: 'backButton', listenerFunc: () => void): Promise<void>;
    static addListener(eventName: string, listenerFunc: (...args: any[]) => void): Promise<void>;
    static removeAllListeners(): Promise<void>;
  }
}

declare module '@capacitor/splash-screen' {
  export class SplashScreen {
    static hide(): Promise<void>;
    static show(options?: {
      autoHide?: boolean;
      fadeInDuration?: number;
      fadeOutDuration?: number;
      showDuration?: number;
      launchShowDuration?: number;
    }): Promise<void>;
    static showOnLaunch(): void;
  }
}

declare module '@capacitor/core' {
  export interface PluginRegistry {
    // Define plugin registry interface
  }
  
  export class Capacitor {
    static isNativePlatform(): boolean;
    static isWeb(): boolean;
    static getPlatform(): string;
    static platform: string;
  }
}

// Add proper React Router DOM type definitions
declare module 'react-router-dom' {
  export interface Location {
    pathname: string;
    search: string;
    hash: string;
    state?: any;
  }

  export interface NavigateFunction {
    (to: string, options?: { replace?: boolean; state?: any }): void;
    (delta: number): void;
  }

  export function useNavigate(): NavigateFunction;
  export function useLocation(): Location;
  export function useLocation<T = any>(): Location & { state: T | undefined };
  export function BrowserRouter(props: any): any;
  export function Routes(props: any): any;
  export function Route(props: any): any;
  export function Navigate(props: any): any;
  export function Outlet(props: any): any;
  export function Link(props: any): any;
  export function NavLink(props: any): any;
  export function useParams<T = {[k: string]: string}>(): T;
  export function useSearchParams(): [URLSearchParams, (newSearchParams: URLSearchParams) => void];
}

declare module '@capacitor/geolocation' {
  export interface Position {
    coords: {
      latitude: number;
      longitude: number;
      accuracy: number;
      altitude?: number;
      altitudeAccuracy?: number;
      heading?: number;
      speed?: number;
    };
    timestamp: number;
  }
  
  export interface PermissionStatus {
    location: 'granted' | 'denied' | 'prompt';
  }
  
  export class Geolocation {
    static requestPermissions(): Promise<PermissionStatus>;
    static getCurrentPosition(): Promise<Position>;
    static watchPosition(callback: (position: Position) => void, options?: any): string;
    static clearWatch(options: { id: string }): Promise<void>;
  }
}

declare module '@capacitor/push-notifications' {
  export interface PushNotificationSchema {
    title?: string;
    subtitle?: string;
    body?: string;
    data?: any;
    finish: (token: string) => void;
  }
  
  export interface Token {
    value: string;
  }
  
  export interface ActionPerformed {
    actionId: string;
    inputValue?: string;
    notification: PushNotificationSchema;
  }
  
  export class PushNotifications {
    static requestPermissions(): Promise<{ granted: boolean }>;
    static register(): Promise<void>;
    static unregister(): Promise<void>;
    static getDeliveredNotifications(): Promise<any[]>;
    static removeDeliveredNotifications(notifications: any[]): Promise<void>;
    static removeAllDeliveredNotifications(): Promise<void>;
    static addListener(eventName: 'registration', listenerFunc: (token: Token) => void): Promise<void>;
    static addListener(eventName: 'error', listenerFunc: (error: any) => void): Promise<void>;
    static addListener(eventName: 'pushNotificationReceived', listenerFunc: (notification: PushNotificationSchema) => void): Promise<void>;
    static addListener(eventName: 'pushNotificationActionPerformed', listenerFunc: (ActionPerformed) => void): Promise<void>;
    static removeAllListeners(): Promise<void>;
  }
}

declare module './lib/pushNotifications' {
  export class PushNotificationService {
    static requestPermission(): Promise<boolean>;
    static registerForNotifications(): Promise<void>;
    static sendTokenToBackend(token: string): Promise<void>;
    static getDeliveredNotifications(): Promise<any[]>;
    static removeDeliveredNotifications(notifications: string[]): Promise<void>;
    static removeAllDeliveredNotifications(): Promise<void>;
    static handleForegroundNotification(notification: any): void;
    static handleNotificationTap(notification: any): void;
  }
}

interface Window {
  Capacitor?: any;
  toast?: any;
}

// Capacitor HTTP plugin type definitions
interface CapacitorHttpRequest {
  url: string;
  method: string;
  headers?: any;
  data?: any;
}

interface CapacitorHttpResponse {
  status: { code: number; text: string } | number;
  headers?: any;
  data: any;
}

interface CapacitorHttpPlugin {
  request(options: CapacitorHttpRequest): Promise<CapacitorHttpResponse>;
}

declare module '@capacitor/http' {
  export const Http: CapacitorHttpPlugin;
}