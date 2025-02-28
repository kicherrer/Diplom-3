"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import { Separator } from "@/components/ui/separator"
import { useTranslation } from "react-i18next"
import { AtSign, KeyRound, UserPlus, LogIn, Mail, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

const signInSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters",
  }),
});

const signUpSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const resetPasswordSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
});

type SignInFormValues = z.infer<typeof signInSchema>;
type SignUpFormValues = z.infer<typeof signUpSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function AuthForm({ mode = "signin" }: { mode?: "signin" | "signup" }) {
  const { t } = useTranslation('common')
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [forgotPassword, setForgotPassword] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [authSuccess, setAuthSuccess] = React.useState(false)

  const signInForm = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const signUpForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSignIn(data: SignInFormValues) {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (error) throw error
      
      setAuthSuccess(true)
      toast.success(t('auth.signedInSuccess'))
      
      // Redirect after a short delay to show success animation
      setTimeout(() => {
        router.push("/")
      }, 1500)
    } catch (error) {
      toast.error("Failed to sign in. Please check your credentials.")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  async function onSignUp(data: SignUpFormValues) {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.email.split('@')[0],
          }
        }
      })
      if (error) throw error
      
      setAuthSuccess(true)
      toast.success("Account created successfully! Please check your email.")
      
      // Redirect after a short delay to show success animation
      setTimeout(() => {
        router.push("/")
      }, 1500)
    } catch (error) {
      toast.error("Failed to sign up. Please try again.")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  async function onResetPassword(data: ResetPasswordFormValues) {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw error
      toast.success("Check your email for password reset instructions")
      setForgotPassword(false)
    } catch (error) {
      toast.error("Failed to send reset email")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  if (authSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-auto"
      >
        <Card className="border-green-500 dark:border-green-700 shadow-lg">
          <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">{t('auth.success')}</h2>
            <p className="text-center text-muted-foreground">
              {t('auth.authSuccess')}
            </p>
            <p className="text-center text-muted-foreground mt-1">
              {t('auth.redirecting')}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (forgotPassword) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md mx-auto"
      >
        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">{t('common.auth.resetPassword')}</CardTitle>
            <CardDescription>
              Enter your email to receive password reset instructions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...resetPasswordForm}>
              <form onSubmit={resetPasswordForm.handleSubmit(onResetPassword)} className="space-y-4">
                <FormField
                  control={resetPasswordForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Enter your email" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-1/2" 
                    onClick={() => setForgotPassword(false)}
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="w-1/2" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md mx-auto"
      >
        <Card className="border-primary/20 shadow-lg">
          <Tabs defaultValue={mode}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t('auth.signIn')}</TabsTrigger>
              <TabsTrigger value="signup">{t('auth.signUp')}</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <CardHeader>
                <CardTitle className="text-2xl">{t('auth.welcomeMessage')}</CardTitle>
                <CardDescription>
                  {t('auth.continueMessage')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...signInForm}>
                  <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4">
                    <FormField
                      control={signInForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.email')}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder={t('auth.email')} className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signInForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.password')}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Enter your password" 
                                className="pl-10 pr-10" 
                                {...field} 
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading}
                      size="lg"
                    >
                      {isLoading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {t('ui.loading')}
                        </span>
                      ) : (
                        <>
                          <LogIn className="mr-2 h-4 w-4" /> {t('auth.signIn')}
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
                <div className="mt-4 text-center">
                  <Button variant="link" onClick={() => setForgotPassword(true)}>
                    {t('auth.forgotPassword')}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  <p>
                    {t('auth.dontHaveAccount')}{" "}
                    <Button variant="link" className="p-0" onClick={() => signUpForm.reset()}>
                      {t('auth.register')}
                    </Button>
                  </p>
                </div>
              </CardContent>
            </TabsContent>
            <TabsContent value="signup">
              <CardHeader>
                <CardTitle className="text-2xl">{t('auth.joinUs')}</CardTitle>
                <CardDescription>
                  {t('auth.getStartedMessage')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...signUpForm}>
                  <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-4">
                    <FormField
                      control={signUpForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.email')}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder={t('auth.email')} className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.password')}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Enter your password" 
                                className="pl-10 pr-10" 
                                {...field} 
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.confirmPasswordLabel')}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input 
                                type={showConfirmPassword ? "text" : "password"} 
                                placeholder={t('auth.confirmPasswordPlaceholder')} 
                                className="pl-10 pr-10" 
                                {...field} 
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="text-sm text-muted-foreground">
                      <p className="flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {t('auth.passwordRequirements')}
                      </p>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading}
                      size="lg"
                    >
                      {isLoading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {t('ui.loading')}
                        </span>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" /> {t('auth.createAccount')}
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
                <div className="mt-4 text-center text-sm">
                  <p>
                    {t('auth.alreadyHaveAccount')}{" "}
                    <Button variant="link" className="p-0" onClick={() => signInForm.reset()}>
                      {t('auth.signIn')}
                    </Button>
                  </p>
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}