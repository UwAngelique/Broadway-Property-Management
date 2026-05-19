import { AuthForm } from "@/components/auth-form";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <Link href="/" className="mb-6">
        <Image src="/broadway-logo.png" alt="Broadway" width={160} height={80} />
      </Link>
      <AuthForm />
      <p className="mt-4 text-xs text-gray-500">
        <Link href="/" className="underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}
