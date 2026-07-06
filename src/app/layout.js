import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingModal from "@/components/BookingModal";
import { BookingProvider } from "@/context/BookingContext";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata = {
  title: "Confusion to Clarity — Premium Coaching & Consulting Services",
  description: "A warm, light-mode editorial coaching space helping you move from confusion to clarity. Discover tailored packages, interactive session booking, and personal coaching.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-charcoal">
        <BookingProvider>
          <Header />
          <main className="flex-1 flex flex-col pt-20">
            {children}
          </main>
          <Footer />
          <BookingModal />
        </BookingProvider>
      </body>
    </html>
  );
}
