import { randomUUID } from "node:crypto";
import type { Pool, PoolClient, QueryResultRow } from "pg";
import type {
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  Resume,
  ResumeContent,
  ResumeSummary,
  TemplateId,
  User,
} from "@/lib/resume/types";
import type { CreateWorkspaceInput, WorkspaceStore } from "./types";

type Queryable = Pick<Pool | PoolClient, "query">;

interface ResumeRow extends QueryResultRow {
  id: string;
  title: string;
  template: TemplateId;
  accent_color: string;
  full_name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  summary: string;
  created_at: Date;
  updated_at: Date;
}

interface UserRow extends QueryResultRow {
  id: string;
  email: string;
  full_name: string;
  avatar_key: string | null;
}

interface ExperienceRow extends QueryResultRow {
  id: string;
  role: string;
  company: string;
  location: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  highlights: string[];
}

interface EducationRow extends QueryResultRow {
  id: string;
  school: string;
  degree: string;
  field_of_study: string;
  location: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  details: string;
}

interface ProjectRow extends QueryResultRow {
  id: string;
  name: string;
  link: string;
  description: string;
}

interface SkillRow extends QueryResultRow {
  name: string;
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    avatarKey: row.avatar_key,
  };
}

function mapResume(
  row: ResumeRow,
  experience: ExperienceRow[],
  education: EducationRow[],
  skills: SkillRow[],
  projects: ProjectRow[],
): Resume {
  return {
    id: row.id,
    title: row.title,
    template: row.template,
    accent: row.accent_color,
    fullName: row.full_name,
    headline: row.headline,
    email: row.email,
    phone: row.phone,
    location: row.location,
    website: row.website,
    linkedin: row.linkedin,
    summary: row.summary,
    experience: experience.map(
      (entry): ExperienceEntry => ({
        id: entry.id,
        role: entry.role,
        company: entry.company,
        location: entry.location,
        startDate: entry.start_date ?? "",
        endDate: entry.end_date ?? "",
        current: entry.is_current,
        highlights: entry.highlights ?? [],
      }),
    ),
    education: education.map(
      (entry): EducationEntry => ({
        id: entry.id,
        school: entry.school,
        degree: entry.degree,
        field: entry.field_of_study,
        location: entry.location,
        startDate: entry.start_date ?? "",
        endDate: entry.end_date ?? "",
        current: entry.is_current,
        details: entry.details,
      }),
    ),
    skills: skills.map((skill) => skill.name),
    projects: projects.map(
      (project): ProjectEntry => ({
        id: project.id,
        name: project.name,
        link: project.link,
        description: project.description,
      }),
    ),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

async function loadResume(
  db: Queryable,
  resumeId: string,
  userId?: string,
): Promise<Resume | null> {
  const params = userId ? [resumeId, userId] : [resumeId];
  const where = userId ? "r.id = $1 AND r.user_id = $2" : "r.id = $1";

  const resumeResult = await db.query<ResumeRow>(
    `SELECT r.* FROM resumes r WHERE ${where} LIMIT 1`,
    params,
  );
  const row = resumeResult.rows[0];
  if (!row) return null;

  // A PoolClient cannot run concurrent queries on one connection (pg emits a
  // deprecation warning and may interleave results). Keep the four child
  // reads sequential so this helper is safe for both pools and transactions.
  const experience = await db.query<ExperienceRow>(
    `SELECT id, role, company, location, start_date, end_date, is_current, highlights
       FROM experience_entries
      WHERE resume_id = $1
      ORDER BY sort_order ASC, created_at ASC`,
    [resumeId],
  );
  const education = await db.query<EducationRow>(
    `SELECT id, school, degree, field_of_study, location, start_date, end_date,
            is_current, details
       FROM education_entries
      WHERE resume_id = $1
      ORDER BY sort_order ASC, created_at ASC`,
    [resumeId],
  );
  const skills = await db.query<SkillRow>(
    `SELECT name FROM resume_skills
      WHERE resume_id = $1
      ORDER BY sort_order ASC`,
    [resumeId],
  );
  const projects = await db.query<ProjectRow>(
    `SELECT id, name, link, description
       FROM project_entries
      WHERE resume_id = $1
      ORDER BY sort_order ASC, created_at ASC`,
    [resumeId],
  );

  return mapResume(row, experience.rows, education.rows, skills.rows, projects.rows);
}

async function insertChildren(
  db: Queryable,
  resumeId: string,
  input: Partial<ResumeContent>,
): Promise<void> {
  if (input.experience !== undefined) {
    await db.query(`DELETE FROM experience_entries WHERE resume_id = $1`, [
      resumeId,
    ]);
    for (const [index, entry] of input.experience.entries()) {
      await db.query(
        `INSERT INTO experience_entries
          (id, resume_id, role, company, location, start_date, end_date, is_current, highlights, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          entry.id,
          resumeId,
          entry.role,
          entry.company,
          entry.location,
          entry.startDate || null,
          entry.endDate || null,
          entry.current,
          entry.highlights,
          index,
        ],
      );
    }
  }

  if (input.education !== undefined) {
    await db.query(`DELETE FROM education_entries WHERE resume_id = $1`, [
      resumeId,
    ]);
    for (const [index, entry] of input.education.entries()) {
      await db.query(
        `INSERT INTO education_entries
          (id, resume_id, school, degree, field_of_study, location, start_date, end_date, is_current, details, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          entry.id,
          resumeId,
          entry.school,
          entry.degree,
          entry.field,
          entry.location,
          entry.startDate || null,
          entry.endDate || null,
          entry.current,
          entry.details,
          index,
        ],
      );
    }
  }

  if (input.skills !== undefined) {
    await db.query(`DELETE FROM resume_skills WHERE resume_id = $1`, [resumeId]);
    for (const [index, skill] of input.skills.entries()) {
      await db.query(
        `INSERT INTO resume_skills (resume_id, name, sort_order) VALUES ($1, $2, $3)`,
        [resumeId, skill, index],
      );
    }
  }

  if (input.projects !== undefined) {
    await db.query(`DELETE FROM project_entries WHERE resume_id = $1`, [
      resumeId,
    ]);
    for (const [index, project] of input.projects.entries()) {
      await db.query(
        `INSERT INTO project_entries
          (id, resume_id, name, link, description, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          project.id,
          resumeId,
          project.name,
          project.link,
          project.description,
          index,
        ],
      );
    }
  }
}

async function insertResume(
  db: Queryable,
  userId: string,
  input: ResumeContent,
): Promise<Resume> {
  const result = await db.query<{ id: string }>(
    `INSERT INTO resumes
      (user_id, title, template, accent_color, full_name, headline, email, phone,
       location, website, linkedin, summary)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING id`,
    [
      userId,
      input.title,
      input.template,
      input.accent,
      input.fullName,
      input.headline,
      input.email,
      input.phone,
      input.location,
      input.website,
      input.linkedin,
      input.summary,
    ],
  );

  const resumeId = result.rows[0]!.id;
  await insertChildren(db, resumeId, input);
  const resume = await loadResume(db, resumeId, userId);
  if (!resume) throw new Error("Resume could not be loaded after creation.");
  return resume;
}

export function createPostgresStore(pool: Pool): WorkspaceStore {
  return {
    kind: "postgres",

    async ping() {
      await pool.query("SELECT 1");
      return true;
    },

    async getUserBySession(tokenHash) {
      const result = await pool.query<UserRow>(
        `SELECT u.id, u.email, u.full_name, u.avatar_key
           FROM sessions s
           JOIN users u ON u.id = s.user_id
          WHERE s.token_hash = $1 AND s.expires_at > now()
          LIMIT 1`,
        [tokenHash],
      );
      const row = result.rows[0];
      return row ? mapUser(row) : null;
    },

    async createWorkspace({ tokenHash, expiresAt, sample }: CreateWorkspaceInput) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        const userResult = await client.query<UserRow>(
          `INSERT INTO users (email, full_name)
           VALUES ($1, $2)
           RETURNING id, email, full_name, avatar_key`,
          [
            `guest-${randomUUID()}@vellum.local`,
            sample.fullName || "Guest",
          ],
        );
        const user = mapUser(userResult.rows[0]!);

        await client.query(
          `INSERT INTO sessions (user_id, token_hash, expires_at)
           VALUES ($1, $2, $3)`,
          [user.id, tokenHash, expiresAt],
        );

        const resume = await insertResume(client, user.id, sample);

        await client.query("COMMIT");
        return { user, resume };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async getLatestResume(userId) {
      const result = await pool.query<{ id: string }>(
        `SELECT id FROM resumes
          WHERE user_id = $1
          ORDER BY updated_at DESC
          LIMIT 1`,
        [userId],
      );
      const row = result.rows[0];
      return row ? loadResume(pool, row.id, userId) : null;
    },

    async listResumes(userId) {
      const result = await pool.query<{
        id: string;
        title: string;
        template: TemplateId;
        accent_color: string;
        full_name: string;
        updated_at: Date;
      }>(
        `SELECT id, title, template, accent_color, full_name, updated_at
           FROM resumes
          WHERE user_id = $1
          ORDER BY updated_at DESC`,
        [userId],
      );
      return result.rows.map(
        (row): ResumeSummary => ({
          id: row.id,
          title: row.title,
          template: row.template,
          accent: row.accent_color,
          fullName: row.full_name,
          updatedAt: row.updated_at.toISOString(),
        }),
      );
    },

    async getResume(resumeId, userId) {
      return loadResume(pool, resumeId, userId);
    },

    async createResume(userId, input) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const resume = await insertResume(client, userId, input);
        await client.query("COMMIT");
        return resume;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async updateResume(resumeId, userId, input) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        const values: unknown[] = [];
        const sets = ["updated_at = now()"];
        const add = (column: string, value: unknown) => {
          if (value === undefined) return;
          values.push(value);
          sets.push(`${column} = $${values.length}`);
        };

        add("title", input.title);
        add("template", input.template);
        add("accent_color", input.accent);
        add("full_name", input.fullName);
        add("headline", input.headline);
        add("email", input.email);
        add("phone", input.phone);
        add("location", input.location);
        add("website", input.website);
        add("linkedin", input.linkedin);
        add("summary", input.summary);

        values.push(resumeId, userId);
        const resumeIdParam = values.length - 1;
        const userIdParam = values.length;

        const updated = await client.query(
          `UPDATE resumes
              SET ${sets.join(", ")}
            WHERE id = $${resumeIdParam} AND user_id = $${userIdParam}
            RETURNING id`,
          values,
        );

        if (updated.rowCount === 0) {
          await client.query("ROLLBACK");
          return null;
        }

        await insertChildren(client, resumeId, input);
        const resume = await loadResume(client, resumeId, userId);
        await client.query("COMMIT");
        return resume;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async deleteResume(resumeId, userId) {
      const result = await pool.query(
        `DELETE FROM resumes WHERE id = $1 AND user_id = $2`,
        [resumeId, userId],
      );
      return (result.rowCount ?? 0) > 0;
    },

    async updateUserAvatar(userId, avatarKey) {
      const result = await pool.query<UserRow>(
        `UPDATE users SET avatar_key = $2 WHERE id = $1
         RETURNING id, email, full_name, avatar_key`,
        [userId, avatarKey],
      );
      const row = result.rows[0];
      return row ? mapUser(row) : null;
    },

    async recordExport({ resumeId, storageKey, byteSize, contentType }) {
      await pool.query(
        `INSERT INTO exports (resume_id, storage_key, content_type, byte_size)
         VALUES ($1, $2, $3, $4)`,
        [resumeId, storageKey, contentType, byteSize],
      );
    },
  };
}
