import { auth } from "../../../lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AnalyzeClient from "./AnalyzeClient";


export default async function AnalyzePage() {
  const session = await auth.api.getSession({ 
    headers: await headers() 
  });

  if (!session) {
    redirect("/signin");
  }
 return <AnalyzeClient user={session.user} />;
}