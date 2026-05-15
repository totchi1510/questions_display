-- Sticky note size: posters drag a resize handle to pick their own width,
-- and the display layer adds a 🤔-based growth bonus on top.

alter table public.questions
  add column if not exists width_px smallint not null default 240
    check (width_px >= 140 and width_px <= 360);

alter table public.archive_questions
  add column if not exists width_px smallint not null default 240
    check (width_px >= 140 and width_px <= 360);
