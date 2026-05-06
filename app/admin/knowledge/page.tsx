import AdminKnowledgeConsole from "@/components/admin-knowledge-console"
import AdminLogin from "@/components/admin-login"
import { ADMIN_SESSION_COOKIE, getAdminPassword, hasAdminSessionValue } from "@/lib/admin-auth"
import { hasSupabaseAdminConfig } from "@/lib/supabase-admin"
import { cookies } from "next/headers"

function SetupNotice() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-16">
      <section className="surface-ring w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-8">
        <div className="section-kicker">Setup Required</div>
        <h1 className="mt-4 text-2xl font-semibold text-[var(--text)]">后台环境变量还没配好</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
          要启用知识维护后台，请先在 <code>.env.local</code> 中配置以下变量：
        </p>
        <pre className="mt-5 overflow-x-auto rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4 text-sm text-[var(--text)]">
{`ADMIN_PASSWORD=your-admin-password
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key`}
        </pre>
      </section>
    </main>
  )
}

export default async function AdminKnowledgePage() {
  if (!getAdminPassword() || !hasSupabaseAdminConfig()) {
    return <SetupNotice />
  }

  const cookieStore = await cookies()
  const sessionValue = cookieStore.get(ADMIN_SESSION_COOKIE)?.value

  if (!hasAdminSessionValue(sessionValue)) {
    return <AdminLogin />
  }

  return <AdminKnowledgeConsole />
}
