#!/usr/bin/env node
/**
 * Create (or promote) the first SUPER ADMIN account.
 *
 *   node --env-file=.env.local scripts/create-super-admin.mjs owner@example.com "A-Strong-Passw0rd" "Full Name"
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.
 * If the user already exists, only the role is upgraded (password untouched).
 */
import { createClient } from "@supabase/supabase-js";

const [email, password, fullName = "Super Admin"] = process.argv.slice(2);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!email) {
  console.error("Usage: create-super-admin.mjs <email> [password] [full name]");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data: existing } = await supabase.from("profiles").select("id").ilike("email", email).maybeSingle();
let userId = existing?.id;

if (!userId) {
  if (!password || password.length < 12) {
    console.error("A password of at least 12 characters is required to create a new account.");
    process.exit(1);
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) {
    console.error("Could not create user:", error.message);
    process.exit(1);
  }
  userId = data.user.id;
}

const { error } = await supabase.from("profiles").update({ role: "super_admin" }).eq("id", userId);
if (error) {
  console.error("Could not grant role:", error.message);
  process.exit(1);
}
console.log(`✔ ${email} is now a super admin.`);
