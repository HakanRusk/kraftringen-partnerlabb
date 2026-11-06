import { customerApproval } from '../server/customer-approval.mjs';
import { sendOrderMail } from '../server/order-mail.mjs';
import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";

const worker = {
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    const path = new URL(request.url).pathname;
    if ((env as any).CUSTOMER_SITE === 'true') {
      if(path === '/api/internal/approval' || path === '/api/customer-approval') return customerApproval(request,env);
      if(!['/','/customer-approval.html','/customer-approval.js','/customer-approval.css'].includes(path))return new Response('Not found',{status:404});
      if(path === '/')return env.ASSETS.fetch(new Request(new URL('/customer-approval.html',request.url),request));
      return env.ASSETS.fetch(request);
    }
    if(path === '/api/order-approval') {
      const url = new URL(request.url);
      if(request.method !== 'GET')return new Response('Method not allowed',{status:405});
      if(!(env as any).CUSTOMER_ORIGIN)return Response.json({error:'Kundflödet är ännu inte aktiverat.'},{status:503});
      return fetch((env as any).CUSTOMER_ORIGIN+'/api/internal/approval?id='+encodeURIComponent(url.searchParams.get('id')||''),{headers:{Authorization:'Bearer '+(env as any).APPROVAL_SECRET}});
    }
    if (new URL(request.url).pathname === '/api/order-mail') return sendOrderMail(request, env);
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    return runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx));
  },
};

export default worker;
