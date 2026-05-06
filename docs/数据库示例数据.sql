-- 数据库示例数据（按当前 Supabase 实际表结构适配）
-- 执行前建议先阅读 docs/数据库设计说明.md
-- 本文件仅覆盖当前已存在的 8 张业务表：
-- users / courses / student_courses / library_info / faq /
-- regulations / service_process / chat_records

begin;

create extension if not exists pgcrypto;

-- 1) users
insert into public.users (
  id,
  student_id,
  name,
  role,
  department,
  email,
  created_at,
  college,
  major,
  grade,
  class_name,
  updated_at
)
select
  'c87fb180-95e9-4a25-845b-293da9158d93'::uuid,
  '20240001',
  '张三',
  'student',
  '软件工程系',
  '20240001@campus.edu.cn',
  now(),
  '计算机学院',
  '软件工程',
  '2024级',
  '软件工程 1 班',
  now()
where not exists (
  select 1 from public.users where student_id = '20240001'
);

insert into public.users (
  id,
  student_id,
  name,
  role,
  department,
  email,
  created_at,
  college,
  major,
  grade,
  class_name,
  updated_at
)
select
  'dce0f99a-543a-4e6b-a2d4-0a8ca0be9da1'::uuid,
  '20240002',
  '李四',
  'student',
  '人工智能系',
  '20240002@campus.edu.cn',
  now(),
  '计算机学院',
  '人工智能',
  '2024级',
  '人工智能 1 班',
  now()
where not exists (
  select 1 from public.users where student_id = '20240002'
);

insert into public.users (
  id,
  student_id,
  name,
  role,
  department,
  email,
  created_at,
  college,
  major,
  grade,
  class_name,
  updated_at
)
select
  '1a9b14f6-95a2-4355-b5f4-df59f1c88f0d'::uuid,
  '20240003',
  '王五',
  'student',
  '通信工程系',
  '20240003@campus.edu.cn',
  now(),
  '信息工程学院',
  '通信工程',
  '2024级',
  '通信工程 2 班',
  now()
where not exists (
  select 1 from public.users where student_id = '20240003'
);

insert into public.users (
  id,
  student_id,
  name,
  role,
  department,
  email,
  created_at,
  college,
  major,
  grade,
  class_name,
  updated_at
)
select
  '8ff28e4c-1c6e-4700-99d6-a5a35ccfa7e9'::uuid,
  '20230001',
  '赵敏',
  'student',
  '英语系',
  '20230001@campus.edu.cn',
  now(),
  '外国语学院',
  '英语',
  '2023级',
  '英语 1 班',
  now()
where not exists (
  select 1 from public.users where student_id = '20230001'
);

-- 2) courses
insert into public.courses (
  id,
  course_name,
  teacher_name,
  classroom,
  week_day,
  start_time,
  end_time,
  weeks,
  department,
  created_at,
  course_code,
  teacher,
  college,
  major,
  grade,
  weekday,
  location,
  building,
  week_range,
  semester,
  academic_year,
  is_public,
  updated_at
)
select
  'e1e36e8d-d5fa-4ff6-bc8f-6f1ccca64862'::uuid,
  '数据结构',
  '王老师',
  'A101',
  '星期一',
  '08:00',
  '09:40',
  '1-16周',
  '软件工程系',
  now(),
  'CS101',
  '王老师',
  '计算机学院',
  '软件工程',
  '2024级',
  1,
  'A101',
  'A 教学楼',
  '1-16周',
  '2024-2025-2',
  '2024-2025',
  true,
  now()
where not exists (
  select 1 from public.courses where course_code = 'CS101'
);

insert into public.courses (
  id,
  course_name,
  teacher_name,
  classroom,
  week_day,
  start_time,
  end_time,
  weeks,
  department,
  created_at,
  course_code,
  teacher,
  college,
  major,
  grade,
  weekday,
  location,
  building,
  week_range,
  semester,
  academic_year,
  is_public,
  updated_at
)
select
  '7b8e4cbe-6fe5-468c-9321-ce9ef9d68e4c'::uuid,
  '操作系统',
  '李老师',
  'B203',
  '星期三',
  '10:00',
  '11:40',
  '1-16周',
  '软件工程系',
  now(),
  'CS102',
  '李老师',
  '计算机学院',
  '软件工程',
  '2024级',
  3,
  'B203',
  'B 教学楼',
  '1-16周',
  '2024-2025-2',
  '2024-2025',
  true,
  now()
