import BoardSignage from '@/components/BoardSignage';
import {
  currentMonthLabelJST,
  fetchCurrentMonthQuestions,
  fetchQuestionLinks,
} from '@/lib/questions';

export const dynamic = 'force-dynamic';

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  );
}

export default async function FreeBoardPage() {
  const { items, error } = await fetchCurrentMonthQuestions(60, 'free');
  const links = await fetchQuestionLinks(items.map((i) => i.id));
  const monthLabel = currentMonthLabelJST();
  const askUrl = `${siteUrl()}/ask`;

  return (
    <BoardSignage
      items={items}
      links={links}
      monthLabel={monthLabel}
      askUrl={askUrl}
      error={error}
    />
  );
}
