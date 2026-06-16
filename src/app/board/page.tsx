import BoardSignage from '@/components/BoardSignage';
import {
  currentMonthLabelJST,
  fetchCurrentMonthQuestions,
  fetchQuestionLinks,
} from '@/lib/questions';
import { fetchActiveTheme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  );
}

export default async function BoardPage() {
  const theme = await fetchActiveTheme();
  const { items, error } = await fetchCurrentMonthQuestions(
    60,
    theme ? theme.id : 'free'
  );
  const links = await fetchQuestionLinks(items.map((i) => i.id));
  const monthLabel = currentMonthLabelJST();
  const askUrl = `${siteUrl()}/ask`;

  return (
    <BoardSignage
      items={items}
      links={links}
      monthLabel={monthLabel}
      askUrl={askUrl}
      eyebrow={theme ? '今月のテーマ' : undefined}
      title={theme ? theme.label : 'テーマなし'}
      description={theme?.description ?? undefined}
      error={error}
    />
  );
}
