"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { api } from "../lib/api";
import { safeReturnTo } from "../lib/safeReturn";

export function SignInForm() {
  const router = useRouter();
  const query = useSearchParams();
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const data = new FormData(event.currentTarget);
    try {
      const result = await api<{user:{onboardingComplete:boolean}}>("/auth/sign-in", {
        method:"POST",
        body:JSON.stringify({
          email:data.get("email"), password:data.get("password"), rememberMe:data.get("rememberMe")==="on",
          deviceKey:getDeviceKey(), deviceName:getDeviceName()
        })
      });
      router.replace(result.user.onboardingComplete ? safeReturnTo(query.get("returnTo")) : "/onboarding");
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Sign in failed."); }
    finally { setBusy(false); }
  }
  return <AuthShell title="Sign in" subtitle="Continue your deliberate coding practice.">
    <form onSubmit={submit} className="auth-form">
      <label>Email<input required name="email" type="email" autoComplete="email"/></label>
      <PasswordField name="password" label="Password" show={show} setShow={setShow}/>
      <div className="auth-row"><label className="check"><input name="rememberMe" type="checkbox"/> Remember me</label><Link href="/auth/forgot-password">Forgot password?</Link></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary" disabled={busy}>{busy?"Signing in…":"Sign in"}</button>
      <p>New to CodeMuscle? <Link href="/auth/sign-up">Create an account</Link></p>
    </form>
  </AuthShell>;
}

export function SignUpForm() {
  const router=useRouter(); const [show,setShow]=useState(false); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setError("");const data=new FormData(event.currentTarget);
    try{
      await api("/auth/sign-up",{method:"POST",body:JSON.stringify({
        displayName:data.get("displayName"),email:data.get("email"),password:data.get("password"),
        confirmPassword:data.get("confirmPassword"),termsAccepted:data.get("termsAccepted")==="on",
        deviceKey:getDeviceKey(),deviceName:getDeviceName()
      })});
      router.replace("/onboarding");router.refresh();
    }catch(cause){setError(cause instanceof Error?cause.message:"Account creation failed.");}finally{setBusy(false);}
  }
  return <AuthShell title="Create your account" subtitle="Synchronize practice progress securely across your devices.">
    <form onSubmit={submit} className="auth-form">
      <label>Display name<input required name="displayName" autoComplete="name"/></label>
      <label>Email<input required name="email" type="email" autoComplete="email"/></label>
      <PasswordField name="password" label="Password" show={show} setShow={setShow}/>
      <label>Confirm password<input required minLength={10} maxLength={128} name="confirmPassword" type={show?"text":"password"} autoComplete="new-password"/></label>
      <label className="check"><input required name="termsAccepted" type="checkbox"/> I accept the <Link href="/terms">terms</Link> and <Link href="/privacy">privacy policy</Link>.</label>
      {error&&<p className="form-error" role="alert">{error}</p>}
      <button className="primary" disabled={busy}>{busy?"Creating account…":"Create account"}</button>
      <p>Already registered? <Link href="/auth/sign-in">Sign in</Link></p>
    </form>
  </AuthShell>;
}

function PasswordField({name,label,show,setShow}:{name:string;label:string;show:boolean;setShow:(value:boolean)=>void}){
  return <label>{label}<span className="password-field"><input required minLength={10} maxLength={128} name={name} type={show?"text":"password"} autoComplete={name==="password"?"current-password":"new-password"}/><button type="button" aria-label={show?"Hide password":"Show password"} onClick={()=>setShow(!show)}>{show?<EyeOff size={16}/>:<Eye size={16}/>}</button></span></label>;
}
function AuthShell({title,subtitle,children}:{title:string;subtitle:string;children:React.ReactNode}){
  return <main className="auth-page"><section className="auth-card"><Link className="brand" href="/">CodeMuscle</Link><h1>{title}</h1><p className="muted">{subtitle}</p>{children}</section></main>;
}
function getDeviceKey(){
  const key="codemuscle-device-key";let value=localStorage.getItem(key);
  if(!value){value=crypto.randomUUID();localStorage.setItem(key,value);}return value;
}
function getDeviceName(){
  const browser=navigator.userAgent.includes("Edg/")?"Edge":navigator.userAgent.includes("Firefox/")?"Firefox":navigator.userAgent.includes("Chrome/")?"Chrome":navigator.userAgent.includes("Safari/")?"Safari":"Browser";
  const platform=navigator.platform||"this device";
  return `${browser} on ${platform}`.slice(0,100);
}
