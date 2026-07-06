import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingModal from "@/components/BookingModal";
import { BookingProvider } from "@/context/BookingContext";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata = {
  title: {
    default: "Confusion to Clarity — Premium Coaching & Consulting Services",
    template: "%s | Confusion to Clarity",
  },
  description: "A warm, light-mode editorial coaching space helping you move from confusion to clarity. Discover tailored packages, interactive session booking, and personal coaching by Julius Thorne.",
  keywords: [
    "Confusion to Clarity",
    "Julius Thorne",
    "coaching",
    "consulting",
    "emotional intelligence",
    "EQ development",
    "soft skills training",
    "public speaking",
    "leadership development",
    "personality development",
    "career guidance",
    "resume building",
    "interview preparation",
    "mentorship",
  ],
  authors: [{ name: "Julius Thorne", url: "https://c2cclarity.com" }],
  creator: "Julius Thorne",
  publisher: "Confusion to Clarity",
  metadataBase: new URL("https://c2cclarity.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Confusion to Clarity — Premium Coaching & Consulting Services",
    description: "Transform your potential into peak performance. Discover tailored packages, interactive session booking, and personal coaching by Julius Thorne.",
    url: "https://c2cclarity.com",
    siteName: "Confusion to Clarity",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Confusion to Clarity — Premium Coaching & Consulting Services",
    description: "Transform your potential into peak performance. Discover tailored packages, interactive session booking, and personal coaching by Julius Thorne.",
    creator: "@c2cclarity",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
      className={`${manrope.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg-base text-text-primary">
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
