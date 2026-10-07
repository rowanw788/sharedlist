import { Note } from '@/lib/supabase';
import NoteRow from './NoteRow';
import { Plus, SquarePen } from 'lucide-react';

interface Props {
  notes: Note[];
  onSelect: (note: Note) => void;
  onCreate: () => void;
}

export default function NoteList({ notes, onSelect, onCreate }: Props) {
  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col">
      <header className="sticky top-0 z-10 bg-[#f5f5f7]/80 backdrop-blur-xl border-b border-[#e5e5ea]">
        <div className="flex items-center justify-between px-5 py-3">
          <h1 className="text-2xl font-bold text-[#1c1c1e]">Notes</h1>
          <button
            onClick={onCreate}
            className="w-9 h-9 rounded-full bg-[#ffd54f] flex items-center justify-center active:scale-90 transition-transform shadow-sm"
            aria-label="New note"
          >
            <Plus size={20} className="text-[#5d4a00]" />
          </button>
        </div>
        <p className="px-5 pb-2 text-xs text-[#86868b]">
          {notes.length} {notes.length === 1 ? 'note' : 'notes'} · Shared with both of you
        </p>
      </header>

      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-4 shadow-sm">
              <SquarePen size={28} className="text-[#c7c7cc]" />
            </div>
            <p className="text-[#86868b] text-base">No notes yet</p>
            <p className="text-[#c7c7cc] text-sm mt-1">Tap the + button to create your first note</p>
          </div>
        ) : (
          <div className="bg-white mx-3 mt-3 rounded-2xl overflow-hidden shadow-sm">
            {notes.map((note) => (
              <NoteRow key={note.id} note={note} onClick={() => onSelect(note)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