where not exists (
  select 1 from public.courses where course_code = 'CS102'
);

insert into public.courses (
  id,
  course_name,
  teacher_name,
  classroom,
  week_day,
  start_time,
  end_time,
  weeks,
  department,
  created_at,
  course_code,
  teacher,
  college,
  major,
  grade,
  weekday,
  location,
  building,
  week_range,
  semester,
  academic_year,
  is_public,
  updated_at
)
select
  '3e5328bb-a3df-4367-bd3e-00e202719c7d'::uuid,
  '机器学习导论',
  '周老师',
  'C305',
  '星期二',
  '14:00',
  '15:40',
  '1-16周',
  '人工智能系',
  now(),
  'AI201',
  '周老师',
  '计算机学院',
  '人工智能',
  '2024级',
  2,
  'C305',
  'C 教学楼',
  '1-16周',
  '2024-2025-2',
  '2024-2025',
  true,
  now()
where not exists (
  select 1 from public.courses where course_code = 'AI201'
);

insert into public.courses (
  id,
  course_name,
  teacher_name,
  classroom,
  week_day,
  start_time,
  end_time,
  weeks,
  department,
  created_at,
  course_code,
  teacher,
  college,
  major,
  grade,
  weekday,
  location,
  building,
  week_range,
  semester,
  academic_year,
  is_public,
  updated_at
)
select
  '14392aef-f4db-4279-9ee8-96f0d94af89f'::uuid,
  '大学物理',
  '陈老师',
  'D202',
  '星期四',
  '08:00',
  '09:40',
  '1-16周',
  '通信工程系',
  now(),
  'EE110',
  '陈老师',
  '信息工程学院',
  '通信工程',
  '2024级',
  4,
  'D202',
  'D 教学楼',
  '1-16周',
  '2024-2025-2',
  '2024-2025',
  true,
  now()
where not exists (
  select 1 from public.courses where course_code = 'EE110'
);

insert into public.courses (
  id,
  course_name,
  teacher_name,
  classroom,
  week_day,
  start_time,
  end_time,
  weeks,
  department,
  created_at,
  course_code,
  teacher,
  college,
  major,
  grade,
  weekday,
  location,
  building,
  week_range,
  semester,
  academic_year,
  is_public,
  updated_at
)
select
  '28dc3a9d-b833-4786-bc4f-a0185d6f1f91'::uuid,
  '大学英语',
  '刘老师',
  'E110',
  '星期五',
  '16:00',
  '17:40',
  '1-16周',
  '英语系',
  now(),
  'GE001',
  '刘老师',
  '公共课',
  null,
  '2024级',
  5,
  'E110',
  'E 教学楼',
  '1-16周',
  '2024-2025-2',
  '2024-2025',
  true,
  now()
where not exists (
  select 1 from public.courses where course_code = 'GE001'
);

-- 3) student_courses
insert into public.student_courses (
  id,
  user_id,
  course_id,
  semester,
  created_at,
  student_id
)
select
  gen_random_uuid(),
  u.id,
  c.id,
  '2024-2025-2',
  now(),
  u.student_id
from public.users u
join public.courses c on c.course_code in ('CS101', 'CS102', 'GE001')
where u.student_id = '20240001'
  and not exists (
    select 1
    from public.student_courses sc
    where sc.student_id = u.student_id
      and sc.course_id = c.id
      and sc.semester = '2024-2025-2'
  );

insert into public.student_courses (
  id,
  user_id,
  course_id,
  semester,
  created_at,
  student_id
)
select
  gen_random_uuid(),
  u.id,
  c.id,
  '2024-2025-2',
  now(),
  u.student_id
from public.users u
join public.courses c on c.course_code in ('AI201', 'CS101', 'GE001')
where u.student_id = '20240002'
  and not exists (
    select 1
    from public.student_courses sc
    where sc.student_id = u.student_id
      and sc.course_id = c.id
      and sc.semester = '2024-2025-2'
  );

