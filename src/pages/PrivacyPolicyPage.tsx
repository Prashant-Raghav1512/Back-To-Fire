import { LegalPageLayout, LegalSection, LegalList } from '@/components/LegalPageLayout';

// Content here is written to genuinely reflect what this specific app does
// (see CLAUDE.md for the underlying architecture) - not generic boilerplate.
// Update it if a described practice changes, e.g. a new third-party
// service is added or an existing one is removed.
export function PrivacyPolicyPage() {
  return (
    <LegalPageLayout eyebrow="Legal" title="Privacy Policy" lastUpdated="12 August 2026">
      <LegalSection title="Overview">
        <p>
          This policy explains what information Born to Fire collects when you use this website,
          why we collect it, and the choices you have. By using the site, you agree to the
          practices described here.
        </p>
      </LegalSection>

      <LegalSection title="Information we collect">
        <p>We collect information in a few different ways, depending on how you use the site:</p>
        <LegalList
          items={[
            'Account information — when you sign in, our authentication provider (Clerk) collects your name, email address, and profile photo.',
            'Personal details you choose to share — age, height, weight, gender, and state, if you fill in your Profile or set up a Community profile.',
            'Community content — messages, posts, comments, and any images you upload in group chats, the members-only group, or direct messages.',
            'Membership details — if you join a membership, your Member ID, membership type, chosen price/payment method preference, company name (for corporate memberships), and any family members you register.',
            'Contact form and newsletter — your name, email, and message if you use the contact form, or just your email if you subscribe to updates.',
            'Location — only if you choose to use the gym branch locator, which asks your browser for your location to find the nearest branch. We never see or store this unless your browser shares it, and it is used only in that moment to sort branches by distance.',
          ]}
        />
      </LegalSection>

      <LegalSection title="How we use this information">
        <p>We use the information above to:</p>
        <LegalList
          items={[
            'Provide the features you use — your training profile, community groups, direct messages, and membership perks.',
            'Personalize what you see, like showing your state\'s community group or your enrolled programs and events on your profile.',
            'Respond to messages sent through the contact form.',
            'Send occasional updates if you subscribe to the newsletter — you can unsubscribe at any time by contacting us.',
            'Keep the community safe, including basic automated filtering of messages for obviously inappropriate language.',
          ]}
        />
      </LegalSection>

      <LegalSection title="Third-party services we use">
        <p>
          Born to Fire is built without a traditional backend server, so a few trusted third
          parties directly power parts of the site:
        </p>
        <LegalList
          items={[
            'Clerk — handles sign-in, sign-up, and account security.',
            'Neon (Postgres) — stores the data described above, such as your profile details, community posts, enrollments, and membership records.',
            'Groq — powers the AI chat assistant and the protein-estimator tool. Messages you send to these features are processed by Groq to generate a response.',
            'Google Translate — powers the optional article translator; the text of an article is sent to Google\'s translation service when you pick a language.',
          ]}
        />
        <p>Each of these providers processes data under their own privacy policy.</p>
      </LegalSection>

      <LegalSection title="Cookies and local storage">
        <p>
          Clerk sets cookies needed to keep you signed in. We also use your browser's local
          storage to remember your light/dark theme preference. We do not use advertising or
          cross-site tracking cookies.
        </p>
      </LegalSection>

      <LegalSection title="Payment information">
        <p>
          Born to Fire does not process real payments. When you choose a payment method for a
          program, plan, or membership, that choice is only recorded as a stated preference — we
          never ask for or store card numbers, UPI IDs, or other payment credentials.
        </p>
      </LegalSection>

      <LegalSection title="Children's privacy">
        <p>
          Our Youth programs and membership plans are designed for ages 8-17, but accounts are
          created and managed by the registered user. If you are creating an account or
          registering a membership for a child, please do so as their parent or guardian, and
          supervise their use of community features.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <p>You can, at any time:</p>
        <LegalList
          items={[
            'Update or remove your Personal Details from your Profile page.',
            'Delete your own community posts and comments from your Profile\'s "My Posts" section.',
            'Remove family members from a family membership, or unfriend another member.',
            'Unsubscribe from the newsletter by contacting us.',
            'Delete your account entirely from your account settings (via the profile menu), which removes your sign-in credentials with Clerk.',
          ]}
        />
        <p>
          For anything else — including asking us to delete data tied to a deleted account — email
          us at hello@borntofire.in.
        </p>
      </LegalSection>

      <LegalSection title="Data retention">
        <p>
          We keep your information for as long as your account is active or as needed to provide
          the features you have used, such as your enrollment and community history. Contact
          form submissions and newsletter subscriptions are kept until you ask us to remove them.
        </p>
      </LegalSection>

      <LegalSection title="Changes to this policy">
        <p>
          We may update this policy as the site changes. We will update the "last updated" date
          above when we do. Continuing to use the site after a change means you accept the
          updated policy.
        </p>
      </LegalSection>

      <LegalSection title="Contact us">
        <p>
          Questions about this policy or your data? Reach us at{' '}
          <a href="mailto:hello@borntofire.in" className="font-semibold text-green-600 hover:underline dark:text-green-400">
            hello@borntofire.in
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
