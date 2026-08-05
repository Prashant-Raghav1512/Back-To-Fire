import { useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { useUser, useClerk } from '@clerk/clerk-react';
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
}: EnrollButtonProps) {
  const { user, isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSignedIn || !user) {
      openSignIn();
      return;
    }
    if (enrolled || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      await enroll({
        clerkUserId: user.id,
        userEmail: user.primaryEmailAddress?.emailAddress ?? '',
        itemType,
        itemId,
        itemTitle,
        itemDetail,
      });
      onEnrolled();
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
        disabled={submitting || enrolled}
        className={className ?? 'btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70'}
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
