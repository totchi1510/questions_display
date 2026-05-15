-- Seed thought-provoking questions for demo / first-load.
-- Pre-approved (published=true, archived=false), so they appear on /board and /.
-- Idempotent: skip insert if any seeded question already exists.

do $$
begin
  if exists (select 1 from public.questions where content like '__seed__%') then
    raise notice 'seed questions already present, skipping';
    return;
  end if;

  insert into public.questions (content, created_at, published, archived, likes_count) values
    ('__seed__1__ なぜ私たちは問いを立てるのだろう', now() - interval '1 hour', true, false, 3),
    ('__seed__2__ 失敗を恐れずに挑戦するために、まず手放すべきものは何か', now() - interval '2 hour', true, false, 5),
    ('__seed__3__ AI と共に生きる時代、人間にしかできないことは何だろう', now() - interval '3 hour', true, false, 8),
    ('__seed__4__ 学びを止めないために、日々できることは何か', now() - interval '5 hour', true, false, 2),
    ('__seed__5__ 自分を変えるきっかけは、いつ、どこにあるのか', now() - interval '8 hour', true, false, 4),
    ('__seed__6__ 多様性を尊重するということは、理解することなのか、それとも理解できないまま受け入れることなのか', now() - interval '12 hour', true, false, 6),
    ('__seed__7__ 幸せって何だろう', now() - interval '14 hour', true, false, 9),
    ('__seed__8__ 対話から生まれるものは何か、そして対話を止めるものは何か', now() - interval '18 hour', true, false, 3),
    ('__seed__9__ 自分の「正しさ」を疑う瞬間は、どんなときか', now() - interval '20 hour', true, false, 1),
    ('__seed__10__ 「分からない」と言える勇気は、どこから湧いてくるのか', now() - interval '1 day', true, false, 7),
    ('__seed__11__ 効率を追い求める先に、私たちは何を失うのだろう', now() - interval '1 day 4 hour', true, false, 5),
    ('__seed__12__ 立ち止まる時間は、本当に「無駄」なのだろうか', now() - interval '1 day 10 hour', true, false, 4),
    ('__seed__13__ 誰かと深く対話するために必要なことは何か', now() - interval '2 day', true, false, 6),
    ('__seed__14__ AI が論文を書ける時代に、自分の言葉で考えることの価値はどこにあるのか。情報処理の速度では到底敵わない相手と並走しながら、人間にしか紡げない問いの形を探したい', now() - interval '2 day 5 hour', true, false, 11),
    ('__seed__15__ 偶然の出会いから、人生が変わることはあるのか', now() - interval '3 day', true, false, 2),
    ('__seed__16__ 一番大切な問いは、まだ言葉になっていないのかもしれない', now() - interval '3 day 8 hour', true, false, 8),
    ('__seed__17__ なぜ人は、答えのない問いを愛するのか', now() - interval '4 day', true, false, 5),
    ('__seed__18__ 学校で学んだ「正解」を一つずつ手放したとき、自分の中に残るものは何だろう', now() - interval '5 day', true, false, 3);
end $$;
