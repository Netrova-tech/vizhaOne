const mobileApiUrl=(path:string)=>`${(process.env.NEXT_PUBLIC_API_URL||"https://api.vizhaone.com").replace(/\/$/,"")}${path}`;
export type MobileRole = "customer" | "service_provider" | "admin";
export interface MobileAccount { id:string; name:string; phone:string; mobile?:string; email:string; password?:string; location:string; role:MobileRole; provider:"email"|"google"; avatar_url?:string; created_at:string; }
const SESSION="vizha_demo_user", TOKEN="vizha_mobile_token";
export function accounts():MobileAccount[]{try{const current=localStorage.getItem(SESSION);return current?[JSON.parse(current)]:[]}catch{return[]}}
export function findAccount(email:string){return accounts().find((a)=>a.email===email.trim().toLowerCase())}
export function saveAccount(account:MobileAccount){startSession(account)}
export function token(){return typeof window==="undefined"?"":localStorage.getItem(TOKEN)||""}
export function startSession(account:MobileAccount,authToken?:string){if(authToken)localStorage.setItem(TOKEN,authToken);localStorage.setItem(SESSION,JSON.stringify({...account,mobile:account.mobile||account.phone}));window.dispatchEvent(new Event("vizha_auth_change"))}
export function clearMobileSession(){localStorage.removeItem(TOKEN);localStorage.removeItem(SESSION)}
export function destination(role:MobileRole){return role==="admin"?"/admin":role==="service_provider"?"/provider-dashboard":"/"}
async function json(response:Response){const body=await response.json().catch(()=>null);if(!response.ok)throw new Error(body?.error||"Server request failed");return body}
export async function registerAccount(account:Omit<MobileAccount,"id"|"created_at">){return json(await fetch(mobileApiUrl("/api/auth/register"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...account,mobile:account.phone})})) as Promise<{token:string;user:MobileAccount}>}
export async function loginAccount(email:string,password:string){return json(await fetch(mobileApiUrl("/api/auth/login"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})})) as Promise<{token:string;user:MobileAccount}>}
export interface GoogleProfileInput {name?:string;phone?:string;location?:string;role?:MobileRole}
export async function loginGoogle(idToken:string,profile:GoogleProfileInput={}){return json(await fetch(mobileApiUrl("/api/auth/google"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({idToken,...profile,mobile:profile.phone})})) as Promise<{success:boolean;needsProfile:boolean;profile?:{name:string;email:string;avatar_url?:string};token?:string;user?:MobileAccount}>}
export async function updateAccount(profile:{name:string;mobile:string;location:string;avatar_url?:string}){return json(await fetch(mobileApiUrl("/api/auth/profile"),{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token()}`},body:JSON.stringify(profile)})) as Promise<{user:MobileAccount}>}
export async function fetchAccount(){return json(await fetch(mobileApiUrl("/api/auth/mobile-me"),{headers:{Authorization:`Bearer ${token()}`}})) as Promise<{user:MobileAccount}>}
export async function deleteAccount(){return json(await fetch(mobileApiUrl("/api/auth/account"),{method:"DELETE",headers:{Authorization:`Bearer ${token()}`}})) as Promise<{success:boolean}>}
