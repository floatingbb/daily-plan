import { env } from "cloudflare:workers";

import { getChatGPTUser } from "../../chatgpt-auth";

export const dynamic = "force-dynamic";

const response = (body: unknown, status = 200) => Response.json(body, {status, headers: {"Cache-Control":"no-store"}});

export async function GET() {

 const user = await getChatGPTUser();

 if (!user) return response({error:"请先登录"},401);

 const row = await env.DB!.prepare("SELECT data, revision, updated_at FROM workspaces WHERE user_id = ?").bind(user.userId).first<{data:string;revision:number;updated_at:string}>();

 return response({state: row ? JSON.parse(row.data) : null, revision: row?.revision ?? 0, updatedAt: row?.updated_at ?? null});

}

export async function PUT(request: Request) {

 const user = await getChatGPTUser();

 if (!user) return response({error:"请先登录"},401);

 if (request.headers.get("origin") !== new URL(request.url).origin) return response({error:"请求来源无效"},403);

 const raw = await request.text();

 if (raw.length > 2000000) return response({error:"数据超过 2MB，请导出备份并精简记录"},413);

 let body;

 try { body = JSON.parse(raw); } catch {return response({error:"数据格式无效"},400);}

 const s=body.state;

 if (!Number.isSafeInteger(body.revision) || body.revision<0 || !s || !Array.isArray(s.events) || !Array.isArray(s.inboxOrder) || !s.dayOrders || !s.settings || s.events.some((e:any)=>!e || typeof e.id!=="string" || typeof e.title!=="string") || new Set(s.events.map((e:any)=>e.id)).size!==s.events.length) return response({error:"数据格式无效"},400);

 const now=new Date().toISOString();

 const result=await env.DB!.prepare(`INSERT INTO workspaces(user_id,data,revision,updated_at) SELECT ?,?,1,? WHERE ?=0 OR EXISTS(SELECT 1 FROM workspaces WHERE user_id=?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data,revision=workspaces.revision+1,updated_at=excluded.updated_at WHERE workspaces.revision=?`).bind(user.userId,JSON.stringify(s),now,body.revision,user.userId,body.revision).run();

 if (!result.meta.changes) return response({error:"数据已在其他设备更新，请合并后重试"},409);

 return response({revision:body.revision+1,updatedAt:now});

}

