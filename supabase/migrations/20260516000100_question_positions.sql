-- Add 2D position (percentages 0-100) so visitors can place each question
-- anywhere on the bulletin-board canvas.

alter table public.questions
  add column if not exists position_x numeric(5,2),
  add column if not exists position_y numeric(5,2);

-- Backfill existing rows with random positions so they appear on the wall.
-- Keep within 10..90 so notes don't hug the canvas edges.
update public.questions
set
  position_x = round((random() * 80 + 10)::numeric, 2),
  position_y = round((random() * 80 + 10)::numeric, 2)
where position_x is null or position_y is null;

-- Mirror columns on archive_questions so monthly snapshots preserve placement.
alter table public.archive_questions
  add column if not exists position_x numeric(5,2),
  add column if not exists position_y numeric(5,2);

update public.archive_questions
set
  position_x = round((random() * 80 + 10)::numeric, 2),
  position_y = round((random() * 80 + 10)::numeric, 2)
where position_x is null or position_y is null;
