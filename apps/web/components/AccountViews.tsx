"use client";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { api } from "../lib/api";

export function AccountOverview(){
 const {data}=useQuery({queryKey:["account"],queryFn:()=>api<any>("/account")});
 return <AccountShell title="Account"><dl className="account-grid"><Stat label="Display name" value={data?.profile.displayName}/><Stat label="Email" value={data?.email}/><Stat label="Verification" value={data?.emailVerifiedAt?"Verified":"Pending"}/><Stat label="Total practice" value={`${Math.round((data?.totalPracticeMs??0)/60000)} minutes`}/><Stat label="Completed files" value={data?.completedFiles}/><Stat label="Active devices" value={data?._count.devices}/></dl></AccountShell>
}
export function Devices(){
 const qc=useQueryClient();const {data=[]}=useQuery({queryKey:["account","devices"],queryFn:()=>api<any[]>("/account/devices")});
 async function revoke(id:string){await api(`/account/devices/${id}`,{method:"DELETE"});await qc.invalidateQueries({queryKey:["account","devices"]});}
 return <AccountShell title="Devices"><div className="dense-list">{data.map(device=><article key={device.id}><div><strong>{device.displayName||device.browser||"Browser"}</strong>{device.current&&<span className="tag">Current</span>}<p>{device.platform||"Unknown platform"} · last active {new Date(device.lastSeenAt).toLocaleString()} · {device.activeSessions} session(s)</p></div><button onClick={()=>revoke(device.id)}>Revoke</button></article>)}</div></AccountShell>
}
export function History(){
 const profile=useQuery({queryKey:["history","profile"],queryFn:()=>api<any[]>("/account/profile-history")});
 const settings=useQuery({queryKey:["history","settings"],queryFn:()=>api<any[]>("/account/settings-history")});
 return <AccountShell title="Profile and settings history"><HistoryList title="Profile" values={profile.data??[]}/><HistoryList title="Settings" values={settings.data??[]}/></AccountShell>
}
export function Security(){
 const {data=[]}=useQuery({queryKey:["security-events"],queryFn:()=>api<any[]>("/account/security-events")});const [message,setMessage]=useState("");
 async function change(event:FormEvent<HTMLFormElement>){event.preventDefault();const f=new FormData(event.currentTarget);try{await api("/auth/change-password",{method:"POST",body:JSON.stringify({currentPassword:f.get("currentPassword"),newPassword:f.get("newPassword")})});setMessage("Password changed; other sessions were revoked.");}catch(e){setMessage(e instanceof Error?e.message:"Change failed.");}}
 return <AccountShell title="Security"><form className="inline-form" onSubmit={change}><input required type="password" name="currentPassword" placeholder="Current password"/><input required minLength={10} maxLength={128} type="password" name="newPassword" placeholder="New password"/><button className="primary">Change password</button></form>{message&&<p>{message}</p>}<h2>Recent activity</h2><div className="dense-list">{data.map(event=><article key={event.id}><strong>{event.type.replaceAll("_"," ")}</strong><time>{new Date(event.createdAt).toLocaleString()}</time></article>)}</div></AccountShell>
}
export function Backups(){
 const qc=useQueryClient();const {data=[]}=useQuery({queryKey:["backups"],queryFn:()=>api<any[]>("/account/backups")});const [message,setMessage]=useState("");
 async function create(){try{await api("/account/backups",{method:"POST"});await qc.invalidateQueries({queryKey:["backups"]});}catch(e){setMessage(e instanceof Error?e.message:"Backup failed.");}}
 return <AccountShell title="Backups"><div className="section-actions"><button className="primary" onClick={create}>Create backup</button></div>{message&&<p className="form-error">{message}</p>}<div className="dense-list">{data.map(backup=><article key={backup.id}><div><strong>{backup.type.replaceAll("_"," ")}</strong><p>{new Date(backup.createdAt).toLocaleString()} · {backup.status} · {backup.encryptedSize?`${Math.ceil(backup.encryptedSize/1024)} KB`:"—"}</p></div><div className="actions"><a className="button" href={`${process.env.NEXT_PUBLIC_API_URL??"http://localhost:4000/api/v1"}/account/backups/${backup.id}/download`}>Download</a></div></article>)}</div></AccountShell>
}
function AccountShell({title,children}:{title:string;children:React.ReactNode}){return <main className="page account-page"><aside><Link href="/account">Overview</Link><Link href="/account/security">Security</Link><Link href="/account/devices">Devices</Link><Link href="/account/history">History</Link><Link href="/account/backups">Backups</Link></aside><section><h1>{title}</h1>{children}</section></main>}
function Stat({label,value}:{label:string;value:React.ReactNode}){return <div><dt>{label}</dt><dd>{value??"—"}</dd></div>}
function HistoryList({title,values=[]}:{title:string;values?:any[]}){return <section><h2>{title}</h2><div className="dense-list">{values.map(value=><article key={value.id}><div><strong>Revision {value.version}</strong><p>{JSON.stringify(value.changedFields)}</p></div><time>{new Date(value.createdAt).toLocaleString()}</time></article>)}</div></section>}
