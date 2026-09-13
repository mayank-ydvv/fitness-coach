import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildAccountExport } from "@/lib/export/build";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const bundle = await buildAccountExport(supabase);
    return new NextResponse(JSON.stringify(bundle, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="fitness-coach-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Couldn't build your export. Try again." }, { status: 500 });
  }
}
