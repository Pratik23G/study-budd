import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { PomodoroProvider } from "./components/PomodoroProvider";

export const metadata = {
  title: "Study Budd",
  description: "AI-powered study assistant",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <PomodoroProvider>
          <Navbar />
          <div className="flex-1">{children}</div>
          <Footer />
        </PomodoroProvider>
      </body>
    </html>
  );
}
