import { useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { useUser, useClerk, useAuth } from '@clerk/clerk-react';
import { enroll, type EnrollmentItemType } from '@/lib/enrollments';

interface EnrollButtonProps {
  itemType: EnrollmentItemType;
  itemId: string;
  itemTitle: string;
  itemDetail?: string;
  enrolled: boolean;
  onEnrolled: () => void;
  className?: string;
  label?: string;
  /** Blocks submission without touching the sign-in gate — e.g. a required choice (payment method) hasn't been made yet. */
  disabled?: boolean;
}

export function EnrollButton({
  itemType,
  itemId,
  itemTitle,
  itemDetail,
  enrolled,
  onEnrolled,
  className,
  label,
  disabled,
}: EnrollButtonProps) {
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const { openSignIn } = useClerk();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justEnrolled, setJustEnrolled] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSignedIn || !user) {
      openSignIn();
      return;
    }
    if (enrolled || submitting || disabled) return;

    setSubmitting(true);
    setError(null);
    try {
      await enroll(
        {
          userEmail: user.primaryEmailAddress?.emailAddress ?? '',
          itemType,
          itemId,
          itemTitle,
          itemDetail,
        },
        await getToken()
      );
      onEnrolled();
      // Brief confirmation bounce so the "Enrolled" state reads as an event
      // that just happened, not just a label that silently changed.
      setJustEnrolled(true);
      setTimeout(() => setJustEnrolled(false), 400);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={submitting || enrolled || (isSignedIn && disabled)}
        className={`${className ?? 'btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70'} ${
          justEnrolled ? 'animate-success-pop' : ''
        }`}
      >
        {enrolled ? (
          <>
            Enrolled <Check className="h-4 w-4" />
          </>
        ) : submitting ? (
          <>
            Enrolling... <Loader2 className="h-4 w-4 animate-spin" />
          </>
        ) : !isSignedIn ? (
          <>
            Sign in to join <ArrowRight className="h-4 w-4" />
          </>
        ) : (
          <>
            {label ?? "I'm interested"} <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
