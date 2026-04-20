import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const { name, email, lrn, password, joinCode } = await req.json();

  if (!name || !email || !password || !joinCode)
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });

  // Verify join code exists
  const { data: cls, error: clsErr } = await admin
    .from("classes")
    .select("id")
    .eq("join_code", joinCode)
    .single();
  if (clsErr || !cls)
    return NextResponse.json({ error: "Invalid join code." }, { status: 400 });

  // Create auth user
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authErr)
    return NextResponse.json({ error: authErr.message }, { status: 500 });

  const userId = authData.user.id;

  // Insert into users table
  const { error: userErr } = await admin.from("users").insert({
    id: userId,
    email,
    name,
    role: "student",
    lrn: lrn ?? null,
  });
  if (userErr) {
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: userErr.message }, { status: 500 });
  }

  // Enroll in class
  const { error: enrollErr } = await admin.from("enrollments").insert({
    student_id: userId,
    class_id: cls.id,
  });
  if (enrollErr)
    return NextResponse.json({ error: enrollErr.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
