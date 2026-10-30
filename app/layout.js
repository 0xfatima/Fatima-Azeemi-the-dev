import "./globals.css";

export const metadata = {
  title: "0xfatima | Portfolio & Management Portal",
  description:
    "Crafting clean, minimalistic web interfaces and scalable backend architectures with deep precision and minimalist design principles.",
};

const themeScript = `(function(){try{function resolveTheme(){var s=localStorage.getItem('theme');if(s==='light'||s==='dark')return s;return window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}var t=resolveTheme();var r=document.documentElement;r.classList.remove('dark','light');r.classList.add(t==='light'?'light':'dark');}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className="selection:bg-neutral-700 selection:text-cream-bg dark:selection:bg-neutral-300 dark:selection:text-dark-bg"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
