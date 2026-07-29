import { z } from "zod";
export const API_URL=process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
function cookie(name:string){
  if(typeof document==="undefined")return undefined;
  return document.cookie.split("; ").find((part)=>part.startsWith(`${name}=`))?.split("=")[1];
}
export async function api<T>(path:string,init?:RequestInit):Promise<T>{
  const method=(init?.method??"GET").toUpperCase();
  const csrf=["POST","PUT","PATCH","DELETE"].includes(method)?cookie("cm_csrf"):undefined;
  const response=await fetch(`${API_URL}${path}`,{
    ...init,
    credentials:"include",
    headers:{"Content-Type":"application/json",...(csrf?{"X-CSRF-Token":decodeURIComponent(csrf)}:{}),...init?.headers},
    cache:"no-store"
  });
  if(!response.ok){
    const body=await response.json().catch(()=>null);
    const error=Object.assign(new Error(body?.error?.message ?? `Request failed (${response.status})`),{status:response.status,code:body?.error?.code,details:body?.error?.details});
    throw error;
  }
  return response.status===204?undefined as T:response.json() as Promise<T>;
}
export const projectSchema=z.object({id:z.string(),name:z.string(),description:z.string(),difficulty:z.string(),fileCount:z.number(),completedFiles:z.number(),nextFileId:z.string().nullable()});
export type ProjectSummary=z.infer<typeof projectSchema>;