insert into public.student_courses (
  id,
  user_id,
  course_id,
  semester,
  created_at,
  student_id
)
select
  gen_random_uuid(),
  u.id,
  c.id,
  '2024-2025-2',
  now(),
  u.student_id
from public.users u
join public.courses c on c.course_code in ('EE110', 'GE001')
where u.student_id = '20240003'
  and not exists (
    select 1
    from public.student_courses sc
    where sc.student_id = u.student_id
      and sc.course_id = c.id
      and sc.semester = '2024-2025-2'
  );

-- 4) library_info
insert into public.library_info (
  id,
  service_name,
  open_time,
  close_time,
  location,
  description,
  created_at,
  library_name,
  date,
  remark,
  updated_at
)
select
  gen_random_uuid(),
  '开放时间',
  '08:00',
  '22:00',
  '主校区图书馆一层',
  '总馆工作日正常开放。',
  now(),
  '总馆',
  '2026-04-27',
  '正常开放',
  now()
where not exists (
  select 1
  from public.library_info
  where library_name = '总馆'
    and date = '2026-04-27'
    and service_name = '开放时间'
);

insert into public.library_info (
  id,
  service_name,
  open_time,
  close_time,
  location,
  description,
  created_at,
  library_name,
  date,
  remark,
  updated_at
)
select
  gen_random_uuid(),
  '开放时间',
  '08:00',
  '22:00',
  '主校区图书馆一层',
  '总馆工作日正常开放。',
  now(),
  '总馆',
  '2026-04-28',
  '正常开放',
  now()
where not exists (
  select 1
  from public.library_info
  where library_name = '总馆'
    and date = '2026-04-28'
    and service_name = '开放时间'
);

insert into public.library_info (
  id,
  service_name,
  open_time,
  close_time,
  location,
  description,
  created_at,
  library_name,
  date,
  remark,
  updated_at
)
select
  gen_random_uuid(),
  '开放时间',
  '09:00',
  '21:00',
  '北区图书馆',
  '北区分馆一层研讨室需要预约。',
  now(),
  '北区分馆',
  '2026-04-27',
  '一层研讨室需预约',
  now()
where not exists (
  select 1
  from public.library_info
  where library_name = '北区分馆'
    and date = '2026-04-27'
    and service_name = '开放时间'
);

insert into public.library_info (
  id,
  service_name,
  open_time,
  close_time,
  location,
  description,
  created_at,
  library_name,
  date,
  remark,
  updated_at
)
select
  gen_random_uuid(),
  '开放时间',
  '08:30',
  '20:30',
  '信息楼二层',
  '电子阅览室晚间需刷校园卡进入。',
  now(),
  '电子阅览室',
  '2026-04-27',
  '晚间 18:00 后刷校园卡进入',
  now()
where not exists (
  select 1
  from public.library_info
  where library_name = '电子阅览室'
    and date = '2026-04-27'
    and service_name = '开放时间'
);

-- 5) faq
insert into public.faq (
  id,
  question,
  answer,
  category,
  created_at,
  tags,
  updated_at
)
select
  gen_random_uuid(),
  '校园卡丢失后怎么办？',
  '请先在校园卡服务中心小程序中挂失，再前往一卡通服务窗口补办新卡。',
  '校园卡',
  now(),
  array['校园卡', '挂失', '补办'],
  now()
where not exists (
  select 1 from public.faq where question = '校园卡丢失后怎么办？'
);

insert into public.faq (
  id,
  question,
  answer,
  category,
  created_at,
  tags,
  updated_at
)
select
  gen_random_uuid(),
  '图书馆借阅超期会怎样？',
  '超期后系统会暂停新的借阅权限，请尽快归还图书并关注图书馆通知。',
  '图书馆',
  now(),
  array['图书馆', '借阅', '超期'],
  now()
where not exists (
  select 1 from public.faq where question = '图书馆借阅超期会怎样？'
);

insert into public.faq (
  id,
  question,
  answer,
  category,
  created_at,
  tags,
  updated_at
)
select
  gen_random_uuid(),
  '缓考申请一般什么时候提交？',
  '通常需要在考试前通过教务系统提交缓考申请，并上传证明材料，具体以学院通知为准。',
  '教务',
  now(),
  array['缓考', '教务', '考试'],
  now()
