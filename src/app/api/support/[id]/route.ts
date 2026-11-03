import { supportDetail, updateSupport } from "@/lib/support";
type Context = { params: Promise<{ id: string }> };
export const GET = async (request: Request, context: Context) => supportDetail(request, (await context.params).id);
export const PATCH = async (request: Request, context: Context) => updateSupport(request, (await context.params).id);
