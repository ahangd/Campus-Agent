# 评测埋点统计 SQL

本文档用于配合 `/api/dify/chat` 路由中的评测维度埋点。

当前版本会将以下指标写入 `chat_records.tool_meta`：

- `retrievalMs`
- `firstTokenAt`
- `finishedAt`
- `firstTokenMs`
- `responseMs`
- `sourceKinds`
- `localKnowledgeHitCount`

其中 `tool_meta.type = 'chat_eval_metrics'`，可用于筛选由评测埋点生成的记录。

## 1. 查看最近埋点记录

```sql
select
  created_at,
  student_id,
  thread_id,
  question,
  tool_meta ->> 'type' as meta_type,
  (tool_meta ->> 'retrievalMs')::numeric as retrieval_ms,
  (tool_meta ->> 'firstTokenMs')::numeric as first_token_ms,
  (tool_meta ->> 'responseMs')::numeric as response_ms,
  tool_meta -> 'sourceKinds' as source_kinds
from public.chat_records
where tool_meta ->> 'type' = 'chat_eval_metrics'
order by created_at desc
limit 50;
```

## 2. 统计平均响应时间

```sql
select
  round(avg((tool_meta ->> 'responseMs')::numeric), 2) as avg_response_ms,
  round(avg((tool_meta ->> 'firstTokenMs')::numeric), 2) as avg_first_token_ms,
  round(avg((tool_meta ->> 'retrievalMs')::numeric), 2) as avg_retrieval_ms,
  count(*) as sample_count
from public.chat_records
where tool_meta ->> 'type' = 'chat_eval_metrics';
```

## 3. 按来源类型统计

```sql
select
  coalesce(intent_type, 'unknown') as intent_type,
  count(*) as sample_count,
  round(avg((tool_meta ->> 'responseMs')::numeric), 2) as avg_response_ms,
  round(avg((tool_meta ->> 'firstTokenMs')::numeric), 2) as avg_first_token_ms,
  round(avg((tool_meta ->> 'retrievalMs')::numeric), 2) as avg_retrieval_ms
from public.chat_records
where tool_meta ->> 'type' = 'chat_eval_metrics'
group by coalesce(intent_type, 'unknown')
order by sample_count desc, intent_type asc;
```

## 4. 按日期统计

```sql
select
  date_trunc('day', created_at) as stat_day,
  count(*) as sample_count,
  round(avg((tool_meta ->> 'responseMs')::numeric), 2) as avg_response_ms,
  round(avg((tool_meta ->> 'firstTokenMs')::numeric), 2) as avg_first_token_ms,
  round(avg((tool_meta ->> 'retrievalMs')::numeric), 2) as avg_retrieval_ms
from public.chat_records
where tool_meta ->> 'type' = 'chat_eval_metrics'
group by date_trunc('day', created_at)
order by stat_day desc;
```

## 5. 查看命中知识条数分布

```sql
select
  coalesce((tool_meta ->> 'localKnowledgeHitCount')::int, 0) as local_knowledge_hit_count,
  count(*) as sample_count
from public.chat_records
where tool_meta ->> 'type' = 'chat_eval_metrics'
group by coalesce((tool_meta ->> 'localKnowledgeHitCount')::int, 0)
order by local_knowledge_hit_count asc;
```

## 6. 如需提升 SQL 统计性能

如果后续评测记录明显增多，可以考虑为 `tool_meta` 中的高频统计字段增加表达式索引，例如：

```sql
create index if not exists idx_chat_records_tool_meta_type
  on public.chat_records ((tool_meta ->> 'type'));

create index if not exists idx_chat_records_tool_meta_response_ms
  on public.chat_records (((tool_meta ->> 'responseMs')::numeric));
```

当前毕业设计规模下，不加上述索引通常也可以正常完成统计。
