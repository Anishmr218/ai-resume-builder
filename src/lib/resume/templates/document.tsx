import type { CSSProperties, ReactNode } from "react";
import {
  displayLink,
  formatDateRange,
  safeHref,
} from "@/lib/resume/format";
import type {
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  Resume,
} from "@/lib/resume/types";

interface ResumeDocumentProps {
  resume: Resume;
  className?: string;
  /** Show friendly placeholders in the editor preview. Never used for export. */
  showPlaceholder?: boolean;
}

function hasText(value: string | undefined | null): boolean {
  return Boolean(value?.trim());
}

function isExperienceFilled(entry: ExperienceEntry): boolean {
  return (
    hasText(entry.role) ||
    hasText(entry.company) ||
    hasText(entry.location) ||
    entry.highlights.some(hasText)
  );
}

function isEducationFilled(entry: EducationEntry): boolean {
  return (
    hasText(entry.school) ||
    hasText(entry.degree) ||
    hasText(entry.field) ||
    hasText(entry.details)
  );
}

function isProjectFilled(entry: ProjectEntry): boolean {
  return hasText(entry.name) || hasText(entry.link) || hasText(entry.description);
}

function ContactLink({ value }: { value: string }) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const href = safeHref(trimmed);
  const label = displayLink(trimmed);
  if (!href) return <span>{label}</span>;
  return (
    <a className="resume-link" href={href} rel="noreferrer noopener">
      {label}
    </a>
  );
}

function ContactLine({ resume }: { resume: Resume }) {
  const items: ReactNode[] = [];

  const add = (key: string, node: ReactNode) => {
    if (items.length > 0) {
      items.push(
        <span key={`sep-${key}`} className="resume-sep" aria-hidden="true">
          ·
        </span>,
      );
    }
    items.push(<span key={key}>{node}</span>);
  };

  if (hasText(resume.email)) add("email", resume.email.trim());
  if (hasText(resume.phone)) add("phone", resume.phone.trim());
  if (hasText(resume.location)) add("location", resume.location.trim());
  if (hasText(resume.website)) {
    add("website", <ContactLink value={resume.website} />);
  }
  if (hasText(resume.linkedin)) {
    add("linkedin", <ContactLink value={resume.linkedin} />);
  }

  if (items.length === 0) return null;
  return <p className="resume-contact">{items}</p>;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="resume-section">
      <h2 className="resume-section-title">{title}</h2>
      <div className="resume-section-body">{children}</div>
    </section>
  );
}

function ExperienceItem({ entry }: { entry: ExperienceEntry }) {
  const date = formatDateRange(entry.startDate, entry.endDate, entry.current);
  const highlights = entry.highlights
    .map((highlight) => highlight.trim())
    .filter(Boolean);

  return (
    <article className="resume-entry">
      <div className="resume-entry-top">
        <div>
          <h3 className="resume-entry-heading">
            {entry.role.trim() || "Role"}
            {entry.role.trim() && entry.company.trim() ? (
              <span className="resume-sep" aria-hidden="true">
                ·
              </span>
            ) : null}
            {entry.company.trim() ? (
              <span className="resume-company">{entry.company.trim()}</span>
            ) : null}
          </h3>
          {entry.location.trim() ? (
            <p className="resume-meta">{entry.location.trim()}</p>
          ) : null}
        </div>
        {date ? <p className="resume-date">{date}</p> : null}
      </div>
      {highlights.length > 0 ? (
        <ul className="resume-highlights">
          {highlights.map((highlight, index) => (
            <li key={`${entry.id}-highlight-${index}`}>{highlight}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function EducationItem({ entry }: { entry: EducationEntry }) {
  const date = formatDateRange(entry.startDate, entry.endDate, entry.current);
  const degree = [entry.degree.trim(), entry.field.trim()]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="resume-education-item">
      <div className="resume-entry-top">
        <div>
          <h3 className="resume-education-school">
            {entry.school.trim() || "School"}
          </h3>
          {degree ? (
            <p className="resume-education-degree">{degree}</p>
          ) : null}
          {entry.location.trim() ? (
            <p className="resume-meta">{entry.location.trim()}</p>
          ) : null}
        </div>
        {date ? <p className="resume-date">{date}</p> : null}
      </div>
      {entry.details.trim() ? (
        <p className="resume-education-details">{entry.details.trim()}</p>
      ) : null}
    </article>
  );
}

function ProjectItem({ entry }: { entry: ProjectEntry }) {
  const href = safeHref(entry.link);

  return (
    <article className="resume-project">
      <h3 className="resume-project-name">
        {entry.name.trim() || "Project"}
        {hasText(entry.link) ? (
          <>
            <span className="resume-sep" aria-hidden="true">
              ·
            </span>
            <span className="resume-project-link">
              {href ? (
                <a className="resume-link" href={href} rel="noreferrer noopener">
                  {displayLink(entry.link)}
                </a>
              ) : (
                displayLink(entry.link)
              )}
            </span>
          </>
        ) : null}
      </h3>
      {entry.description.trim() ? (
        <p className="resume-project-description">
          {entry.description.trim()}
        </p>
      ) : null}
    </article>
  );
}

export function ResumeDocument({
  resume,
  className = "",
  showPlaceholder = false,
}: ResumeDocumentProps) {
  const experience = resume.experience.filter(isExperienceFilled);
  const education = resume.education.filter(isEducationFilled);
  const projects = resume.projects.filter(isProjectFilled);
  const skills = resume.skills.map((skill) => skill.trim()).filter(Boolean);
  const hasContact =
    hasText(resume.email) ||
    hasText(resume.phone) ||
    hasText(resume.location) ||
    hasText(resume.website) ||
    hasText(resume.linkedin);

  const style = { "--accent": resume.accent } as CSSProperties;

  return (
    <article
      className={`resume resume--${resume.template} ${className}`.trim()}
      style={style}
      aria-label={`${resume.fullName || "Resume"} — ${resume.template} template`}
    >
      <header className="resume-header">
        {resume.fullName.trim() || showPlaceholder ? (
          <h1 className="resume-name">
            {resume.fullName.trim() || "Your Name"}
          </h1>
        ) : null}
        {resume.headline.trim() ? (
          <p className="resume-headline">{resume.headline.trim()}</p>
        ) : null}
        {hasContact ? <ContactLine resume={resume} /> : null}
      </header>
      {resume.template === "executive" ? <div className="resume-rule" /> : null}

      {resume.summary.trim() ? (
        <Section title="Summary">
          <p className="resume-summary">{resume.summary.trim()}</p>
        </Section>
      ) : null}

      {experience.length > 0 ? (
        <Section title="Experience">
          {experience.map((entry) => (
            <ExperienceItem key={entry.id} entry={entry} />
          ))}
        </Section>
      ) : null}

      {education.length > 0 ? (
        <Section title="Education">
          {education.map((entry) => (
            <EducationItem key={entry.id} entry={entry} />
          ))}
        </Section>
      ) : null}

      {projects.length > 0 ? (
        <Section title="Projects">
          {projects.map((entry) => (
            <ProjectItem key={entry.id} entry={entry} />
          ))}
        </Section>
      ) : null}

      {skills.length > 0 ? (
        <Section title="Skills">
          <ul className="resume-skills">
            {skills.map((skill, index) => (
              <li key={`${skill}-${index}`}>{skill}</li>
            ))}
          </ul>
        </Section>
      ) : null}
    </article>
  );
}
