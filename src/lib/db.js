import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src/data/db.json");

export function getDb() {
  if (!fs.existsSync(dbPath)) {
    // Ensure dir exists
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    // Write defaults
    const defaults = {
      enquiries: [
        { id: 1, name: "Clarissa Vance", email: "clarissa@vancecorp.com", phone: "+1 (555) 234-5678", message: "Interested in the Reset Programme for our leadership team. Need details on tailoring features.", date: "2026-07-05", status: "New" },
        { id: 2, name: "Marcus Stone", email: "mstone@stonebuilders.io", phone: "+1 (555) 876-5432", message: "Inquiry about Couples' Conversations. Do both partners need to complete questionnaires separately?", date: "2026-07-04", status: "Read" },
        { id: 3, name: "Lina Alvarez", email: "alvarez.l@uxdesign.net", phone: "+1 (555) 901-2345", message: "URGENT: Booking a Clarity Call for tomorrow if slot is open.", date: "2026-07-04", status: "New" },
        { id: 4, name: "Robert Chen", email: "robert.c@venturecap.org", phone: "+1 (555) 345-6789", message: "General inquiry on your NDA and confidentiality protocol.", date: "2026-07-02", status: "Replied" }
      ],
      transactions: [
        { id: 1, name: "Sarah Lin", email: "sarah.lin@producthub.co", service: "Clarity Call", paid: "$149", date: "2026-07-08", time: "01:00 PM", meetActive: true },
        { id: 2, name: "Marc Henderson", email: "m.henderson@cloudlabs.net", service: "Reset Programme", paid: "$499", date: "2026-07-10", time: "09:00 AM", meetActive: true },
        { id: 3, name: "David & Elena R.", email: "elena@veloce.design", service: "Couples' Conversations", paid: "$249", date: "2026-07-12", time: "03:30 PM", meetActive: false },
        { id: 4, name: "Jonathan Wilde", email: "j.wilde@wildemedia.co", service: "Start Where You Are", paid: "$99", date: "2026-07-14", time: "10:30 AM", meetActive: true }
      ]
    };
    fs.writeFileSync(dbPath, JSON.stringify(defaults, null, 2));
    return defaults;
  }
  const data = fs.readFileSync(dbPath, "utf-8");
  return JSON.parse(data);
}

export function saveDb(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}
