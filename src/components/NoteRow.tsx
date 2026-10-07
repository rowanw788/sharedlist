import { Note } from '@/lib/supabase';

interface Props {
  note: Note;
  onClick: () => void;
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function NoteRow({ note, onClick }: Props) {
  const title = note.title || 'New Note';
  const preview = note.content ? note.content.split('\n')[0].slice(0, 80) : 'No additional text';

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-5 py-3.5 active:bg-[#e5e5ea] transition-colors border-b border-[#f0f0f2]"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[17px] font-medium text-[#1c1c1e] truncate flex-1">{title}</h3>
        <span className="text-xs text-[#86868b] shrink-0">{formatRelativeTime(note.updated_at)}</span>
      </div>
      <p className="text-sm text-[#86868b] truncate mt-0.5">{preview}</p>
    </button>
  );
}
