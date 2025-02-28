import { AuthForm } from "@/components/auth/auth-form"

export default function AuthPage() {
  return (
    <div className="container max-w-screen-xl mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-3xl font-bold mb-8">Welcome to MediaVault</h1>
        <AuthForm />
      </div>
    </div>
  )
}