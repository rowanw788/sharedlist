import { useEffect, useRef, useState } from 'react';
import { Note, supabase } from '@/lib/supabase';
import { ArrowLeft, Trash2, Check } from 'lucide-react';

interface Props {
  note: Note;
  updatedBy: string;
  onBack: () => void;
  onDeleted: () => void;
}

function formatFullTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NoteEditor({ note, updatedBy, onBack, onDeleted }: Props) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const titleRef = useRef(note.title);
  const contentRef = useRef(note.content);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from realtime updates — when the note prop changes due to remote edits
  useEffect(() => {
    if (titleRef.current !== note.title || contentRef.current !== note.content) {
      titleRef.current = note.title;
      contentRef.current = note.content;
      setTitle(note.title);
      setContent(note.content);
      setSavedAt(note.updated_at);
    }
  }, [note.updated_at, note.title, note.content]);

  const doSave = async () => {
    const newTitle = titleRef.current;
    const newContent = contentRef.current;
    setSaving(true);
    const { data, error } = await supabase
      .from('notes')
      .update({
        title: newTitle,
        content: newContent,
        updated_by: updatedBy,
      })
      .eq('id', note.id)
      .select()
      .single();

    setSaving(false);
    if (!error && data) {
      setSavedAt(data.updated_at);
    }
  };

  const scheduleSave = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave(), 1000);
  };

  const handleTitleChange = (val: string) => {
    titleRef.current = val;
    setTitle(val);
    scheduleSave();
  };

  const handleContentChange = (val: string) => {
    contentRef.current = val;
    setContent(val);
    scheduleSave();
  };

  const handleBlur = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    doSave();
  };

  const handleDelete = async () => {
    const { error } = await supabase.from('notes').delete().eq('id', note.id);
    if (!error) {
      onDeleted();
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-[#f0f0f2]">
        <div className="flex items-center justify-between px-3 py-2.5">
          <button
            onClick={onBack}
            className="flex items-center text-[#ffd54f] active:opacity-60 transition-opacity px-2 py-1 -ml-1"
          >
            <ArrowLeft size={22} />
            <span className="text-[17px] font-medium ml-0.5">Notes</span>
          </button>
          <div className="flex items-center gap-2">
            {saving ? (
              <span className="text-xs text-[#86868b]">Saving…</span>
            ) : savedAt ? (
              <span className="flex items-center text-xs text-[#34c759]">
                <Check size={13} className="mr-0.5" />
                Saved
              </span>
            ) : null}
            <button
              onClick={() => setShowDelete(true)}
              className="w-8 h-8 flex items-center justify-center text-[#ff3b30] active:opacity-60 transition-opacity"
              aria-label="Delete note"
            >
              <Trash2 size={19} />
            </button>
          </div>
        </div>
        {/* Meta line */}
        <div className="px-5 pb-2 text-xs text-[#86868b]">
          {note.updated_by !== 'unknown' ? `Last edited by ${note.updated_by}` : 'Last edited'} ·{' '}
          {formatFullTime(savedAt || note.updated_at)}
        </div>
      </header>

      {/* Editor */}
      <div className="flex-1 flex flex-col px-5 py-4">
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder="Title"
          className="text-2xl font-bold text-[#1c1c1e] placeholder:text-[#c7c7cc] outline-none bg-transparent mb-3"
        />
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          onBlur={handleBlur}
          placeholder="Start writing…"
          className="flex-1 text-[17px] leading-relaxed text-[#1c1c1e] placeholder:text-[#c7c7cc] outline-none bg-transparent resize-none min-h-[40vh]"
        />
      </div>

      {/* Delete confirmation */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setShowDelete(false)}>
          <div
            className="w-full max-w-sm bg-[#f5f5f7] rounded-2xl mx-4 mb-8 overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 text-center">
              <p className="text-base font-semibold text-[#1c1c1e]">Delete this note?</p>
              <p className="text-sm text-[#86868b] mt-1">This action cannot be undone.</p>
            </div>
            <button
              onClick={handleDelete}
              className="w-full py-3.5 text-[#ff3b30] font-semibold text-base border-t border-[#e5e5ea] active:bg-[#e5e5ea] transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setShowDelete(false)}
              className="w-full py-3.5 text-[#1c1c1e] font-medium text-base border-t border-[#e5e5ea] active:bg-[#e5e5ea] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
