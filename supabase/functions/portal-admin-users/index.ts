import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

type AccessRow = {
  user_id: string;
  email: string;
  snapshot_id: string;
  role: "admin" | "editor" | "viewer";
  agent_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: corsHeaders,
  });
}

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function normalizeRole(value: unknown): AccessRow["role"] {
  return value === "admin" || value === "editor" || value === "viewer" ? value : "viewer";
}

function normalizeAgentId(value: unknown) {
  const raw = String(value || "").trim();
  return raw || null;
}

async function resolveExistingAuthUserIdByEmail(
  adminClient: ReturnType<typeof createClient>,
  email: string,
) {
  const { data, error } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) throw error;
  const match = (data.users || []).find((user) => normalizeEmail(user.email) === email);
  return match?.id || null;
}

async function buildUserList(
  adminClient: ReturnType<typeof createClient>,
  snapshotId: string,
) {
  const [{ data: rows, error: rowsError }, { data: authData, error: authError }] = await Promise.all([
    adminClient
      .from("portal_user_access")
      .select("*")
      .eq("snapshot_id", snapshotId)
      .order("created_at", { ascending: false }),
    adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  if (rowsError) throw rowsError;
  if (authError) throw authError;

  const authMap = new Map((authData.users || []).map((user) => [user.id, user]));

  return (rows || []).map((row) => {
    const authUser = authMap.get(row.user_id);
    return {
      userId: row.user_id,
      email: row.email,
      snapshotId: row.snapshot_id,
      role: row.role,
      agentId: row.agent_id,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastSignInAt: authUser?.last_sign_in_at || null,
      invitedAt: authUser?.invited_at || null,
      emailConfirmedAt: authUser?.email_confirmed_at || null,
    };
  });
}

async function requireAdminRequest(
  req: Request,
  adminClient: ReturnType<typeof createClient>,
) {
  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!jwt) {
    throw new Response(JSON.stringify({ error: "Falta el token de autorización" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const { data: userData, error: userError } = await adminClient.auth.getUser(jwt);
  if (userError || !userData.user) {
    throw new Response(JSON.stringify({ error: "No se pudo validar la sesión" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const { data: accessRow, error: accessError } = await adminClient
    .from("portal_user_access")
    .select("*")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (accessError) throw accessError;
  if (!accessRow || !accessRow.is_active || accessRow.role !== "admin") {
    throw new Response(JSON.stringify({ error: "Solo los administradores pueden usar esta función" }), {
      status: 403,
      headers: corsHeaders,
    });
  }

  return {
    requester: userData.user,
    accessRow: accessRow as AccessRow,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Faltan variables SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY" }, 500);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    const { requester, accessRow } = await requireAdminRequest(req, adminClient);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "list").trim();

    if (action === "list") {
      return jsonResponse({
        users: await buildUserList(adminClient, accessRow.snapshot_id),
      });
    }

    if (action === "invite" || action === "resend_invite") {
      const email = normalizeEmail(body.email);
      const role = normalizeRole(body.role);
      const agentId = role === "admin" ? null : normalizeAgentId(body.agentId);
      const redirectTo = String(body.redirectTo || "").trim() || undefined;

      if (!email) return jsonResponse({ error: "Falta el correo del usuario" }, 400);
      if (role !== "admin" && !agentId) {
        return jsonResponse({ error: "Los roles editor y viewer requieren un agente asignado" }, 400);
      }

      let userId = await resolveExistingAuthUserIdByEmail(adminClient, email);

      if (!userId || action === "resend_invite") {
        const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
          redirectTo,
        });
        if (inviteError) return jsonResponse({ error: inviteError.message }, 400);
        userId = inviteData.user?.id || userId;
      }

      if (!userId) {
        return jsonResponse({ error: "No se pudo resolver la cuenta de autenticación para ese correo" }, 400);
      }

      const { error: upsertError } = await adminClient.from("portal_user_access").upsert({
        user_id: userId,
        email,
        snapshot_id: accessRow.snapshot_id,
        role,
        agent_id: agentId,
        is_active: true,
      });

      if (upsertError) return jsonResponse({ error: upsertError.message }, 400);

      return jsonResponse({
        ok: true,
        users: await buildUserList(adminClient, accessRow.snapshot_id),
      });
    }

    if (action === "update_access") {
      const userId = String(body.userId || "").trim();
      const role = normalizeRole(body.role);
      const agentId = role === "admin" ? null : normalizeAgentId(body.agentId);
      const isActive = typeof body.isActive === "boolean" ? body.isActive : true;

      if (!userId) return jsonResponse({ error: "Falta el identificador del usuario" }, 400);
      if (role !== "admin" && !agentId) {
        return jsonResponse({ error: "Los roles editor y viewer requieren un agente asignado" }, 400);
      }
      if (userId === requester.id && role !== "admin") {
        return jsonResponse({ error: "No puedes quitarte tu propio rol admin desde aquí" }, 400);
      }

      const { error: updateError } = await adminClient
        .from("portal_user_access")
        .update({
          role,
          agent_id: agentId,
          is_active: isActive,
        })
        .eq("user_id", userId)
        .eq("snapshot_id", accessRow.snapshot_id);

      if (updateError) return jsonResponse({ error: updateError.message }, 400);

      return jsonResponse({
        ok: true,
        users: await buildUserList(adminClient, accessRow.snapshot_id),
      });
    }

    if (action === "disable_access") {
      const userId = String(body.userId || "").trim();
      if (!userId) return jsonResponse({ error: "Falta el identificador del usuario" }, 400);
      if (userId === requester.id) {
        return jsonResponse({ error: "No puedes desactivar tu propio acceso desde aquí" }, 400);
      }

      const { error: disableError } = await adminClient
        .from("portal_user_access")
        .update({ is_active: false })
        .eq("user_id", userId)
        .eq("snapshot_id", accessRow.snapshot_id);

      if (disableError) return jsonResponse({ error: disableError.message }, 400);

      return jsonResponse({
        ok: true,
        users: await buildUserList(adminClient, accessRow.snapshot_id),
      });
    }

    return jsonResponse({ error: `Acción no soportada: ${action}` }, 400);
  } catch (error) {
    if (error instanceof Response) return error;
    const message = error instanceof Error ? error.message : "Error inesperado";
    return jsonResponse({ error: message }, 500);
  }
});
