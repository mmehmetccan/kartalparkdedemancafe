import { useId } from 'react';

const TurkishFlag = () => (
  <svg viewBox="0 0 24 16" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <rect width="24" height="16" fill="#e30a17" />
    <circle cx="9.3" cy="8" r="4" fill="#fff" />
    <circle cx="10.7" cy="8" r="3.2" fill="#e30a17" />
    <path
      d="M16 5.3 16.65 7.11 18.57 7.17 17.05 8.34 17.59 10.18 16 9.1 14.41 10.18 14.95 8.34 13.43 7.17 15.35 7.11Z"
      fill="#fff"
    />
  </svg>
);

const BritishFlag = () => {
  const clipId = useId();

  return (
    <svg viewBox="0 0 60 30" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <clipPath id={clipId}>
        <path d="M30,15h30v15zv15H0zH0V0zV0h30z" />
      </clipPath>
      <path d="M0,0v30h60V0z" fill="#012169" />
      <path d="M0,0 60,30M60,0 0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 60,30M60,0 0,30" clipPath={`url(#${clipId})`} stroke="#c8102e" strokeWidth="4" />
      <path d="M30,0v30M0,15h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0v30M0,15h60" stroke="#c8102e" strokeWidth="6" />
    </svg>
  );
};

const GermanFlag = () => (
  <svg viewBox="0 0 5 3" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <rect width="5" height="3" fill="#000" />
    <rect width="5" height="2" y="1" fill="#d00" />
    <rect width="5" height="1" y="2" fill="#ffce00" />
  </svg>
);

const SaudiFlag = () => (
  <svg viewBox="0 0 24 16" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <rect width="24" height="16" fill="#0f6e36" />
    <g fill="none" stroke="#fff" strokeLinecap="round">
      <path
        d="M4.4 6.5c1-1.2 1.6.9 2.6-.2M8.6 6.2v1.4M10.1 5.6c.9 1.5 1.5-.6 2.4.8M13.9 5.3v2.1M15.7 6.5c1.1-1.3 1.7 1 2.9-.3"
        strokeWidth="1"
      />
      <path d="M4.6 11h12.9" strokeWidth="1.1" />
      <path d="M17.5 11c1.3-.9 1.9.2 1.9.2" strokeWidth="1.1" />
    </g>
  </svg>
);

const RussianFlag = () => (
  <svg viewBox="0 0 9 6" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <rect width="9" height="6" fill="#fff" />
    <rect width="9" height="4" y="2" fill="#0039a6" />
    <rect width="9" height="2" y="4" fill="#d52b1e" />
  </svg>
);

const FLAGS = {
  tr: TurkishFlag,
  en: BritishFlag,
  de: GermanFlag,
  ar: SaudiFlag,
  ru: RussianFlag,
};

const FlagIcon = ({ language }) => {
  const Flag = FLAGS[language];
  return Flag ? <Flag /> : null;
};

export default FlagIcon;
