'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '@/lib/auth-context';
import {
  ApiError,
  getAdminEnquiry,
  getAdminEnquiryMessages,
  logEnquiryCall,
  updateEnquiryStatus,
} from '@/lib/api';
import { API_BASE_URL } from '@/config/api';
import type { AdminEnquiry, CallOutcome, EnquiryMessage, EnquiryStatus } from '@/types/enquiry';

// Mirrors EnquiryStatusService's transition table on the API exactly — kept
// here just to only *offer* valid next steps; the API is the real authority.
const ALLOWED_TRANSITIONS: Record<EnquiryStatus, EnquiryStatus[]> = {
  open: ['contacted', 'closed_lost'],
  contacted: ['negotiating', 'closed_lost'],
  negotiating: ['closed_won', 'closed_lost'],
  closed_won: [],
  closed_lost: [],
};

const CALL_OUTCOMES: CallOutcome[] = [
  'connected',
  'no_answer',
  'busy',
  'wrong_number',
  'scheduled_callback',
];

const STATUS_PILL: Record<EnquiryStatus, string> = {
  open: 'bg-primary-light text-primary',
  contacted: 'bg-gold/15 text-gold',
  negotiating: 'bg-blue-100 text-blue-600',
  closed_won: 'bg-foreground/10 text-foreground',
  closed_lost: 'bg-line/60 text-muted',
};

export default function EnquiryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, accessToken, isLoading: isAuthLoading } = useAuth();

  const [enquiry, setEnquiry] = useState<AdminEnquiry | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      setEnquiry(await getAdminEnquiry(accessToken, params.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load this enquiry.');
    }
  }, [accessToken, params.id]);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/login');
    }
  }, [isAuthLoading, user, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (isAuthLoading || !user || !accessToken) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {error && (
        <p className="rounded-xl bg-primary-light px-4 py-3 text-sm text-foreground">{error}</p>
      )}

      {!enquiry ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <>
          <Summary enquiry={enquiry} />
          <StatusActions accessToken={accessToken} enquiry={enquiry} onChanged={load} />
          {enquiry.channel === 'chat' && (
            <ChatPanel accessToken={accessToken} enquiryId={enquiry.id} />
          )}
          <CallLogPanel accessToken={accessToken} enquiry={enquiry} onLogged={load} />
        </>
      )}
    </div>
  );
}

function Summary({ enquiry }: { enquiry: AdminEnquiry }) {
  return (
    <div className="rounded-2xl bg-background p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="font-semibold text-foreground">{enquiry.vehicle.title}</h1>
          <p className="text-sm text-muted">
            {enquiry.customer.name ?? 'Unknown'} &middot; {enquiry.customer.phone} &middot;{' '}
            {enquiry.channel}
          </p>
          <p className="text-sm text-muted">
            Agent: {enquiry.agent?.name ?? enquiry.agent?.email ?? 'Unassigned'}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_PILL[enquiry.status]}`}
        >
          {enquiry.status.replace('_', ' ')}
        </span>
      </div>
      {enquiry.message && (
        <p className="mt-3 border-t border-line pt-3 text-sm text-foreground">
          &quot;{enquiry.message}&quot;
        </p>
      )}
    </div>
  );
}

function StatusActions({
  accessToken,
  enquiry,
  onChanged,
}: {
  accessToken: string;
  enquiry: AdminEnquiry;
  onChanged: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextStatuses = ALLOWED_TRANSITIONS[enquiry.status];

  if (nextStatuses.length === 0) {
    return null;
  }

  async function moveTo(status: EnquiryStatus): Promise<void> {
    setIsSubmitting(true);
    setError(null);
    try {
      await updateEnquiryStatus(accessToken, enquiry.id, status);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update status.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-foreground">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {nextStatuses.map((status) => (
          <button
            key={status}
            onClick={() => void moveTo(status)}
            disabled={isSubmitting}
            className="rounded-full bg-background px-4 py-2 text-sm font-medium text-foreground shadow-card transition hover:shadow-card-hover disabled:opacity-60"
          >
            Mark {status.replace('_', ' ')}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatPanel({ accessToken, enquiryId }: { accessToken: string; enquiryId: string }) {
  const [messages, setMessages] = useState<EnquiryMessage[]>([]);
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState('');
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let cancelled = false;

    getAdminEnquiryMessages(accessToken, enquiryId)
      .then((history) => {
        if (!cancelled) setMessages(history);
      })
      .catch(() => undefined);

    const socket = io(`${API_BASE_URL}/enquiries`, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => socket.emit('join', { enquiryId, token: accessToken }));
    socket.on('joined', () => {
      if (!cancelled) setReady(true);
    });
    socket.on('message', (message: EnquiryMessage) => {
      if (cancelled) return;
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    });

    return () => {
      cancelled = true;
      socket.disconnect();
    };
  }, [accessToken, enquiryId]);

  function handleSend(event: React.FormEvent): void {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !ready) return;
    socketRef.current?.emit('message', { body });
    setDraft('');
  }

  return (
    <div className="space-y-3 rounded-2xl bg-background p-5 shadow-card">
      <h2 className="text-sm font-semibold text-foreground">Chat</h2>
      <div className="max-h-72 space-y-2 overflow-y-auto">
        {messages.length === 0 && <p className="text-sm text-muted">No messages yet.</p>}
        {messages.map((message) => (
          <div key={message.id} className="text-sm">
            <span className="font-medium text-foreground">
              {message.senderType === 'customer' ? 'Customer' : 'Agent'}:
            </span>{' '}
            <span className="text-foreground">{message.body}</span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={!ready}
          placeholder="Type a reply…"
          className="w-full rounded-full border border-line px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!ready || draft.trim().length === 0}
          className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-btn transition hover:bg-[#12703a] disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function CallLogPanel({
  accessToken,
  enquiry,
  onLogged,
}: {
  accessToken: string;
  enquiry: AdminEnquiry;
  onLogged: () => void;
}) {
  const [outcome, setOutcome] = useState<CallOutcome>('connected');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await logEnquiryCall(accessToken, enquiry.id, outcome, notes.trim() || undefined);
      setNotes('');
      onLogged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to log the call.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl bg-background p-5 shadow-card">
      <h2 className="text-sm font-semibold text-foreground">Call Log</h2>

      {enquiry.callLogs.length > 0 && (
        <ul className="space-y-1 text-sm text-muted">
          {enquiry.callLogs.map((log) => (
            <li key={log.id}>
              {new Date(log.calledAt).toLocaleString('en-IN')} — {log.outcome.replace('_', ' ')}
              {log.notes ? `: ${log.notes}` : ''}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <select
          value={outcome}
          onChange={(e) => setOutcome(e.target.value as CallOutcome)}
          className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          {CALL_OUTCOMES.map((value) => (
            <option key={value} value={value}>
              {value.replace('_', ' ')}
            </option>
          ))}
        </select>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Notes (optional)"
          className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
        />
        {error && <p className="text-sm text-foreground">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-background px-4 py-2 text-sm font-medium text-foreground shadow-card transition hover:shadow-card-hover disabled:opacity-60"
        >
          {isSubmitting ? 'Saving…' : 'Log Call'}
        </button>
      </form>
    </div>
  );
}
