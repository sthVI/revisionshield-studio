
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  business_name text,
  default_currency text not null default 'USD',
  timezone text not null default 'UTC',
  default_revisions int not null default 2,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  client_name text not null,
  client_email text,
  project_type text not null default 'Web design',
  budget numeric(12,2),
  currency text not null default 'USD',
  due_date date,
  summary text,
  private_notes text,
  included_revisions int not null default 2 check (included_revisions >= 0 and included_revisions <= 100),
  status text not null default 'draft' check (status in ('draft','active','in_review','completed','on_hold')),
  share_token text not null unique default encode(gen_random_bytes(24),'hex'),
  share_enabled boolean not null default true,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.projects(user_id);
grant select, insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;
alter table public.projects enable row level security;
create policy "own projects" on public.projects for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.scope_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null,
  title text not null,
  in_scope boolean not null default true,
  done boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.scope_items(project_id);
grant select, insert, update, delete on public.scope_items to authenticated;
grant all on public.scope_items to service_role;
alter table public.scope_items enable row level security;
create policy "own scope" on public.scope_items for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.deliverables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending','submitted','approved','revision_requested')),
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by text,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.deliverables(project_id);
grant select, insert, update, delete on public.deliverables to authenticated;
grant all on public.deliverables to service_role;
alter table public.deliverables enable row level security;
create policy "own deliverables" on public.deliverables for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.revisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null,
  deliverable_id uuid references public.deliverables(id) on delete set null,
  note text not null,
  requested_by text not null default 'client',
  source text not null default 'freelancer' check (source in ('freelancer','client_portal')),
  created_at timestamptz not null default now()
);
create index on public.revisions(project_id);
grant select, insert, update, delete on public.revisions to authenticated;
grant all on public.revisions to service_role;
alter table public.revisions enable row level security;
create policy "own revisions" on public.revisions for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.change_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null,
  description text not null,
  classification text not null default 'unclassified' check (classification in ('unclassified','in_scope','out_of_scope')),
  extra_fee numeric(12,2),
  extra_days int,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.change_requests(project_id);
grant select, insert, update, delete on public.change_requests to authenticated;
grant all on public.change_requests to service_role;
alter table public.change_requests enable row level security;
create policy "own change requests" on public.change_requests for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null,
  actor text not null default 'you',
  message text not null,
  created_at timestamptz not null default now()
);
create index on public.activities(project_id, created_at desc);
grant select, insert, delete on public.activities to authenticated;
grant all on public.activities to service_role;
alter table public.activities enable row level security;
create policy "own activities select" on public.activities for select to authenticated using (auth.uid() = user_id);
create policy "own activities insert" on public.activities for insert to authenticated with check (auth.uid() = user_id);
create policy "own activities delete" on public.activities for delete to authenticated using (auth.uid() = user_id);

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger t_profiles before update on public.profiles for each row execute function public.touch_updated_at();
create trigger t_projects before update on public.projects for each row execute function public.touch_updated_at();
create trigger t_cr before update on public.change_requests for each row execute function public.touch_updated_at();

-- Sample project seeding (callable by the signed-in user for themselves)
create or replace function public.seed_sample_project() returns uuid
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); pid uuid; d1 uuid; d2 uuid; d3 uuid;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  insert into projects(user_id,name,client_name,client_email,project_type,budget,currency,due_date,summary,private_notes,included_revisions,status,is_sample)
  values (uid,'Brightleaf Bakery website refresh','Brightleaf Bakery (sample)','owner@example.com','Web design',2400,'USD',(current_date + 18),
    'Redesign of a 5-page marketing website for a local bakery: Home, Menu, About, Catering and Contact. Includes responsive layouts, copy integration of client-supplied text, and handover of the design files.',
    'Sample private note: client mentioned a possible online ordering add-on later — quote separately.',2,'active',true)
  returning id into pid;
  insert into scope_items(project_id,user_id,title,in_scope,done,position) values
    (pid,uid,'Design 5 page layouts (Home, Menu, About, Catering, Contact)',true,true,0),
    (pid,uid,'Responsive mobile + tablet versions',true,true,1),
    (pid,uid,'Integrate client-supplied copy and photos',true,false,2),
    (pid,uid,'Basic on-page SEO titles and descriptions',true,false,3),
    (pid,uid,'Online ordering / checkout',false,false,4),
    (pid,uid,'Copywriting or photography',false,false,5);
  insert into deliverables(project_id,user_id,title,description,status,submitted_at,approved_at,approved_by,position)
    values (pid,uid,'Homepage design concept','Desktop + mobile mockup of the homepage.','approved',now()-interval '9 days',now()-interval '7 days','Dana (client)',0) returning id into d1;
  insert into deliverables(project_id,user_id,title,description,status,submitted_at,position)
    values (pid,uid,'Inner page designs','Menu, About, Catering and Contact layouts.','revision_requested',now()-interval '3 days',1) returning id into d2;
  insert into deliverables(project_id,user_id,title,description,status,position)
    values (pid,uid,'Final handover pack','Exported assets and design source files.','pending',2) returning id into d3;
  insert into revisions(project_id,user_id,deliverable_id,note,requested_by,source,created_at) values
    (pid,uid,d1,'Swap hero photo for the sourdough image and make the CTA button larger.','Dana (client)','freelancer',now()-interval '8 days'),
    (pid,uid,d2,'Catering page: move the pricing table above the gallery.','Dana (client)','client_portal',now()-interval '2 days');
  insert into change_requests(project_id,user_id,description,classification,extra_fee,extra_days,status,decided_at,created_at) values
    (pid,uid,'Add a blog section with 3 starter posts','out_of_scope',450,4,'accepted',now()-interval '4 days',now()-interval '5 days'),
    (pid,uid,'Add online cake ordering with payments','out_of_scope',1200,10,'pending',null,now()-interval '1 day'),
    (pid,uid,'Change footer colour to match the new logo','in_scope',null,null,'accepted',now()-interval '6 days',now()-interval '6 days');
  insert into activities(project_id,user_id,actor,message,created_at) values
    (pid,uid,'you','Project created from client brief',now()-interval '12 days'),
    (pid,uid,'you','Submitted "Homepage design concept"',now()-interval '9 days'),
    (pid,uid,'client','Requested revision on "Homepage design concept"',now()-interval '8 days'),
    (pid,uid,'client','Approved "Homepage design concept"',now()-interval '7 days'),
    (pid,uid,'you','Change request accepted: Add a blog section (+450 USD, +4 days)',now()-interval '4 days'),
    (pid,uid,'you','Submitted "Inner page designs"',now()-interval '3 days'),
    (pid,uid,'client','Requested revision on "Inner page designs"',now()-interval '2 days'),
    (pid,uid,'you','Logged change request: Add online cake ordering',now()-interval '1 day');
  return pid;
