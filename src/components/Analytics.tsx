/**
 * Google Tag Manager and Google Analytics 4, switched on by Hostinger environment variables:
 *   GTM_ID=GTM-XXXXXXX         (Tag Manager container)
 *   GA_MEASUREMENT_ID=G-XXXXXXXXXX   (Analytics data stream)
 * Either, both or neither. Rendered in <head> on every page, which is where Google Search Console looks when
 * verifying ownership through Tag Manager or Analytics. Staff pages (console, login) are never tracked, so
 * visits by the team do not count as website traffic.
 */
const GTM = /^GTM-[A-Z0-9]{4,12}$/;
const GA = /^G-[A-Z0-9]{4,15}$/;
const STAFF = "/^\\/(admin|employee|login|change-password|forgot-password)(\\/|$)/";

export function analyticsIds() {
  const gtm = process.env.GTM_ID?.trim().toUpperCase();
  const ga = process.env.GA_MEASUREMENT_ID?.trim().toUpperCase();
  return { gtm: gtm && GTM.test(gtm) ? gtm : null, ga: ga && GA.test(ga) ? ga : null };
}

export function AnalyticsHead() {
  const { gtm, ga } = analyticsIds();
  return (
    <>
      {gtm && (
        <script
          dangerouslySetInnerHTML={{
            __html: `if(!${STAFF}.test(location.pathname)){(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');}`,
          }}
        />
      )}
      {ga && (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());if(!${STAFF}.test(location.pathname)){gtag('config','${ga}');}`,
            }}
          />
        </>
      )}
    </>
  );
}

/** Tag Manager's fallback for visitors with JavaScript turned off; goes first inside <body>. */
export function AnalyticsBody() {
  const { gtm } = analyticsIds();
  if (!gtm) return null;
  return (
    <noscript>
      <iframe src={`https://www.googletagmanager.com/ns.html?id=${gtm}`} height="0" width="0" style={{ display: "none", visibility: "hidden" }} />
    </noscript>
  );
}
