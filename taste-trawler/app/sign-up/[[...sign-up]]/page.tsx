import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-5xl items-center justify-center px-4">
      <div className="kitsch-card relative overflow-hidden rounded-[var(--radius-2xl)] p-4">
        <div className="leopard-panel absolute inset-x-0 top-0 h-3" aria-hidden />
        <SignUp />
      </div>
    </div>
  );
}
