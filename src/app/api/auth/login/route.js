import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { email, password, activeTab } = await request.json();

    if (activeTab === "client") {
      if (email?.toLowerCase() === "client@example.com" && password === "clientpassword") {
        const response = NextResponse.json({ success: true, user: { email, role: "client" } });
        response.cookies.set("c2c_client_auth", "true", {
          path: "/",
          maxAge: 86400,
          sameSite: "lax",
          httpOnly: false
        });
        return response;
      }
      return NextResponse.json({ success: false, error: "Invalid client credentials." }, { status: 401 });
    } else {
      if (email?.toLowerCase() === "admin@c2c.com" && password === "clarity2026") {
        const response = NextResponse.json({ success: true, user: { email, role: "admin" } });
        response.cookies.set("c2c_auth", "true", {
          path: "/",
          maxAge: 86400,
          sameSite: "lax",
          httpOnly: false
        });
        return response;
      }
      return NextResponse.json({ success: false, error: "Invalid admin credentials." }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error." }, { status: 500 });
  }
}
