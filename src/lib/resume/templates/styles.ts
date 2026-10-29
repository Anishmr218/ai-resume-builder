export const RESUME_FONT_SANS = "'InterVar', 'Helvetica Neue', Helvetica, Arial, sans-serif";
export const RESUME_FONT_SERIF =
  "'SourceSerifVar', 'Iowan Old Style', 'Palatino Linotype', Georgia, serif";

/**
 * Print-grade CSS shared by the live preview, the print route, and the
 * server-side PDF renderer. Everything is scoped beneath `.resume` and uses
 * semantic, single-column markup for reliable ATS parsing.
 */
export function getResumeCss(): string {
  return `
@font-face {
  font-family: 'InterVar';
  src: url('/fonts/inter-variable.woff2') format('woff2');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'SourceSerifVar';
  src: url('/fonts/source-serif-4-variable.woff2') format('woff2');
  font-weight: 200 900;
  font-style: normal;
  font-display: swap;
}

.resume {
  --resume-accent: var(--accent, #1F513E);
  box-sizing: border-box;
  position: relative;
  width: 210mm;
  min-height: 297mm;
  padding: 15mm 17mm 14mm;
  background: #ffffff;
  color: #1b1c19;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}
.resume *,
.resume *::before,
.resume *::after {
  box-sizing: border-box;
}
.resume h1,
.resume h2,
.resume h3,
.resume p,
.resume ul,
.resume li {
  margin: 0;
  padding: 0;
}
.resume a {
  color: inherit;
  text-decoration: none;
}
.resume ul {
  list-style: none;
}
.resume section {
  break-inside: auto;
}
.resume .resume-entry,
.resume .resume-education-item {
  break-inside: avoid;
}
.resume .resume-sep {
  padding: 0 0.42em;
  opacity: 0.55;
}
.resume .resume-link {
  text-decoration: none;
}

/* ─────────────────────────── Modern Minimalist ─────────────────────────── */

.resume--modern {
  font-family: ${RESUME_FONT_SANS};
  font-size: 12.2px;
  line-height: 1.5;
}
.resume--modern .resume-header {
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e4db;
}
.resume--modern .resume-name {
  color: #151613;
  font-size: 36px;
  font-weight: 620;
  line-height: 1.02;
  letter-spacing: -0.035em;
}
.resume--modern .resume-headline {
  margin-top: 7px;
  color: var(--resume-accent);
  font-size: 10.2px;
  font-weight: 660;
  letter-spacing: 0.06em;
  line-height: 1.3;
  text-transform: uppercase;
}
.resume--modern .resume-contact {
  display: block;
  margin-top: 13px;
  color: #66685f;
  font-size: 10.2px;
  line-height: 1.45;
}
.resume--modern .resume-contact .resume-sep {
  color: var(--resume-accent);
  opacity: 0.8;
}
.resume--modern .resume-section {
  margin-top: 20px;
}
.resume--modern .resume-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1a1b18;
  font-size: 9.2px;
  font-weight: 720;
  letter-spacing: 0.055em;
  line-height: 1.2;
  text-transform: uppercase;
}
.resume--modern .resume-section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e8e4db;
}
.resume--modern .resume-section-body {
  margin-top: 10px;
}
.resume--modern .resume-summary {
  color: #34362f;
  font-size: 11.8px;
  line-height: 1.62;
}
.resume--modern .resume-entry + .resume-entry {
  margin-top: 14px;
}
.resume--modern .resume-entry-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 18px;
}
.resume--modern .resume-entry-heading {
  color: #171814;
  font-size: 12.4px;
  font-weight: 660;
  line-height: 1.35;
}
.resume--modern .resume-company {
  color: #3f4d44;
  font-weight: 590;
}
.resume--modern .resume-meta {
  margin-top: 1px;
  color: #797b72;
  font-size: 9.8px;
  line-height: 1.45;
}
.resume--modern .resume-date {
  flex: none;
  color: #6d7066;
  font-size: 9.5px;
  font-variant-numeric: tabular-nums;
  font-weight: 520;
  letter-spacing: 0.01em;
  line-height: 1.4;
  white-space: nowrap;
}
.resume--modern .resume-highlights {
  margin-top: 5px;
}
.resume--modern .resume-highlights li {
  position: relative;
  padding-left: 12px;
  color: #35372f;
  font-size: 11.4px;
  line-height: 1.55;
}
.resume--modern .resume-highlights li + li {
  margin-top: 2px;
}
.resume--modern .resume-highlights li::before {
  content: '';
  position: absolute;
  top: 0.62em;
  left: 0;
  width: 3.5px;
  height: 3.5px;
  border-radius: 999px;
  background: var(--resume-accent);
  opacity: 0.7;
}
.resume--modern .resume-education-item + .resume-education-item {
  margin-top: 10px;
}
.resume--modern .resume-education-school {
  color: #171814;
  font-size: 12.2px;
  font-weight: 660;
  line-height: 1.35;
}
.resume--modern .resume-education-degree {
  color: #4e5148;
  font-size: 10.8px;
  line-height: 1.45;
}
.resume--modern .resume-education-details {
  margin-top: 2px;
  color: #6f7168;
  font-size: 9.9px;
  line-height: 1.5;
}
.resume--modern .resume-skills {
  display: flex;
  flex-wrap: wrap;
  color: #35372f;
  font-size: 10.7px;
  line-height: 1.7;
}
.resume--modern .resume-skills li {
  display: inline-flex;
  align-items: center;
}
.resume--modern .resume-skills li:not(:last-child)::after {
  content: '';
  width: 2.5px;
  height: 2.5px;
  margin: 0 8px;
  border-radius: 999px;
  background: var(--resume-accent);
  opacity: 0.65;
}
.resume--modern .resume-project + .resume-project {
  margin-top: 9px;
}
.resume--modern .resume-project-name {
  color: #171814;
  font-size: 11.5px;
  font-weight: 640;
  line-height: 1.4;
}
.resume--modern .resume-project-link {
  color: var(--resume-accent);
  font-size: 9.7px;
  font-weight: 500;
}
.resume--modern .resume-project-description {
  margin-top: 1px;
  color: #4b4d45;
  font-size: 10.7px;
  line-height: 1.55;
}
.resume--modern .resume-footer {
  margin-top: 24px;
  padding-top: 8px;
  border-top: 1px solid #eeeae2;
  color: #9a9c93;
  font-size: 8px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* ─────────────────────────── Executive Classic ─────────────────────────── */

.resume--executive {
  font-family: ${RESUME_FONT_SERIF};
  font-size: 12.7px;
  line-height: 1.52;
  color: #202019;
}
.resume--executive .resume-header {
  padding-bottom: 13px;
  border-bottom: 1px solid #c9c2b3;
  text-align: center;
}
.resume--executive .resume-name {
  color: #1b1a16;
  font-size: 38px;
  font-weight: 580;
  letter-spacing: 0.012em;
  line-height: 1.05;
}
.resume--executive .resume-headline {
  margin-top: 6px;
  color: var(--resume-accent);
  font-family: ${RESUME_FONT_SANS};
  font-size: 9.6px;
  font-weight: 650;
  letter-spacing: 0.06em;
  line-height: 1.35;
  text-transform: uppercase;
}
.resume--executive .resume-contact {
  display: block;
  margin-top: 9px;
  color: #5f5c52;
  font-family: ${RESUME_FONT_SANS};
  font-size: 9.4px;
  line-height: 1.5;
  text-align: center;
}
.resume--executive .resume-contact .resume-sep {
  color: #aaa294;
  padding: 0 0.58em;
}
.resume--executive .resume-rule {
  height: 3px;
  margin-top: 2px;
  border-top: 1px solid #c9c2b3;
  border-bottom: 1px solid #e5dfd4;
}
.resume--executive .resume-section {
  margin-top: 18px;
}
.resume--executive .resume-section-title {
  margin-bottom: 8px;
  padding-bottom: 3px;
  border-bottom: 1px solid #d8d1c4;
  color: #2e2c26;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  line-height: 1.35;
  text-transform: uppercase;
}
.resume--executive .resume-summary {
  color: #3f3d35;
  font-size: 12px;
  font-style: italic;
  line-height: 1.58;
}
.resume--executive .resume-entry + .resume-entry {
  margin-top: 12px;
}
.resume--executive .resume-entry-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 18px;
}
.resume--executive .resume-entry-heading {
  color: #1c1b17;
  font-size: 12.7px;
  font-weight: 680;
  line-height: 1.35;
}
.resume--executive .resume-company {
  font-weight: 420;
}
.resume--executive .resume-meta {
  color: #6a675d;
  font-family: ${RESUME_FONT_SANS};
  font-size: 9.4px;
  line-height: 1.45;
}
.resume--executive .resume-date {
  flex: none;
  color: #5d5a51;
  font-family: ${RESUME_FONT_SANS};
  font-size: 9px;
  font-variant-numeric: tabular-nums;
  font-weight: 480;
  letter-spacing: 0.02em;
  line-height: 1.4;
  white-space: nowrap;
}
.resume--executive .resume-highlights {
  margin-top: 4px;
}
.resume--executive .resume-highlights li {
  position: relative;
  padding-left: 13px;
  color: #3a3831;
  font-size: 11.8px;
  line-height: 1.52;
}
.resume--executive .resume-highlights li + li {
  margin-top: 1px;
}
.resume--executive .resume-highlights li::before {
  content: '—';
  position: absolute;
  left: 0;
  color: var(--resume-accent);
  font-family: ${RESUME_FONT_SANS};
  font-size: 8px;
  top: 0.4em;
}
.resume--executive .resume-education-item + .resume-education-item {
  margin-top: 8px;
}
.resume--executive .resume-education-school {
  color: #1c1b17;
  font-size: 12.4px;
  font-weight: 660;
  line-height: 1.4;
}
.resume--executive .resume-education-degree {
  color: #56534a;
  font-size: 11.2px;
  font-style: italic;
  line-height: 1.45;
}
.resume--executive .resume-education-details {
  color: #6a675d;
  font-family: ${RESUME_FONT_SANS};
  font-size: 9.4px;
  line-height: 1.5;
}
.resume--executive .resume-skills {
  color: #3c3a33;
  font-size: 11.6px;
  line-height: 1.65;
}
.resume--executive .resume-skills li {
  display: inline;
}
.resume--executive .resume-skills li:not(:last-child)::after {
  content: ', ';
}
.resume--executive .resume-project + .resume-project {
  margin-top: 8px;
}
.resume--executive .resume-project-name {
  color: #1c1b17;
  font-size: 12px;
  font-weight: 660;
  line-height: 1.4;
}
.resume--executive .resume-project-link {
  color: var(--resume-accent);
  font-family: ${RESUME_FONT_SANS};
  font-size: 9.2px;
}
.resume--executive .resume-project-description {
  color: #49473f;
  font-size: 11.4px;
  line-height: 1.5;
}
.resume--executive .resume-footer {
  margin-top: 22px;
  padding-top: 7px;
  border-top: 1px solid #e5dfd4;
  color: #918b7f;
  font-family: ${RESUME_FONT_SANS};
  font-size: 7.6px;
  letter-spacing: 0.12em;
  text-align: center;
  text-transform: uppercase;
}

/* ───────────────────────────── Print behavior ──────────────────────────── */

@page {
  size: A4;
  margin: 15mm 17mm 14mm;
}
@media print {
  html,
  body {
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
  }
  .resume {
    width: auto !important;
    min-height: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    margin: 0 !important;
  }
  .resume .resume-entry,
  .resume .resume-education-item,
  .resume .resume-section-title {
    break-inside: avoid;
  }
  .resume .resume-section {
    break-inside: auto;
  }
}
`;
}
