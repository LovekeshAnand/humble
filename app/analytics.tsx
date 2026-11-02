import Script from "next/script";

// IDs are public by design (they ship in every page); env vars let a fork or preview use its own.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "G-L9CFD72CYV";
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID ?? "z7fqu7a2rz";

// Google Analytics 4 and Microsoft Clarity, loaded after the page is interactive so they never slow first paint.
export default function Analytics() {
  if (process.env.NODE_ENV !== "production") return null; // keep local development out of the numbers
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
      </Script>
      <Script id="clarity-init" strategy="afterInteractive">
        {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`}
      </Script>
    </>
  );
}
