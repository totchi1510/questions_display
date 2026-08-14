-- 仮データ投入用 SQL（Supabase Dashboard → SQL Editor に貼り付けて Run）
--
-- 入るもの:
--   - アクティブテーマ「働くとは何か」（他のテーマは自動で非アクティブになる）
--   - テーマありの問い 8 件（/board と / の「テーマ」タブに出る）
--   - テーマなしの問い 8 件（/board/free と / の「テーマなし」タブに出る）
--   - 「影響を受けた問い」のリンク 7 本（掲示板の曲線と /graph のエッジになる）
--
-- 全て published=true で入れるので、承認レビューを通さず即座に掲示される。
-- 再実行可能: author_token='seed-dummy' の行を消してから入れ直すので、
-- 2 回流しても重複しない。リンクは questions の削除で CASCADE で消える。
--
-- 注意: created_at は now() なので「当月」の問いとして入る。
-- 掲示板は JST 当月分しか表示しないため、月をまたいだら流し直すこと。

begin;

-- 1) 既存のダミーを削除（再実行可能にするため）
delete from public.questions where author_token = 'seed-dummy';

-- 2) テーマを 1 つだけアクティブにする
update public.themes set active = false where active;

-- scripts/seed-dummy.js を先に流していた場合、同じラベルのテーマが別 UUID で
-- 残っている。どの問いからも参照されていないものだけ掃除する（重複表示防止）。
delete from public.themes
where label = '働くとは何か'
  and id <> 'cccccccc-0000-0000-0000-000000000001'
  and not exists (
    select 1 from public.questions q where q.theme_id = themes.id
  );

insert into public.themes (id, label, description, active) values
  ('cccccccc-0000-0000-0000-000000000001',
   '働くとは何か',
   '仕事・キャリア・生き方 —「働く」をめぐる問い。',
   true)
on conflict (id) do update
  set label       = excluded.label,
      description = excluded.description,
      active      = true;

-- 3) テーマありの問い（8 件）
insert into public.questions
  (id, content, published, archived, hold_count, position_x, position_y, width_px, theme_id, author_token)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'なぜ人は働くのだろう？',              true, false, 3, 16, 28, 260, 'cccccccc-0000-0000-0000-000000000001', 'seed-dummy'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'お金のために働くのは悪いこと？',        true, false, 0, 39, 22, 220, 'cccccccc-0000-0000-0000-000000000001', 'seed-dummy'),
  ('aaaaaaaa-0000-0000-0000-000000000003', '「やりがい」は誰のためにある？',        true, false, 7, 63, 30, 240, 'cccccccc-0000-0000-0000-000000000001', 'seed-dummy'),
  ('aaaaaaaa-0000-0000-0000-000000000004', '仕事と人生は分けられる？',            true, false, 1, 85, 25, 200, 'cccccccc-0000-0000-0000-000000000001', 'seed-dummy'),
  ('aaaaaaaa-0000-0000-0000-000000000005', '好きなことを仕事にすべき？',           true, false, 5, 20, 62, 300, 'cccccccc-0000-0000-0000-000000000001', 'seed-dummy'),
  ('aaaaaaaa-0000-0000-0000-000000000006', '働かない生き方はアリ？',              true, false, 2, 43, 70, 210, 'cccccccc-0000-0000-0000-000000000001', 'seed-dummy'),
  ('aaaaaaaa-0000-0000-0000-000000000007', 'AIに仕事を任せたら、人は何をする？',    true, false, 9, 66, 64, 280, 'cccccccc-0000-0000-0000-000000000001', 'seed-dummy'),
  ('aaaaaaaa-0000-0000-0000-000000000008', '定年のない時代に「引退」は必要？',      true, false, 0, 87, 72, 230, 'cccccccc-0000-0000-0000-000000000001', 'seed-dummy');

-- 4) テーマなしの問い（8 件） — theme_id は null
insert into public.questions
  (id, content, published, archived, hold_count, position_x, position_y, width_px, theme_id, author_token)
values
  ('bbbbbbbb-0000-0000-0000-000000000001', '時間って本当に存在する？',          true, false, 4, 18, 26, 240, null, 'seed-dummy'),
  ('bbbbbbbb-0000-0000-0000-000000000002', '友達は何人いれば十分？',            true, false, 1, 41, 32, 200, null, 'seed-dummy'),
  ('bbbbbbbb-0000-0000-0000-000000000003', '大人になるって、どういうこと？',      true, false, 6, 64, 24, 260, null, 'seed-dummy'),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'なぜ人は夢を見るんだろう？',         true, false, 0, 86, 33, 220, null, 'seed-dummy'),
  ('bbbbbbbb-0000-0000-0000-000000000005', '「正しさ」は一つだけ？',            true, false, 2, 17, 68, 210, null, 'seed-dummy'),
  ('bbbbbbbb-0000-0000-0000-000000000006', '自由とは何だろう？',               true, false, 8, 40, 74, 280, null, 'seed-dummy'),
  ('bbbbbbbb-0000-0000-0000-000000000007', '後悔しない選択なんてある？',         true, false, 1, 68, 70, 240, null, 'seed-dummy'),
  ('bbbbbbbb-0000-0000-0000-000000000008', '幸せはお金で買える？',              true, false, 3, 88, 63, 200, null, 'seed-dummy');

-- 5) 「影響を受けた問い」のリンク（from が to から影響を受けた、の向き）
insert into public.question_links (from_question_id, to_question_id) values
  ('aaaaaaaa-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000003'),
  ('aaaaaaaa-0000-0000-0000-000000000007', 'aaaaaaaa-0000-0000-0000-000000000006'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000001'),
  ('bbbbbbbb-0000-0000-0000-000000000006', 'bbbbbbbb-0000-0000-0000-000000000005'),
  ('bbbbbbbb-0000-0000-0000-000000000007', 'bbbbbbbb-0000-0000-0000-000000000006')
on conflict (from_question_id, to_question_id) do nothing;

commit;

-- 確認用
select
  coalesce(t.label, '(テーマなし)') as theme,
  count(*) as 件数
from public.questions q
left join public.themes t on t.id = q.theme_id
where q.author_token = 'seed-dummy'
group by 1;

-- 消したいときはこれだけ流す:
--   delete from public.questions where author_token = 'seed-dummy';
