import { LegalPageLayout, LegalSection, LegalList } from '@/components/LegalPageLayout';

export function TermsPage() {
  return (
    <LegalPageLayout eyebrow="Legal" title="Terms & Conditions" lastUpdated="12 August 2026">
      <LegalSection title="Acceptance of terms">
        <p>
          By accessing or using Born to Fire, you agree to these terms. If you do not agree,
          please do not use the site.
        </p>
      </LegalSection>

      <LegalSection title="Our service">
        <p>Born to Fire provides:</p>
        <LegalList
          items={[
            'Free calisthenics programs, an exercise guide, articles, and fitness tools.',
            'Community features — group chat, posts, direct messages, and friend connections.',
            'Paid programs and memberships, which are registration-based expressions of interest, not a live checkout — see "Payments" below.',
            'AI-assisted features — a chat assistant, a food-to-protein estimator, and an article translator — that generate responses automatically and may occasionally be inaccurate.',
          ]}
        />
      </LegalSection>

      <LegalSection title="Fitness and health disclaimer">
        <p>
          <strong className="text-gray-900 dark:text-white">
            Born to Fire is not a medical service, and nothing on this site is medical advice.
          </strong>{' '}
          Consult a doctor before starting any exercise program, especially if you have an
          existing health condition, injury, or are new to physical training. You are responsible
          for exercising within your own limits. Born to Fire is not liable for any injury or harm
          resulting from your use of the programs, exercises, or events described on this site.
        </p>
      </LegalSection>

      <LegalSection title="Accounts">
        <p>
          You need an account (via our authentication provider, Clerk) to enroll in programs or
          events, post in the community, or join a membership. You are responsible for keeping
          your account secure and for anything that happens under it. Youth-oriented programs and
          memberships should be set up and supervised by a parent or guardian.
        </p>
      </LegalSection>

      <LegalSection title="Community content and conduct">
        <p>
          You keep ownership of anything you post — messages, posts, comments, and images — but by
          posting it, you give Born to Fire permission to display it back to you and other members
          as part of the site's normal operation.
        </p>
        <p>When using community features, you agree not to:</p>
        <LegalList
          items={[
            'Post anything abusive, harassing, hateful, or illegal.',
            'Impersonate another person or misrepresent your identity.',
            'Share another person\'s private information without their consent.',
            'Spam, advertise unrelated products/services, or attempt to scrape or misuse other members\' data.',
          ]}
        />
        <p>
          We reserve the right to remove content or restrict access for anyone who violates these
          terms.
        </p>
      </LegalSection>

      <LegalSection title="Payments and memberships">
        <p>
          Born to Fire does not currently process real payments. Prices shown for programs, plans,
          and memberships are indicative. Choosing a "payment method" only records your stated
          preference — no card, UPI, or banking details are collected or charged. Corporate
          membership pricing is negotiated separately; our team will contact you after you
          register interest.
        </p>
      </LegalSection>

      <LegalSection title="Membership IDs and family memberships">
        <p>
          Joining a membership issues you a unique Member ID. A family membership covers up to 4
          registered family members, who are recorded by name and do not need their own account. A
          Member ID is personal to you and should not be shared to impersonate or misrepresent
          another member.
        </p>
      </LegalSection>

      <LegalSection title="Intellectual property">
        <p>
          The Born to Fire name, logo, and original site content (programs, exercise guides,
          articles, and design) belong to Born to Fire. You may not copy, resell, or redistribute
          this content without permission.
        </p>
      </LegalSection>

      <LegalSection title="Third-party services">
        <p>
          Parts of the site rely on third-party services — Clerk for sign-in, Neon for data
          storage, Groq for AI features, and Google Translate for article translation. Your use of
          these features is also subject to the availability and behavior of those services, which
          are outside our control.
        </p>
      </LegalSection>

      <LegalSection title="No warranty">
        <p>
          Born to Fire is provided "as is," without warranties of any kind. We do our best to keep
          the site accurate and available, but we don't guarantee it will be error-free,
          uninterrupted, or perfectly accurate — especially for AI-generated responses and
          translations.
        </p>
      </LegalSection>

      <LegalSection title="Limitation of liability">
        <p>
          To the extent permitted by law, Born to Fire is not liable for any indirect, incidental,
          or consequential damages arising from your use of the site, including but not limited to
          injury from physical training, reliance on AI-generated content, or loss of data.
        </p>
      </LegalSection>

      <LegalSection title="Termination">
        <p>
          We may suspend or terminate access for anyone who violates these terms. You may stop
          using the site or delete your account at any time.
        </p>
      </LegalSection>

      <LegalSection title="Changes to these terms">
        <p>
          We may update these terms from time to time. We'll update the "last updated" date above
          when we do — continued use of the site after a change means you accept the updated
          terms.
        </p>
      </LegalSection>

      <LegalSection title="Governing law">
        <p>These terms are governed by the laws of India.</p>
      </LegalSection>

      <LegalSection title="Contact us">
        <p>
          Questions about these terms? Reach us at{' '}
          <a href="mailto:hello@borntofire.in" className="font-semibold text-green-600 hover:underline dark:text-green-400">
            hello@borntofire.in
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