where not exists (
  select 1 from public.faq where question = '缓考申请一般什么时候提交？'
);

insert into public.faq (
  id,
  question,
  answer,
  category,
  created_at,
  tags,
  updated_at
)
select
  gen_random_uuid(),
  '空教室可以自习吗？',
  '未被课程、考试或活动占用的普通教室通常可以临时自习，但请遵守楼栋管理规定。',
  '教室',
  now(),
  array['空教室', '自习'],
  now()
where not exists (
  select 1 from public.faq where question = '空教室可以自习吗？'
);

-- 6) regulations
insert into public.regulations (
  id,
  category,
  title,
  content,
  effective_date,
  department,
  created_at,
  source_department,
  updated_at
)
select
  gen_random_uuid(),
  '考试管理',
  '本科生考试管理办法',
  '学生应按规定时间参加考试。因疾病、突发事件等特殊原因无法参加考试的，可按流程申请缓考。',
  '2026-02-24',
  '教务处',
  now(),
  '教务处',
  now()
where not exists (
  select 1 from public.regulations where title = '本科生考试管理办法'
);

insert into public.regulations (
  id,
  category,
  title,
  content,
  effective_date,
  department,
  created_at,
  source_department,
  updated_at
)
select
  gen_random_uuid(),
  '图书馆',
  '图书馆文明使用规范',
  '馆内应保持安静，不得占座，不得在阅览区食用气味明显的食物。',
  '2026-02-24',
  '图书馆',
  now(),
  '图书馆',
  now()
where not exists (
  select 1 from public.regulations where title = '图书馆文明使用规范'
);

insert into public.regulations (
  id,
  category,
  title,
  content,
  effective_date,
  department,
  created_at,
  source_department,
  updated_at
)
select
  gen_random_uuid(),
  '教学楼管理',
  '教学楼自习管理规定',
  '空闲教室可供临时自习使用，但不得影响后续课程安排，不得擅自移动多媒体设备。',
  '2026-02-24',
  '后勤处',
  now(),
  '后勤处',
  now()
where not exists (
  select 1 from public.regulations where title = '教学楼自习管理规定'
);

-- 7) service_process
insert into public.service_process (
  id,
  service_type,
  process_steps,
  required_materials,
  office_location,
  office_hours,
  contact_phone,
  created_at,
  title,
  process_type,
  description,
  steps,
  source_department,
  updated_at
)
select
  gen_random_uuid(),
  '考试事务',
  '1. 登录教务系统；2. 选择缓考申请；3. 上传材料；4. 等待审核。',
  '医院证明、情况说明、学院审批材料',
  '行政楼 201 教务服务窗口',
  '工作日 08:30-11:30 / 14:00-17:00',
  '010-12345678',
  now(),
  '缓考申请',
  '教务流程',
  '用于学生因特殊原因无法按时参加考试时提交申请。',
  jsonb_build_array(
    jsonb_build_object('step', 1, 'title', '登录教务系统', 'detail', '进入考试事务或缓考申请模块'),
    jsonb_build_object('step', 2, 'title', '填写申请信息', 'detail', '选择课程并说明原因'),
    jsonb_build_object('step', 3, 'title', '上传证明材料', 'detail', '如医院证明、学院说明等'),
    jsonb_build_object('step', 4, 'title', '等待学院审核', 'detail', '审核结果以系统通知为准')
  ),
  '教务处',
  now()
where not exists (
  select 1 from public.service_process where title = '缓考申请'
);

