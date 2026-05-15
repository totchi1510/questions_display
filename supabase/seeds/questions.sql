-- Seed thought-provoking questions for demo / first-load.
-- Pre-approved (published=true, archived=false), so they appear on /board and /.
-- Idempotent: fixed UUIDs + ON CONFLICT DO NOTHING.

-- Remove demo seeds that used to live in this file but were trimmed.
delete from public.questions
where id in (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000008',
  '00000000-0000-0000-0000-000000000009',
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000013',
  '00000000-0000-0000-0000-000000000014',
  '00000000-0000-0000-0000-000000000015',
  '00000000-0000-0000-0000-000000000016',
  '00000000-0000-0000-0000-000000000018'
);

insert into public.questions (id, content, created_at, published, archived, likes_count) values
  ('00000000-0000-0000-0000-000000000001', 'なぜ私たちは問いを立てるのだろう', now() - interval '1 hour', true, false, 3),
  ('00000000-0000-0000-0000-000000000003', 'AI と共に生きる時代、人間にしかできないことは何だろう', now() - interval '3 hour', true, false, 8),
  ('00000000-0000-0000-0000-000000000007', '幸せって何だろう', now() - interval '14 hour', true, false, 9),
  ('00000000-0000-0000-0000-000000000010', '「分からない」と言える勇気は、どこから湧いてくるのか', now() - interval '1 day', true, false, 7),
  ('00000000-0000-0000-0000-000000000012', '立ち止まる時間は、本当に「無駄」なのだろうか', now() - interval '1 day 10 hour', true, false, 4),
  ('00000000-0000-0000-0000-000000000017', 'なぜ人は、答えのない問いを愛するのか', now() - interval '4 day', true, false, 5)
on conflict (id) do nothing;
