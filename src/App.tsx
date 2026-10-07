import { useCallback, useEffect, useRef, useState } from 'react';
import { Note, supabase } from '@/lib/supabase';
import PasswordGate from '@/components/PasswordGate';
import NoteList from '@/components/NoteList';
import NoteEditor from '@/components/NoteEditor';

type View = 'list' | 'editor';

const WHO_AM_I = (() => {
  const stored = localStorage.getItem('memo-who');
  if (stored) return stored;
  const name = prompt('What is your name? (so your partner knows who edited)') || 'Me';
  const clean = name.slice(0, 20).trim() || 'Me';
  localStorage.setItem('memo-who', clean);
  return clean;
})();

export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('memo-auth') === '1');
  const [view, setView] = useState<View>('list');
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const currentNoteRef = useRef<Note | null>(null);

  useEffect(() => {
    currentNoteRef.current = currentNote;
  }, [currentNote]);

  // Fetch all notes from Supabase
  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('fetchNotes error:', error.message);
      setFetchError(error.message);
    } else if (data) {
      setNotes(data as Note[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetchNotes();

    // Realtime subscription
    const channel = supabase
      .channel('notes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes' },
        (payload) => {
          const newNote = payload.new as Note;
          const oldNote = payload.old as Note;

          if (payload.eventType === 'INSERT') {
            setNotes((prev) => {
              if (prev.some((n) => n.id === newNote.id)) return prev;
              return [newNote, ...prev].sort(
                (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
              );
            });
            if (currentNoteRef.current?.id === newNote.id) {
              setCurrentNote(newNote);
            }
          } else if (payload.eventType === 'UPDATE') {
            setNotes((prev) =>
              prev
                .map((n) => (n.id === newNote.id ? newNote : n))
                .sort(
                  (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
                )
            );
            if (currentNoteRef.current?.id === newNote.id) {
              setCurrentNote(newNote);
            }
          } else if (payload.eventType === 'DELETE') {
            setNotes((prev) => prev.filter((n) => n.id !== oldNote.id));
            if (currentNoteRef.current?.id === oldNote.id) {
              setView('list');
              setCurrentNote(null);
            }
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [authed, fetchNotes]);

  const handleCreate = async () => {
    const { data, error } = await supabase
      .from('notes')
      .insert({
        title: '',
        content: '',
        updated_by: WHO_AM_I,
      })
      .select()
      .single();

    if (error) {
      console.error('handleCreate error:', error.message);
      return;
    }

    const newNote = data as Note;

    // Add to local state immediately — don't rely solely on Realtime
    setNotes((prev) => {
      if (prev.some((n) => n.id === newNote.id)) return prev;
      return [newNote, ...prev].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });

    setCurrentNote(newNote);
    setView('editor');
  };

  const handleSelect = (note: Note) => {
    setCurrentNote(note);
    setView('editor');
  };

  // Refetch when returning to the list so it reflects the latest server state
  const handleBack = () => {
    setView('list');
    setCurrentNote(null);
    fetchNotes();
  };

  const handleDeleted = () => {
    const deletedId = currentNoteRef.current?.id;
    setView('list');
    setCurrentNote(null);
    if (deletedId) {
      setNotes((prev) => prev.filter((n) => n.id !== deletedId));
    }
  };

  if (!authed) {
    return <PasswordGate onSuccess={() => setAuthed(true)} />;
  }

  if (view === 'editor' && currentNote) {
    return (
      <NoteEditor
        key={currentNote.id}
        note={currentNote}
        updatedBy={WHO_AM_I}
        onBack={handleBack}
        onDeleted={handleDeleted}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <p className="text-[#86868b] text-sm">Loading…</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center justify-center px-8 text-center">
        <p className="text-[#ff3b30] text-base font-medium">Could not load notes</p>
        <p className="text-[#86868b] text-sm mt-2">{fetchError}</p>
        <button
          onClick={fetchNotes}
          className="mt-4 px-5 py-2 rounded-full bg-[#ffd54f] text-[#5d4a00] font-medium active:scale-95 transition-transform"
        >
          Retry
        </button>
      </div>
    );
  }

  return <NoteList notes={notes} onSelect={handleSelect} onCreate={handleCreate} />;
}
