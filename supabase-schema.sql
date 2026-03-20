-- ─── Run this in your Supabase SQL editor ────────────────────────────────────

create table if not exists quizzes (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  title       text not null,
  topic       text not null,
  description text,
  difficulty  text not null check (difficulty in ('easy','medium','hard')),
  questions   jsonb not null default '[]',
  is_public   boolean default false,
  share_code  text unique,
  time_limit  integer default 0,
  tags        text[] default '{}',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists quiz_attempts (
  id              uuid primary key default gen_random_uuid(),
  quiz_id         uuid references quizzes(id) on delete set null,
  user_id         text not null,
  mode            text not null check (mode in ('learning','test')),
  answers         jsonb not null default '[]',
  score           integer not null default 0,
  total_questions integer not null default 0,
  percentage      numeric(5,2) default 0,
  time_taken      integer default 0,
  started_at      timestamptz default now(),
  completed_at    timestamptz default now()
);

create table if not exists feedback (
  id           uuid primary key default gen_random_uuid(),
  attempt_id   uuid references quiz_attempts(id) on delete set null,
  quiz_id      uuid references quizzes(id) on delete set null,
  rating       integer check (rating between 1 and 5),
  comment      text,
  would_retake boolean default false,
  created_at   timestamptz default now()
);

-- Indexes
create index if not exists idx_quizzes_user    on quizzes(user_id);
create index if not exists idx_quizzes_share   on quizzes(share_code);
create index if not exists idx_attempts_user   on quiz_attempts(user_id);
create index if not exists idx_attempts_quiz   on quiz_attempts(quiz_id);

-- RLS
alter table quizzes        enable row level security;
alter table quiz_attempts  enable row level security;
alter table feedback       enable row level security;

-- Policies (Clerk JWT exposes sub as user_id)
create policy "public quizzes readable" on quizzes
  for select using (is_public = true);

create policy "users own quizzes" on quizzes
  for all using (
    user_id = coalesce(
      current_setting('request.jwt.claims',true)::json->>'sub',
      auth.uid()::text
    )
  );

create policy "users own attempts" on quiz_attempts
  for all using (
    user_id = coalesce(
      current_setting('request.jwt.claims',true)::json->>'sub',
      auth.uid()::text
    )
  );

create policy "anyone insert feedback" on feedback
  for insert with check (true);
