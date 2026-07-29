"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "../lib/api";

export function ForgotPassword(){
  const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);const data=new FormData(event.currentTarget);
    const result=await api<{message:string}>("/auth/forgot-password",{method:"POST",body:JSON.stringify({email:data.get("email")})}).catch(()=>({message:"If an account exists, a reset message has been sent."}));
    setMessage(result.message);setBusy(false);}
  return <AuthAction title="Reset password"><form className="auth-form" onSubmit={submit}><label>Email<input required type="email" name="email"/></label>{message&&<p role="status">{message}</p>}<button className="primary" disabled={busy}>Send reset link</button><Link href="/auth/sign-in">Return to sign in</Link></form></AuthAction>;
}
export function ResetPassword(){
  const query=useSearchParams(); const [message,setMessage]=useState(""); const [error,setError]=useState("");
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const data=new FormData(event.currentTarget);setError("");
    try{await api("/auth/reset-password",{method:"POST",body:JSON.stringify({token:query.get("token"),password:data.get("password"),confirmPassword:data.get("confirmPassword")})});setMessage("Password changed. You can now sign in.");}
    catch(cause){setError(cause instanceof Error?cause.message:"Reset failed.");}}
  return <AuthAction title="Choose a new password"><form className="auth-form" onSubmit={submit}><label>New password<input minLength={10} maxLength={128} required type="password" name="password"/></label><label>Confirm password<input minLength={10} maxLength={128} required type="password" name="confirmPassword"/></label>{error&&<p className="form-error">{error}</p>}{message&&<p>{message}</p>}<button className="primary">Reset password</button></form></AuthAction>;
}
export function VerifyEmail(){
  const query=useSearchParams(); const [message,setMessage]=useState("");
  async function verify(){try{await api("/auth/verify-email",{method:"POST",body:JSON.stringify({token:query.get("token")})});setMessage("Email verified successfully.");}catch(cause){setMessage(cause instanceof Error?cause.message:"Verification failed.");}}
  return <AuthAction title="Verify email"><p>{message||"Confirm this email address to enable backup export and restore."}</p><button className="primary" onClick={verify}>Verify email</button></AuthAction>;
}
function AuthAction({title,children}:{title:string;children:React.ReactNode}){return <main className="auth-page"><section className="auth-card"><span className="brand">CodeMuscle</span><h1>{title}</h1>{children}</section></main>}
