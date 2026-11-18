import { registrationError, startRegistration } from "@/lib/pending-registration";

export async function POST(request: Request) {
  try {
    return await startRegistration(await request.json());
  } catch (error) {
    return registrationError(error);
  }
}
