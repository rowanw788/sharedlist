import { useState } from 'react';
import { Lock } from 'lucide-react';
import { SHARED_PASSWORD } from '@/lib/supabase';

interface Props {
  onSuccess: () => void;
}

export default function PasswordGate({ onSuccess }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === SHARED_PASSWORD) {
      sessionStorage.setItem('memo-auth', '1');
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] px-6">
      <div className="w-full max-w-xs">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#ffd54f] flex items-center justify-center mb-4 shadow-sm">
            <Lock size={24} className="text-[#5d4a00]" />
          </div>
          <h1 className="text-xl font-semibold text-[#1c1c1e]">Shared Memo</h1>
          <p className="text-sm text-[#86868b] mt-1">Enter the shared password to continue</p>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            placeholder="Password"
            autoFocus
            className={`w-full px-4 py-3 rounded-xl bg-white border text-[#1c1c1e] placeholder:text-[#c7c7cc] text-base outline-none transition-colors ${
              error ? 'border-[#ff3b30]' : 'border-[#e5e5ea] focus:border-[#ffd54f]'
            }`}
          />
          {error && <p className="text-[#ff3b30] text-sm mt-2 text-center">Incorrect password</p>}
          <button
            type="submit"
            className="w-full mt-4 py-3 rounded-xl bg-[#1c1c1e] text-white font-medium text-base active:scale-[0.98] transition-transform"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}
