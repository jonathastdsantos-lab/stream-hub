import { useState, useEffect, useRef, useCallback } from 'react';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  content: string;
  timestamp: Date;
  platform: string;
  type: 'message' | 'donation' | 'subscription' | 'follow' | 'system';
  metadata?: Record<string, unknown>;
  isModerator?: boolean;
  isHighlighted?: boolean;
}

interface ChatState {
  messages: ChatMessage[];
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  bannedUsers: Set<string>;
  moderators: Set<string>;
  slowMode: number;
  followerOnlyMode: boolean;
}

interface ChatOptions {
  streamId: string;
  maxMessages?: number;
  slowMode?: number;
}

export function useChat(options: ChatOptions) {
  const { streamId, maxMessages = 200, slowMode = 0 } = options;

  const [state, setState] = useState<ChatState>({
    messages: [],
    isConnected: false,
    isConnecting: false,
    error: null,
    bannedUsers: new Set(),
    moderators: new Set(),
    slowMode,
    followerOnlyMode: false,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    const token = localStorage.getItem('auth_token');
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'}/chat/${streamId}?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttemptsRef.current = 0;
      setState(prev => ({ ...prev, isConnected: true, isConnecting: false, error: null }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message' || data.type === 'donation' ||
            data.type === 'subscription' || data.type === 'follow' ||
            data.type === 'system') {
          const msg: ChatMessage = { ...data, timestamp: new Date(data.timestamp) };
          setState(prev => ({
            ...prev,
            messages: [...prev.messages.slice(-(maxMessages - 1)), msg],
          }));
        } else if (data.type === 'ban') {
          setState(prev => {
            const banned = new Set(prev.bannedUsers);
            banned.add(data.userId);
            return {
              ...prev,
              bannedUsers: banned,
              messages: prev.messages.filter(m => m.userId !== data.userId),
            };
          });
        } else if (data.type === 'settings') {
          setState(prev => ({ ...prev, ...data.settings }));
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      setState(prev => ({ ...prev, isConnected: false, isConnecting: false }));
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 30000);
        reconnectAttemptsRef.current++;
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      } else {
        setState(prev => ({ ...prev, error: 'Unable to connect to chat' }));
      }
    };

    ws.onerror = () => {
      setState(prev => ({ ...prev, error: 'Chat connection error' }));
    };
  }, [streamId, maxMessages]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    reconnectAttemptsRef.current = MAX_RECONNECT_ATTEMPTS;
    wsRef.current?.close();
    setState(prev => ({ ...prev, isConnected: false }));
  }, []);

  const sendMessage = useCallback((content: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return false;
    wsRef.current.send(JSON.stringify({ type: 'message', content }));
    return true;
  }, []);

  const banUser = useCallback((userId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'ban', userId }));
    setState(prev => {
      const banned = new Set(prev.bannedUsers);
      banned.add(userId);
      return {
        ...prev,
        bannedUsers: banned,
        messages: prev.messages.filter(m => m.userId !== userId),
      };
    });
  }, []);

  const unbanUser = useCallback((userId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'unban', userId }));
    setState(prev => {
      const banned = new Set(prev.bannedUsers);
      banned.delete(userId);
      return { ...prev, bannedUsers: banned };
    });
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'delete', messageId }));
    setState(prev => ({
      ...prev,
      messages: prev.messages.filter(m => m.id !== messageId),
    }));
  }, []);

  const clearChat = useCallback(() => {
    setState(prev => ({ ...prev, messages: [] }));
  }, []);

  const setSlowMode = useCallback((seconds: number) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'settings', settings: { slowMode: seconds } }));
    setState(prev => ({ ...prev, slowMode: seconds }));
  }, []);

  useEffect(() => {
    if (streamId) connect();
    return () => disconnect();
  }, [streamId, connect, disconnect]);

  const donations = state.messages.filter(m => m.type === 'donation');
  const recentDonations = donations.slice(-10);

  return {
    ...state,
    sendMessage,
    banUser,
    unbanUser,
    deleteMessage,
    clearChat,
    setSlowMode,
    connect,
    disconnect,
    recentDonations,
    messageCount: state.messages.length,
  };
}
