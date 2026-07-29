import { z } from "zod";
export const API_URL=process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
export async function api<T>(path:string,init?:RequestInit):Promise<T>{
  const response=await fetch(`${API_URL}${path}`,{...init,headers:{"Content-Type":"application/json",...init?.headers},cache:"no-store"});
  if(!response.ok)throw new Error((await response.json().catch(()=>null))?.error?.message ?? `Request failed (${response.status})`);
  return response.status===204?undefined as T:response.json() as Promise<T>;
}
export const projectSchema=z.object({id:z.string(),name:z.string(),description:z.string(),difficulty:z.string(),fileCount:z.number(),completedFiles:z.number(),nextFileId:z.string().nullable()});
export type ProjectSummary=z.infer<typeof projectSchema>;
