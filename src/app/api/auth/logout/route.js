import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("c2c_client_auth", "", { path: "/", expires: new Date(0) });
  response.cookies.set("c2c_auth", "", { path: "/", expires: new Date(0) });
  return response;
}
