import 'server-only';

export async function postSlackModeration(message: string, extra?: Record<string, unknown>) {
  try {
    const url = process.env.SLACK_MODERATION_WEBHOOK_URL;
    if (!url) return; // non-blocking when not configured

    const blocks: Array<Record<string, unknown>> = [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*${message}*` },
      },
    ];
    if (extra) {
      blocks.push({ type: 'section', text: { type: 'mrkdwn', text: '```' + JSON.stringify(extra, null, 2) + '```' } });
    }
    const body: Record<string, unknown> = {
      text: message,
      blocks,
    };

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      // ignore response
    });
  } catch {
    // swallow errors to avoid user-facing failures
  }
}
