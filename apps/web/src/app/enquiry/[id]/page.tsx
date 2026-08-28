'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { io, type Socket } from 'socket.io-client';
import { Send } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';
import { getEnquiryMessages, type EnquiryMessage } from '@/lib/api';

type ConnectionState = 'connecting' | 'ready' | 'no-access' | 'error';

export default function EnquiryChatPage() {
  const params = useParams<{ id: string }>();
  const enquiryId = params.id;

  const [state, setState] = useState<ConnectionState>('connecting');
  const [messages, setMessages] = useState<EnquiryMessage[]>([]);
  const [draft, setDraft] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const listEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // sessionStorage isn't available during SSR, so this can only be read
    // post-mount — same pattern as admin/auth-context.tsx's token hydration.
    const accessToken = sessionStorage.getItem(`enquiry:${enquiryId}:accessToken`);
    if (!accessToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState('no-access');
      return;
    }

    let cancelled = false;

    getEnquiryMessages(enquiryId, accessToken)
      .then((history) => {
        if (!cancelled) setMessages(history);
      })
      .catch(() => undefined);

    const socket = io(`${API_BASE_URL}/enquiries`, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', { enquiryId, token: accessToken });
    });
    socket.on('joined', () => {
      if (!cancelled) setState('ready');
    });
    socket.on('message', (message: EnquiryMessage) => {
      if (cancelled) return;
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    });
    socket.on('error', () => {
      if (!cancelled) setState('error');
    });

    return () => {
      cancelled = true;
      socket.disconnect();
    };
  }, [enquiryId]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend(event: React.FormEvent): void {
    event.preventDefault();
    const body = draft.trim();
    if (!body || state !== 'ready') return;
    socketRef.current?.emit('message', { body });
    setDraft('');
  }

  if (state === 'no-access') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-foreground">
          Yeh chat is browser mein available nahi hai. Vehicle page se dobara &quot;Chat
          Now&quot; try karein.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-73px)] max-w-2xl flex-col px-4 py-6">
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-foreground">Agent Se Chat</h1>
        <p className="text-sm text-muted">
          {state === 'connecting' && 'Connect ho raha hai…'}
          {state === 'ready' && 'Hamara agent jald jawab dega.'}
          {state === 'error' && 'Connection mein dikkat aa rahi hai.'}
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl bg-primary-light/40 p-4 shadow-card">
        {messages.length === 0 && (
          <p className="pt-8 text-center text-sm text-muted">
            Abhi tak koi message nahi hai — apna sawaal bhejein.
          </p>
        )}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={listEndRef} />
      </div>

      <form onSubmit={handleSend} className="mt-4 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={state !== 'ready'}
          placeholder="Apna message likhein…"
          className="flex-1 rounded-full border border-line bg-background px-4 py-2.5 text-sm text-foreground shadow-card focus:border-primary focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={state !== 'ready' || draft.trim().length === 0}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-btn transition hover:bg-[#12703a] active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: EnquiryMessage }) {
  const isCustomer = message.senderType === 'customer';
  return (
    <div className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-card ${
          isCustomer ? 'bg-primary text-white' : 'bg-background text-foreground'
        }`}
      >
        {message.body}
      </div>
    </div>
  );
}
