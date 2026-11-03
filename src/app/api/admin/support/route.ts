import { listSupport } from "@/lib/support";
export const GET = (request: Request) => listSupport(request, true);
