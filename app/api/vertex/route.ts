import {NextResponse} from "next/server";

type ServiceAccount={type?:string;project_id?:string;private_key?:string;client_email?:string;token_uri?:string};
type VertexResponse={error?:{message?:string};candidates?:Array<{finishReason?:string;content?:{parts?:Array<{text?:string}>}}>};
const SEGMENT=/^[a-zA-Z0-9._-]+$/;

function base64Url(value:string|Uint8Array){
 const bytes=typeof value==="string"?new TextEncoder().encode(value):value;
 let binary="";
 for(const byte of bytes)binary+=String.fromCharCode(byte);
 return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
}

async function getAccessToken(account:ServiceAccount){
 const now=Math.floor(Date.now()/1000);
 const header=base64Url(JSON.stringify({alg:"RS256",typ:"JWT"}));
 const claims=base64Url(JSON.stringify({iss:account.client_email,scope:"https://www.googleapis.com/auth/cloud-platform",aud:account.token_uri||"https://oauth2.googleapis.com/token",iat:now,exp:now+3600}));
 const unsigned=`${header}.${claims}`;
 const pem=String(account.private_key).replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,"");
 const der=Uint8Array.from(atob(pem),char=>char.charCodeAt(0));
 const key=await crypto.subtle.importKey("pkcs8",der,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["sign"]);
 const signature=await crypto.subtle.sign("RSASSA-PKCS1-v1_5",key,new TextEncoder().encode(unsigned));
 const assertion=`${unsigned}.${base64Url(new Uint8Array(signature))}`;
 const tokenResponse=await fetch(account.token_uri||"https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion})});
 const tokenData=await tokenResponse.json().catch(()=>({})) as {access_token?:string;error_description?:string};
 if(!tokenResponse.ok||!tokenData.access_token)throw new Error(tokenData.error_description||"Không thể xác thực service account");
 return tokenData.access_token;
}

export async function POST(request:Request){
 try{
  const body=await request.json() as Record<string,unknown>;
  const raw=String(body.credentials||process.env.VERTEX_SERVICE_ACCOUNT_JSON||"");
  if(!raw)return NextResponse.json({error:"Thiếu file service account JSON"},{status:400});
  let account:ServiceAccount;
  try{account=JSON.parse(raw) as ServiceAccount}catch{return NextResponse.json({error:"Service account JSON không hợp lệ"},{status:400})}
  if(account.type!=="service_account"||!account.project_id||!account.client_email||!account.private_key)return NextResponse.json({error:"File JSON thiếu thông tin service account"},{status:400});
  const prompt=String(body.prompt||"").trim();
  const location="global";
  const model=String(body.model||process.env.VERTEX_MODEL||"gemini-2.5-flash-lite").trim();
  const jsonMode=body.jsonMode===true;
  if(!prompt)return NextResponse.json({error:"Thiếu nội dung yêu cầu"},{status:400});
  if(!SEGMENT.test(account.project_id)||!SEGMENT.test(location)||!SEGMENT.test(model))return NextResponse.json({error:"Cấu hình Vertex AI không hợp lệ"},{status:400});
  const accessToken=await getAccessToken(account);
  const endpoint=`https://aiplatform.googleapis.com/v1/projects/${account.project_id}/locations/${location}/publishers/google/models/${model}:generateContent`;
  const generationConfig:Record<string,unknown>={temperature:jsonMode?0:.7,maxOutputTokens:jsonMode?8192:1800};
  if(jsonMode)generationConfig.seed=1;
  if(jsonMode)generationConfig.responseMimeType="application/json";
  const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${accessToken}`},body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt}]}],generationConfig})});
  const data=await response.json().catch(()=>({})) as VertexResponse;
  if(!response.ok)return NextResponse.json({error:data.error?.message||`Vertex AI trả về lỗi ${response.status}`},{status:response.status});
  const candidate=data.candidates?.[0];
  const text=candidate?.content?.parts?.map(part=>part.text||"").join("").trim();
  if(candidate?.finishReason==="MAX_TOKENS")return NextResponse.json({error:"Phản hồi kiểm tra quá dài và đã bị cắt. Hãy thử lại với bản nháp ngắn hơn."},{status:502});
  if(!text)return NextResponse.json({error:"Vertex AI không trả về nội dung"},{status:502});
  return NextResponse.json({text});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Không thể xử lý yêu cầu Vertex AI"},{status:500})}
}
