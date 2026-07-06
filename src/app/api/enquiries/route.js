import { NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    return NextResponse.json({ success: true, enquiries: db.enquiries });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, message } = body;

    const db = getDb();
    const newEnquiry = {
      id: db.enquiries.length > 0 ? Math.max(...db.enquiries.map(e => e.id)) + 1 : 1,
      name,
      email,
      phone,
      message,
      date: new Date().toISOString().split("T")[0],
      status: "New"
    };

    db.enquiries.push(newEnquiry);
    saveDb(db);

    return NextResponse.json({ success: true, enquiry: newEnquiry });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error." }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    const db = getDb();
    const index = db.enquiries.findIndex(e => e.id === Number(id));
    if (index === -1) {
      return NextResponse.json({ success: false, error: "Enquiry not found." }, { status: 404 });
    }

    db.enquiries[index].status = status;
    saveDb(db);

    return NextResponse.json({ success: true, enquiry: db.enquiries[index] });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error." }, { status: 500 });
  }
}
