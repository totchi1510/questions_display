'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export type StaffSummary = {
  role: 'admin' | 'moderator' | 'viewer' | string;
};

type Props = {
  monthLabel: string;
  hasAuthor: boolean;
  staff: StaffSummary | null;
};

export default function SettingsMenu({ monthLabel, hasAuthor, staff }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="flex items-center gap-3 text-sm" ref={rootRef}>
      <span className="text-gray-500 hidden sm:inline">{monthLabel}</span>
      {staff && (
        <span className="rounded-full border border-black/40 px-3 py-1 bg-white/90 text-xs">
          {staff.role}
        </span>
      )}
      <div className="relative">
        <button
          type="button"
          aria-label="メニューを開く"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="w-9 h-9 rounded-full border border-black/20 bg-white/70 hover:bg-white flex items-center justify-center text-base transition"
        >
          ⚙
        </button>
        {open && (
          <div
            role="menu"
            className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-black/15 bg-white shadow-xl py-2 z-50"
          >
            <MenuLink href="/" onClick={() => setOpen(false)}>
              掲示板(個人ビュー)
            </MenuLink>
            <MenuLink href="/board" onClick={() => setOpen(false)}>
              掲示板(テーマ)
            </MenuLink>
            <MenuLink href="/board/free" onClick={() => setOpen(false)}>
              掲示板(テーマ外)
            </MenuLink>
            <MenuLink href="/graph" onClick={() => setOpen(false)}>
              問いのグラフ
            </MenuLink>
            <MenuLink href="/archive" onClick={() => setOpen(false)}>
              過去の問い
            </MenuLink>
            {hasAuthor && (
              <MenuLink href="/me" onClick={() => setOpen(false)}>
                あなたの問い
              </MenuLink>
            )}
            <MenuLink href="/ask" onClick={() => setOpen(false)}>
              問いを投稿する
            </MenuLink>
            {staff && (
              <>
                <div className="my-1 mx-3 border-t border-black/10" />
                <MenuLink href="/admin/review" onClick={() => setOpen(false)}>
                  review
                </MenuLink>
                <MenuLink href="/admin/logs" onClick={() => setOpen(false)}>
                  logs
                </MenuLink>
                <MenuLink href="/admin/themes" onClick={() => setOpen(false)}>
                  themes
                </MenuLink>
                {/* Plain <a> on purpose: avoid Next.js prefetching /logout,
                    which would silently run signOut() on hover. */}
                <a
                  href="/logout"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#FFFAEA]"
                >
                  logout
                </a>
              </>
            )}
            {!staff && (
              <>
                <div className="my-1 mx-3 border-t border-black/10" />
                <MenuLink href="/login" onClick={() => setOpen(false)}>
                  スタッフログイン
                </MenuLink>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MenuLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#FFFAEA]"
    >
      {children}
    </Link>
  );
}
