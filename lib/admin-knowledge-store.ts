import {
  buildKnowledgePayload,
  getKnowledgeTable,
  type KnowledgeKind,
  type KnowledgeRecord,
} from "@/lib/admin-knowledge"
import { supabaseAdminRequest } from "@/lib/supabase-admin"

function encodeId(id: string) {
  return encodeURIComponent(id)
}

export async function listKnowledge(kind: KnowledgeKind) {
  const table = getKnowledgeTable(kind)
  const path = `${table}?select=*&order=updated_at.desc.nullslast`
  const data = await supabaseAdminRequest(path)
  return Array.isArray(data) ? (data as KnowledgeRecord[]) : []
}

export async function createKnowledge(kind: KnowledgeKind, values: Record<string, unknown>) {
  const table = getKnowledgeTable(kind)
  const payload = buildKnowledgePayload(kind, values)
  const data = await supabaseAdminRequest(`${table}?select=*`, {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  })

  return Array.isArray(data) ? (data[0] as KnowledgeRecord) : null
}

export async function updateKnowledge(kind: KnowledgeKind, id: string, values: Record<string, unknown>) {
  const table = getKnowledgeTable(kind)
  const payload = buildKnowledgePayload(kind, values)
  const data = await supabaseAdminRequest(`${table}?id=eq.${encodeId(id)}&select=*`, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  })

  return Array.isArray(data) ? (data[0] as KnowledgeRecord) : null
}

export async function removeKnowledge(kind: KnowledgeKind, id: string) {
  const table = getKnowledgeTable(kind)
  await supabaseAdminRequest(`${table}?id=eq.${encodeId(id)}`, {
    method: "DELETE",
    headers: {
      Prefer: "return=minimal",
    },
  })
}
