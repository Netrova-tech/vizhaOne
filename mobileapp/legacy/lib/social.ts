export type SocialKind="reel"|"post";
export interface SocialItem{id:string;ownerId:string;ownerName:string;avatar?:string;kind:SocialKind;media:string;mediaType:"image"|"video";caption:string;service:string;price?:string;createdAt:string;likes:string[];savedBy:string[]}
const KEY="vizha_social_items";
export function socialItems():SocialItem[]{try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return[]}}
export function saveSocial(items:SocialItem[]){localStorage.setItem(KEY,JSON.stringify(items))}
export function publishSocial(item:SocialItem){saveSocial([item,...socialItems()])}
export function toggleSocial(id:string,userId:string,key:"likes"|"savedBy"){const list=socialItems().map(item=>{if(item.id!==id)return item;const values=item[key];return {...item,[key]:values.includes(userId)?values.filter(x=>x!==userId):[...values,userId]}});saveSocial(list);return list}
export function updateSessionAvatar(avatar:string){const raw=localStorage.getItem("vizha_demo_user");if(!raw)return;const session={...JSON.parse(raw),avatar_url:avatar};localStorage.setItem("vizha_demo_user",JSON.stringify(session));const accounts=JSON.parse(localStorage.getItem("vizha_mobile_accounts")||"[]");localStorage.setItem("vizha_mobile_accounts",JSON.stringify(accounts.map((a:{id:string})=>a.id===session.id?{...a,avatar_url:avatar}:a)));window.dispatchEvent(new Event("vizha_auth_change"))}
export function fileData(file:File,max=3_500_000):Promise<string>{return new Promise((resolve,reject)=>{if(file.size>max)return reject(new Error("File must be below 3.5 MB for testing mode"));const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error("Unable to read file"));reader.readAsDataURL(file)})}
