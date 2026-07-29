"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../lib/api";

type Session={user:{displayName:string;email:string;emailVerified:boolean;onboardingComplete:boolean}};
export function AppChrome({children}:{children:React.ReactNode}){
  const pathname=usePathname();const router=useRouter();const queryClient=useQueryClient();const [dismissed,setDismissed]=useState(false);
  const publicPage=pathname.startsWith("/auth/")||pathname==="/privacy"||pathname==="/terms";
  const session=useQuery({queryKey:["auth","session"],queryFn:()=>api<Session>("/auth/session"),enabled:!publicPage,retry:false});
  async function signOut(){await api("/auth/sign-out",{method:"POST"});queryClient.clear();router.replace("/auth/sign-in");router.refresh();}
  if(publicPage)return children;
  return <>
    <nav className="app-nav"><Link className="brand" href="/">CodeMuscle</Link><div className="nav-links"><Link href="/">Today</Link><Link href="/projects">Projects</Link><Link href="/statistics">Statistics</Link><Link href="/sessions">Sessions</Link><Link href="/settings">Settings</Link></div>
      <details className="account-menu"><summary aria-label="Account menu"><span className="avatar">{session.data?.user.displayName?.slice(0,2).toUpperCase()??"CM"}</span><span>{session.data?.user.displayName??"Account"}</span></summary><div><Link href="/account">Account</Link><Link href="/account/security">Security</Link><Link href="/account/devices">Devices</Link><Link href="/account/backups">Backups</Link><button onClick={signOut}>Sign out</button></div></details>
    </nav>
    {session.data&&!session.data.user.emailVerified&&!dismissed&&<div className="verification-banner">Verify your email to secure account recovery and backup restoration.<button onClick={()=>api("/auth/resend-verification",{method:"POST"})}>Resend</button><button aria-label="Dismiss verification reminder" onClick={()=>setDismissed(true)}>×</button></div>}
    {children}
  </>;
}