end $$;
revoke all on function public.seed_sample_project() from public, anon;
grant execute on function public.seed_sample_project() to authenticated;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Public client share access (token-gated, safe fields only)
create or replace function public.get_shared_project(_token text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare p projects%rowtype; biz text;
begin
  if _token is null or length(_token) < 32 then return null; end if;
  select * into p from projects where share_token = _token and share_enabled = true;
  if not found then return null; end if;
  select business_name into biz from profiles where id = p.user_id;
  return jsonb_build_object(
    'project', jsonb_build_object('name',p.name,'client_name',p.client_name,'project_type',p.project_type,'due_date',p.due_date,'summary',p.summary,'included_revisions',p.included_revisions,'status',p.status,'is_sample',p.is_sample,'business_name',biz),
    'scope', coalesce((select jsonb_agg(jsonb_build_object('title',title,'in_scope',in_scope,'done',done) order by position) from scope_items where project_id=p.id),'[]'::jsonb),
    'deliverables', coalesce((select jsonb_agg(jsonb_build_object('id',id,'title',title,'description',description,'status',status,'approved_at',approved_at,'approved_by',approved_by) order by position) from deliverables where project_id=p.id),'[]'::jsonb),
    'revisions_used', (select count(*) from revisions where project_id=p.id),
    'revisions', coalesce((select jsonb_agg(jsonb_build_object('note',note,'requested_by',requested_by,'created_at',created_at,'deliverable_id',deliverable_id) order by created_at desc) from revisions where project_id=p.id),'[]'::jsonb)
  );
end $$;

create or replace function public.client_respond(_token text, _deliverable_id uuid, _action text, _name text, _comment text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p projects%rowtype; d deliverables%rowtype; nm text := left(trim(coalesce(_name,'')),80); cm text := left(trim(coalesce(_comment,'')),2000);
begin
  if _action not in ('approve','revise') then raise exception 'invalid action'; end if;
  if length(nm) < 1 then raise exception 'name required'; end if;
  select * into p from projects where share_token = _token and share_enabled = true;
  if not found then raise exception 'link not valid'; end if;
  select * into d from deliverables where id = _deliverable_id and project_id = p.id;
  if not found then raise exception 'deliverable not found'; end if;
  if d.status = 'approved' then raise exception 'already approved'; end if;
  if _action = 'approve' then
    update deliverables set status='approved', approved_at=now(), approved_by=nm where id=d.id;
    insert into activities(project_id,user_id,actor,message) values (p.id,p.user_id,'client', nm || ' approved "' || d.title || '"' || case when cm<>'' then ': ' || cm else '' end);
  else
    if length(cm) < 3 then raise exception 'please describe the revision'; end if;
    update deliverables set status='revision_requested' where id=d.id;
    insert into revisions(project_id,user_id,deliverable_id,note,requested_by,source) values (p.id,p.user_id,d.id,cm,nm,'client_portal');
    insert into activities(project_id,user_id,actor,message) values (p.id,p.user_id,'client', nm || ' requested a revision on "' || d.title || '"');
  end if;
  return jsonb_build_object('ok',true);
end $$;
revoke all on function public.get_shared_project(text) from public;
revoke all on function public.client_respond(text,uuid,text,text,text) from public;
grant execute on function public.get_shared_project(text) to anon, authenticated;
grant execute on function public.client_respond(text,uuid,text,text,text) to anon, authenticated;
