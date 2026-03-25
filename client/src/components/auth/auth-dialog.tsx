"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setCredentials } from "@/store/authSlice";
import {
  useLoginMutation,
  useRegisterMutation,
} from "@/store/chatApi";
import { useAppDispatch } from "@/store/index";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Required"),
});

const registerSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
  fullName: z.string().optional(),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: () => void;
};

function mutationErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "status" in err) {
    const fe = err as { status: number | string; data?: unknown };
    const d = fe.data as { error?: string } | undefined;
    if (d && typeof d.error === "string") return d.error;
    if (typeof fe.status === "number") return `Request failed (${fe.status})`;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export function AuthDialog({ open, onOpenChange, onSuccess }: Props) {
  const dispatch = useAppDispatch();
  const [mode, setMode] = React.useState<"login" | "register">("login");
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [loginMut, loginState] = useLoginMutation();
  const [registerMut, registerState] = useRegisterMutation();

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", fullName: "" },
  });

  const loading =
    mode === "login" ? loginState.isLoading : registerState.isLoading;

  React.useEffect(() => {
    if (open) return;
    setServerError(null);
    loginForm.reset({ email: "", password: "" });
    registerForm.reset({ email: "", password: "", fullName: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset form API instances when dialog closes only
  }, [open]);

  React.useEffect(() => {
    setServerError(null);
    if (mode === "login") registerForm.reset({ email: "", password: "", fullName: "" });
    else loginForm.reset({ email: "", password: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  async function onLoginSubmit(values: LoginValues) {
    setServerError(null);
    try {
      const r = await loginMut(values).unwrap();
      dispatch(
        setCredentials({
          access_token: r.access_token,
          refresh_token: r.refresh_token,
          user: r.user,
        })
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (e) {
      setServerError(mutationErrorMessage(e));
    }
  }

  async function onRegisterSubmit(values: RegisterValues) {
    setServerError(null);
    try {
      const r = await registerMut({
        email: values.email,
        password: values.password,
        fullName: values.fullName?.trim() || undefined,
      }).unwrap();
      dispatch(
        setCredentials({
          access_token: r.access_token,
          refresh_token: r.refresh_token,
          user: r.user,
        })
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (e) {
      setServerError(mutationErrorMessage(e));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{mode === "login" ? "Sign in" : "Create account"}</DialogTitle>
          <DialogDescription>
            Authenticate to keep history and remove the anonymous message cap.
          </DialogDescription>
        </DialogHeader>
        {mode === "login" ? (
          <form
            className="grid gap-3 pt-2"
            onSubmit={loginForm.handleSubmit(onLoginSubmit)}
            noValidate
          >
            <div className="grid gap-1">
              <Input
                type="email"
                placeholder="Email"
                autoComplete="email"
                aria-invalid={!!loginForm.formState.errors.email}
                {...loginForm.register("email")}
              />
              {loginForm.formState.errors.email && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="grid gap-1">
              <Input
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                aria-invalid={!!loginForm.formState.errors.password}
                {...loginForm.register("password")}
              />
              {loginForm.formState.errors.password && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>
            {serverError && (
              <p className="text-sm text-red-600 dark:text-red-400">{serverError}</p>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="submit" disabled={loading}>
                {loading ? "Please wait…" : "Sign in"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setMode("register")}
              >
                Need an account?
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form
            className="grid gap-3 pt-2"
            onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
            noValidate
          >
            <div className="grid gap-1">
              <Input
                placeholder="Display name"
                autoComplete="name"
                {...registerForm.register("fullName")}
              />
            </div>
            <div className="grid gap-1">
              <Input
                type="email"
                placeholder="Email"
                autoComplete="email"
                aria-invalid={!!registerForm.formState.errors.email}
                {...registerForm.register("email")}
              />
              {registerForm.formState.errors.email && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {registerForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="grid gap-1">
              <Input
                type="password"
                placeholder="Password"
                autoComplete="new-password"
                aria-invalid={!!registerForm.formState.errors.password}
                {...registerForm.register("password")}
              />
              {registerForm.formState.errors.password && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {registerForm.formState.errors.password.message}
                </p>
              )}
            </div>
            {serverError && (
              <p className="text-sm text-red-600 dark:text-red-400">{serverError}</p>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="submit" disabled={loading}>
                {loading ? "Please wait…" : "Register"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setMode("login")}
              >
                Already have an account?
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
