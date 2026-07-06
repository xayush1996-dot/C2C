import { NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    return NextResponse.json({ success: true, bookings: db.transactions });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, service, price, date, time } = body;

    const db = getDb();
    const newBooking = {
      id: db.transactions.length > 0 ? Math.max(...db.transactions.map(t => t.id)) + 1 : 1,
      name,
      email,
      service,
      paid: price,
      date,
      time,
      meetActive: true
    };

    db.transactions.push(newBooking);
    saveDb(db);

    return NextResponse.json({ success: true, booking: newBooking });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error." }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, meetActive } = body;

    const db = getDb();
    const index = db.transactions.findIndex(t => t.id === Number(id));
    if (index === -1) {
      return NextResponse.json({ success: false, error: "Booking not found." }, { status: 404 });
    }

    db.transactions[index].meetActive = meetActive;
    saveDb(db);

    return NextResponse.json({ success: true, booking: db.transactions[index] });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error." }, { status: 500 });
  }
}
