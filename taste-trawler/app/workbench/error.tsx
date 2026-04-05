'use client';

import { RouteErrorFallback } from '@/components/error-state';

export default function WorkbenchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorFallback error={error} reset={reset} />;
}
