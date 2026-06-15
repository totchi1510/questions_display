import Link from 'next/link';

export type Tab = 'themed' | 'free';

type Props = {
  active: Tab;
  themedHref: string;
  freeHref: string;
  /** Label for the themed tab (defaults to "テーマ"). Pass the actual theme name for emphasis. */
  themedLabel?: string;
  /** Disable the themed tab when no theme is active. */
  themedDisabled?: boolean;
  /** Optional small caption shown under the tabs. */
  hint?: string;
};

export default function TabSwitch({
  active,
  themedHref,
  freeHref,
  themedLabel = 'テーマ',
  themedDisabled = false,
  hint,
}: Props) {
  const baseClass =
    'px-5 py-2 rounded-full text-sm tracking-wider transition border';
  const activeClass = 'bg-black text-white border-black';
  const inactiveClass = 'bg-white/70 text-gray-700 border-black/15 hover:bg-white';
  const disabledClass = 'bg-white/40 text-gray-400 border-black/10 cursor-not-allowed';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="inline-flex items-center gap-2">
        {themedDisabled ? (
          <span
            aria-disabled="true"
            className={`${baseClass} ${disabledClass}`}
            title="今月のテーマが設定されていません"
          >
            {themedLabel}
          </span>
        ) : (
          <Link
            href={themedHref}
            aria-current={active === 'themed' ? 'page' : undefined}
            className={`${baseClass} ${active === 'themed' ? activeClass : inactiveClass}`}
          >
            {themedLabel}
          </Link>
        )}
        <Link
          href={freeHref}
          aria-current={active === 'free' ? 'page' : undefined}
          className={`${baseClass} ${active === 'free' ? activeClass : inactiveClass}`}
        >
          テーマなし
        </Link>
      </div>
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}
