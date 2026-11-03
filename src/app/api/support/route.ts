import { listSupport, createSupport } from "@/lib/support";
export const GET = (request: Request) => listSupport(request);
export const POST = createSupport;