insert into public.service_process (
  id,
  service_type,
  process_steps,
  required_materials,
  office_location,
  office_hours,
  contact_phone,
  created_at,
  title,
  process_type,
  description,
  steps,
  source_department,
  updated_at
)
select
  gen_random_uuid(),
  '后勤报修',
  '1. 进入报修系统；2. 描述故障；3. 提交工单；4. 查看进度。',
  '宿舍信息、故障描述、现场照片',
  '后勤服务大厅',
  '工作日 09:00-17:00',
  '010-87654321',
  now(),
  '宿舍报修',
  '后勤流程',
  '用于报修宿舍水电、门锁、家具等问题。',
  jsonb_build_array(
    jsonb_build_object('step', 1, 'title', '进入报修系统', 'detail', '选择宿舍楼栋与房间'),
    jsonb_build_object('step', 2, 'title', '描述故障情况', 'detail', '尽量填写具体现象并上传照片'),
    jsonb_build_object('step', 3, 'title', '提交工单', 'detail', '系统自动分配给维修人员'),
    jsonb_build_object('step', 4, 'title', '查看处理状态', 'detail', '可在系统中查看进度')
  ),
  '后勤处',
  now()
where not exists (
  select 1 from public.service_process where title = '宿舍报修'
);

insert into public.service_process (
  id,
  service_type,
  process_steps,
  required_materials,
  office_location,
  office_hours,
  contact_phone,
  created_at,
  title,
  process_type,
  description,
  steps,
  source_department,
  updated_at
)
select
  gen_random_uuid(),
  '校园卡服务',
  '1. 挂失原卡；2. 提交补办；3. 缴费；4. 领取新卡。',
  '本人学生证或身份证',
  '信息化服务中心',
  '工作日 08:30-17:30',
  '010-11223344',
  now(),
  '校园卡补办',
  '校园卡服务',
  '用于校园卡丢失、损坏后的补卡办理。',
  jsonb_build_array(
    jsonb_build_object('step', 1, 'title', '先挂失', 'detail', '通过小程序或服务窗口挂失原卡'),
    jsonb_build_object('step', 2, 'title', '提交补办申请', 'detail', '登记身份信息'),
    jsonb_build_object('step', 3, 'title', '缴纳工本费', 'detail', '按窗口提示完成支付'),
    jsonb_build_object('step', 4, 'title', '领取新卡', 'detail', '按通知时间领取')
  ),
  '信息化办公室',
  now()
where not exists (
  select 1 from public.service_process where title = '校园卡补办'
);

-- 8) chat_records
insert into public.chat_records (
  id,
  user_id,
  session_id,
  question,
  answer,
  intent_type,
  created_at,
  thread_id,
  student_id,
  role,
  content,
  thought_log,
  query_log,
  tool_meta
)
select
  gen_random_uuid(),
  u.id,
  'session-demo-001',
  '帮我查一下这周计算机学院的公共课安排',
  '我先按你的学院身份查询本周公共课安排，再整理课程、时间和地点给你。',
  'course_query',
  now(),
  'f767fe75-f4c3-4409-8c97-3e191fa43f6d'::uuid,
  '20240001',
  'assistant',
  '我先按你的学院身份查询本周公共课安排，再整理课程、时间和地点给你。',
  '意图路由 -> 课程查询 -> 结果整理',
  E'课程名称: 数据结构\n授课教师: 王老师\n地点: A101',
  jsonb_build_object('tool', 'get_rows', 'status', 'success')
from public.users u
where u.student_id = '20240001'
  and not exists (
    select 1
    from public.chat_records cr
    where cr.session_id = 'session-demo-001'
      and cr.student_id = '20240001'
  );

insert into public.chat_records (
  id,
  user_id,
  session_id,
  question,
  answer,
  intent_type,
  created_at,
  thread_id,
  student_id,
  role,
  content,
  thought_log,
  query_log,
  tool_meta
)
select
  gen_random_uuid(),
  u.id,
  'session-demo-002',
  '图书馆今晚几点闭馆？',
  '总馆今天 22:00 闭馆，北区分馆 21:00 闭馆。',
  'library_query',
  now(),
  '43635982-cfa0-4696-a2b4-bdbf42fa0ded'::uuid,
  '20240002',
  'assistant',
  '总馆今天 22:00 闭馆，北区分馆 21:00 闭馆。',
  '意图路由 -> 图书馆信息查询 -> 结果整理',
  E'图书馆: 总馆\n关闭时间: 22:00',
  jsonb_build_object('tool', 'library_lookup', 'status', 'success')
from public.users u
where u.student_id = '20240002'
  and not exists (
    select 1
    from public.chat_records cr
    where cr.session_id = 'session-demo-002'
      and cr.student_id = '20240002'
  );

commit;
