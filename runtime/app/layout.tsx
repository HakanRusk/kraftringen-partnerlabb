import type { Metadata } from "next";
export const metadata: Metadata = {title:"Kraftringen Partnerportal", description:"Partnerlabb – prototyp för orderflöden"};
export default function Layout({children}:{children:React.ReactNode}) {return <html lang="sv"><body>{children}</body></html>;}
