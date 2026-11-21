"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button, inputClass } from "./ui";
import { BrandMark } from "./Sidebar";
import { Icon } from "./icons";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Sign-in by emailed code: enter an email, then the six-digit code. This is the interface only;
 * the backend sends and checks the code, so for now any six digits open the workspace.
 */
export function SignIn() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  const sendCode = () => {
    if (!EMAIL.test(email.trim())) {
      setError("Enter the email address you coach with.");
      return;
    }
    setError("");
    setStep("code");
    requestAnimationFrame(() => boxes.current[0]?.focus());
  };

  const setDigit = (i: number, v: string) => {
    const digits = v.replace(/\D/g, "");
    if (digits.length > 1) {
      // A pasted code fills every box at once.
      const next = digits.slice(0, 6).split("");
      setCode((c) => c.map((_, k) => next[k] ?? ""));
      boxes.current[Math.min(5, next.length)]?.focus();
      return;
    }
    setCode((c) => c.map((d, k) => (k === i ? digits : d)));
    if (digits && i < 5) boxes.current[i + 1]?.focus();
  };

  const verify = () => {
    if (code.join("").length !== 6) {
      setError("Enter all six digits from the email.");
      return;
    }
    router.push("/coach/today");
  };

  return (
    <main className="grid min-h-screen grid-cols-1 bg-bg lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-nav p-12 text-navText lg:flex">
        <div className="flex items-center gap-3">
          <BrandMark size={36} />
          <span className="text-lg font-semibold">Arcwell</span>
        </div>
        <div>
          <p className="max-w-md text-3xl font-semibold leading-tight tracking-[-0.03em]">Every client, from the first message to the result they keep.</p>
          <p className="mt-4 max-w-md text-md text-navMuted">Plans you build here appear in your clients&apos; Arcwell app. Everything they log comes back to you.</p>
        </div>
        <p className="text-sm text-navFaint">Coach workspace</p>
      </section>

      <section className="grid place-items-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <BrandMark size={32} />
            <span className="text-lg font-semibold">Arcwell</span>
          </div>
          {step === "email" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendCode();
              }}
            >
              <h1 className="text-2xl font-semibold tracking-[-0.025em]">Sign in</h1>
              <p className="mt-1 text-base text-muted">We&apos;ll email you a six-digit code. No password to remember.</p>
              <label htmlFor="si-email" className="mb-1.5 mt-6 block text-sm font-medium">
                Email
              </label>
              <input
                id="si-email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "si-error" : undefined}
                className={`${inputClass} h-11`}
              />
              {error ? (
                <p id="si-error" className="mt-1.5 text-sm text-danger">
                  {error}
                </p>
              ) : null}
              <Button type="submit" className="mt-4 w-full py-2.5">
                Email me a code
              </Button>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                verify();
              }}
            >
              <h1 className="text-2xl font-semibold tracking-[-0.025em]">Check your email</h1>
              <p className="mt-1 text-base text-muted">
                We sent a code to <span className="font-medium text-ink">{email}</span>.
              </p>
              <fieldset className="mt-6">
                <legend className="mb-1.5 text-sm font-medium">Six-digit code</legend>
                <div className="flex gap-2">
                  {code.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        boxes.current[i] = el;
                      }}
                      value={d}
                      inputMode="numeric"
                      autoComplete={i === 0 ? "one-time-code" : "off"}
                      aria-label={`Digit ${i + 1}`}
                      onChange={(e) => setDigit(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !d && i > 0) boxes.current[i - 1]?.focus();
                      }}
                      className="tnum h-12 w-full rounded-lg border border-line bg-card text-center font-mono text-xl shadow-sm outline-none transition-colors duration-[120ms] ease-quiet focus:border-brand"
                    />
                  ))}
                </div>
              </fieldset>
              {error ? <p className="mt-1.5 text-sm text-danger">{error}</p> : null}
              <Button type="submit" className="mt-4 w-full py-2.5">
                Sign in
              </Button>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setCode(["", "", "", "", "", ""]);
                  setError("");
                }}
                className="mt-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
              >
                <Icon name="chevron" size={13} className="rotate-180" /> Use a different email
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
