interface CalisthenicsCharacterProps {
  exerciseId: string;
}

// Side-profile figure, facing right. Every limb is its own <g> rotated
// around its own joint (shoulder/elbow/hip/knee) via transform-origin set to
// that joint's exact coordinate in the shared viewBox space — nested groups
// (forearm inside upper-arm, shin inside thigh) so a shoulder rotation
// carries the whole arm with it, same as a real joint chain. The outer
// .character group carries the whole-body orientation/position for each
// exercise (e.g. rotating flat for push-ups, rising for pull-ups).
export function CalisthenicsCharacter({ exerciseId }: CalisthenicsCharacterProps) {
  return (
    <svg viewBox="0 0 200 220" className={`h-full w-full overflow-visible stage stage--${exerciseId}`}>
      <ellipse
        cx="115"
        cy="206"
        rx="55"
        ry="6"
        fill="currentColor"
        className="prop-ground text-black/10 dark:text-black/30"
      />
      <rect x="55" y="10" width="130" height="9" rx="4.5" className="prop-bar" fill="#4b5563" />
      <rect x="135" y="150" width="55" height="11" rx="4" className="prop-bench" fill="#78716c" />

      <g className={`char char--${exerciseId}`}>
        {/* back leg */}
        <g className="leg-back" style={{ transformOrigin: '115px 115px' }}>
          <line x1="115" y1="115" x2="110" y2="155" stroke="#166534" strokeWidth="15" strokeLinecap="round" />
          <g className="shin-back" style={{ transformOrigin: '110px 155px' }}>
            <line x1="110" y1="155" x2="104" y2="195" stroke="#166534" strokeWidth="13" strokeLinecap="round" />
            <ellipse cx="100" cy="197" rx="9" ry="5" fill="#0f172a" />
          </g>
        </g>

        {/* back arm (painted before torso so the shoulder joint tucks behind it) */}
        <g className="arm-back" style={{ transformOrigin: '113px 72px' }}>
          <line x1="113" y1="72" x2="98" y2="96" stroke="#166534" strokeWidth="12" strokeLinecap="round" />
          <g className="forearm-back" style={{ transformOrigin: '98px 96px' }}>
            <line x1="98" y1="96" x2="92" y2="120" stroke="#166534" strokeWidth="11" strokeLinecap="round" />
          </g>
        </g>

        {/* neck */}
        <rect x="112" y="50" width="16" height="12" fill="#22C55E" />

        {/* torso */}
        <rect x="98" y="58" width="34" height="62" rx="10" fill="#22C55E" />

        {/* shorts */}
        <rect x="99" y="104" width="32" height="20" rx="8" fill="#F59E0B" />

        {/* front leg */}
        <g className="leg-front" style={{ transformOrigin: '115px 115px' }}>
          <line x1="115" y1="115" x2="122" y2="155" stroke="#22C55E" strokeWidth="16" strokeLinecap="round" />
          <g className="shin-front" style={{ transformOrigin: '122px 155px' }}>
            <line x1="122" y1="155" x2="129" y2="195" stroke="#22C55E" strokeWidth="14" strokeLinecap="round" />
            <ellipse cx="133" cy="197" rx="10" ry="5" fill="#111827" />
          </g>
        </g>

        {/* front arm */}
        <g className="arm-front" style={{ transformOrigin: '124px 65px' }}>
          <line x1="124" y1="65" x2="146" y2="88" stroke="#16A34A" strokeWidth="13" strokeLinecap="round" />
          <g className="forearm-front" style={{ transformOrigin: '146px 88px' }}>
            <line x1="146" y1="88" x2="152" y2="116" stroke="#16A34A" strokeWidth="12" strokeLinecap="round" />
            <circle cx="153" cy="120" r="6.5" fill="#F4B183" />
          </g>
        </g>

        {/* head */}
        <g className="head" style={{ transformOrigin: '124px 65px' }}>
          <circle cx="128" cy="38" r="17" fill="#F4B183" />
          <path d="M111 33 Q128 12 145 33 Q145 22 128 20 Q111 22 111 33 Z" fill="#2b2118" />
        </g>
      </g>
    </svg>
  );
}
