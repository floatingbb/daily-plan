import html from "./document";
import { getChatGPTUser, chatGPTSignInPath } from "../chatgpt-auth";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
 const user=await getChatGPTUser();
 if (!user) return Response.redirect(new URL(chatGPTSignInPath("/workbench"),request.url),302);
 const identity=JSON.stringify({userId:user.userId,email:user.email}).replace(/</g,"\\u003c");
 return new Response(html.replace("/*IDENTITY*/null",identity),{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
}
