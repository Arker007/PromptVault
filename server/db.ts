import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;
const DATA_DIR = isVercel ? '/tmp/data' : path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'promptvault.sqlite');

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  let wasmBinary: ArrayBuffer | undefined = undefined;
  try {
    const wasmPath = path.resolve(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm');
    if (fs.existsSync(wasmPath)) {
      const buffer = fs.readFileSync(wasmPath);
      wasmBinary = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    }
  } catch (err) {
    console.warn('Could not read sql-wasm.wasm file directly:', err);
  }

  const SQL = await initSqlJs(wasmBinary ? { wasmBinary } : undefined);
  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  initSchema(dbInstance);
  saveDb();
  return dbInstance;
}

export function saveDb(): void {
  if (!dbInstance) return;
  const data = dbInstance.export();
  fs.writeFileSync(DB_FILE, Buffer.from(data));
}

function initSchema(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      preferences TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      category_id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS prompts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      category_id TEXT,
      collection_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      content TEXT NOT NULL,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      is_pinned INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      copy_count INTEGER NOT NULL DEFAULT 0,
      last_copied_at TEXT,
      last_viewed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS prompt_tags (
      prompt_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (prompt_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS prompt_versions (
      id TEXT PRIMARY KEY,
      prompt_id TEXT NOT NULL,
      version_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  try {
    db.run('ALTER TABLE prompts ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0;');
  } catch {
    // column already exists
  }

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);
    CREATE INDEX IF NOT EXISTS idx_prompts_is_pinned ON prompts(is_pinned);
    CREATE INDEX IF NOT EXISTS idx_prompts_updated_at ON prompts(updated_at);
    CREATE INDEX IF NOT EXISTS idx_prompts_last_copied_at ON prompts(last_copied_at);
    CREATE INDEX IF NOT EXISTS idx_prompts_category_id ON prompts(category_id);
    CREATE INDEX IF NOT EXISTS idx_prompts_collection_id ON prompts(collection_id);
    CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
    CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
    CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
    CREATE INDEX IF NOT EXISTS idx_prompt_tags_prompt_id ON prompt_tags(prompt_id);
    CREATE INDEX IF NOT EXISTS idx_prompt_tags_tag_id ON prompt_tags(tag_id);
    CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt_id ON prompt_versions(prompt_id);
  `);

  // Check if default user exists, if not seed
  const userCheck = db.exec("SELECT COUNT(*) as count FROM users WHERE email = 'user@promptvault.local'");
  const count = userCheck[0]?.values[0]?.[0] as number;
  if (!count || count === 0) {
    seedInitialData(db);
  } else {
    // Update legacy default name if present
    db.run("UPDATE users SET display_name = 'Vishal Sharma' WHERE display_name = 'Alex Morgan';");
  }
}

function seedInitialData(db: Database) {
  const now = new Date().toISOString();
  const userId = 'usr_default_01';
  const passwordHash = bcrypt.hashSync('vault123', 10);

  // User
  db.run(
    `INSERT INTO users (id, email, password_hash, display_name, preferences, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, 'user@promptvault.local', passwordHash, 'Vishal Sharma', JSON.stringify({ theme: 'light', defaultPageSize: 25, copyNotificationDuration: 2 }), now, now]
  );

  // Categories
  const categories = [
    { id: 'cat_dev', name: 'Development', desc: 'Software engineering, debugging, architecture, and code generation prompts' },
    { id: 'cat_write', name: 'Writing & Editorial', desc: 'Technical documentation, release notes, emails, and content drafting' },
    { id: 'cat_prod', name: 'Product Strategy', desc: 'PRDs, user stories, feature specs, and competitive teardowns' },
    { id: 'cat_research', name: 'Research & Analysis', desc: 'Deep dive synthesis, data extraction, and comparative evaluation' },
  ];

  for (const cat of categories) {
    db.run(
      `INSERT INTO categories (id, user_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [cat.id, userId, cat.name, cat.desc, now, now]
    );
  }

  // Collections
  const collections = [
    { id: 'col_review', catId: 'cat_dev', name: 'Code Review Assistant', desc: 'Standardized prompts for thorough pull request auditing' },
    { id: 'col_docs', catId: 'cat_write', name: 'Technical Docs Suite', desc: 'Prompts for generating READMEs, API docs, and changelogs' },
    { id: 'col_arch', catId: 'cat_dev', name: 'Architecture Review', desc: 'System design verification and scalability evaluation' },
    { id: 'col_growth', catId: 'cat_prod', name: 'Growth & Strategy', desc: 'Product positioning and user journey validation' },
  ];

  for (const col of collections) {
    db.run(
      `INSERT INTO collections (id, user_id, category_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [col.id, userId, col.catId, col.name, col.desc, now, now]
    );
  }

  // Tags
  const tags = [
    { id: 'tag_ts', name: 'typescript' },
    { id: 'tag_react', name: 'react' },
    { id: 'tag_security', name: 'security' },
    { id: 'tag_refactor', name: 'refactoring' },
    { id: 'tag_docs', name: 'documentation' },
    { id: 'tag_perf', name: 'performance' },
    { id: 'tag_sql', name: 'sql' },
    { id: 'tag_prod', name: 'product' },
  ];

  for (const tag of tags) {
    db.run(
      `INSERT INTO tags (id, user_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
      [tag.id, userId, tag.name, now, now]
    );
  }

  // Prompts
  const prompts = [
    {
      id: 'prm_01',
      catId: 'cat_dev',
      colId: 'col_review',
      title: 'Senior TypeScript Pull Request Auditor',
      desc: 'Conducts an exhaustive code review focusing on type safety, edge cases, and performance regressions.',
      content: `You are an expert Principal TypeScript Engineer reviewing a pull request.
Review the following code diff with extreme attention to:
1. Type safety: No 'any', strict null handling, correct discriminated unions.
2. Runtime edge cases: Undefined access, async race conditions, unhandled rejections.
3. Performance regressions: Unnecessary allocations, expensive re-renders in React hooks.
4. Security: Input sanitization, injection vectors, sensitive data leakage.

Target Language/Framework: {{framework_or_runtime}}
Pull Request Description: {{pr_summary}}

Code changes to review:
\`\`\`typescript
{{code_diff}}
\`\`\`

Format your review into:
- Summary Assessment (Approve / Request Changes / Nitpicks)
- Critical Findings (with line-by-line recommendations and proposed fixes)
- Non-blocking suggestions`,
      isFav: 1,
      isArch: 0,
      copyCount: 42,
      lastCopiedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      tags: ['tag_ts', 'tag_security', 'tag_refactor'],
    },
    {
      id: 'prm_02',
      catId: 'cat_dev',
      colId: 'col_arch',
      title: 'Database Schema & Query Optimization Advisor',
      desc: 'Analyzes relational schema designs and query execution paths for high-throughput workloads.',
      content: `Analyze the following relational database schema and queries for a high-concurrency production service.

Database Engine: {{database_engine}}
Expected Scale: {{daily_queries}} queries/day, {{dataset_size_gb}} GB dataset

Schema Definition:
\`\`\`sql
{{schema_ddl}}
\`\`\`

Critical Queries:
\`\`\`sql
{{slow_queries}}
\`\`\`

Please provide:
1. Indexing strategy recommendations (Composite indexes, partial indexes, covering indexes).
2. Normalization / denormalization tradeoffs for the stated scale.
3. Locking and concurrency hazard analysis.
4. Suggested rewritten queries with EXPLAIN ANALYZE rationale.`,
      isFav: 1,
      isArch: 0,
      copyCount: 28,
      lastCopiedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      tags: ['tag_sql', 'tag_perf'],
    },
    {
      id: 'prm_03',
      catId: 'cat_write',
      colId: 'col_docs',
      title: 'Semantic Release Notes & Changelog Generator',
      desc: 'Transforms raw commit messages and ticket IDs into polished, user-facing release notes.',
      content: `Transform the following list of git commits and pull request titles into clear, structured release notes.

Target Audience: {{audience_type}} (e.g. End Users, Developers, Internal Teams)
Release Version: {{version_number}}

Raw Commit / PR History:
\`\`\`
{{commit_log}}
\`\`\`

Guidelines:
- Categorize changes into:
  - 🚀 New Features & Enhancements
  - 🐛 Bug Fixes & Stability
  - ⚡ Performance Improvements
  - ⚠️ Breaking Changes & Deprecations (if any, with migration steps)
- Write concise, active-voice descriptions highlighting user impact rather than internal refactor details.
- Avoid developer jargon when the target audience is end users.`,
      isFav: 0,
      isArch: 0,
      copyCount: 15,
      lastCopiedAt: new Date(Date.now() - 1000 * 60 * 1440 * 2).toISOString(),
      tags: ['tag_docs'],
    },
    {
      id: 'prm_04',
      catId: 'cat_dev',
      colId: 'col_review',
      title: 'React 19 Component Refactoring & Accessibility Audit',
      desc: 'Audits React components for modern hook idioms, zero unnecessary re-renders, and WCAG AA accessibility.',
      content: `Examine the following React component for modern best practices, accessibility (WCAG 2.1 AA), and state design.

Component Code:
\`\`\`tsx
{{component_code}}
\`\`\`

Audit Criteria:
1. Accessibility: Keyboard focus management, ARIA roles, live regions, color contrast, and screen reader labels.
2. Hook Hygiene: Avoid state synchronization traps, proper memoization bounds, clean effect disposal.
3. Prop Interface: Clean, minimal props without leaky abstractions.
4. Provide the complete refactored version with explanations.`,
      isFav: 1,
      isArch: 0,
      copyCount: 35,
      lastCopiedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      tags: ['tag_react', 'tag_ts', 'tag_refactor'],
    },
    {
      id: 'prm_05',
      catId: 'cat_prod',
      colId: 'col_growth',
      title: 'Product Requirements Document (PRD) Generator',
      desc: 'Creates an enterprise-grade PRD with user problem statements, acceptance criteria, and edge cases.',
      content: `Draft a comprehensive Product Requirements Document (PRD) for the feature described below.

Feature Name: {{feature_name}}
Target Users: {{user_persona}}
Core Problem Statement: {{problem_statement}}
Success Metrics / KPIs: {{primary_metrics}}

Structure:
1. Executive Summary & Objective
2. Problem Statement & Customer Pain Points
3. Out of Scope (Non-goals)
4. User Stories & Acceptance Criteria (Given / When / Then format)
5. Technical Considerations & Data Model Impact
6. Open Questions & Risk Mitigation`,
      isFav: 0,
      isArch: 0,
      copyCount: 19,
      lastCopiedAt: new Date(Date.now() - 1000 * 60 * 1440 * 4).toISOString(),
      tags: ['tag_prod', 'tag_docs'],
    },
    {
      id: 'prm_06',
      catId: 'cat_research',
      colId: null,
      title: 'Technical Whitepaper & Architecture Teardown',
      desc: 'Synthesizes complex technical specs into executive briefings and architectural diagrams.',
      content: `Analyze the following system architecture or technical specification:

Topic/System: {{system_name}}
Source Materials:
{{source_text}}

Deliverables:
1. Executive Summary: What problem does this solve, and why now?
2. Architecture Decomposition: Core modules, data flow, failure modes.
3. Tradeoff Matrix: Latency vs. Throughput, Consistency vs. Availability, Complexity vs. Maintainability.
4. Decision Checklist for engineering leadership.`,
      isFav: 0,
      isArch: 0,
      copyCount: 8,
      lastCopiedAt: new Date(Date.now() - 1000 * 60 * 1440 * 7).toISOString(),
      tags: ['tag_docs'],
    },
    {
      id: 'prm_07',
      catId: 'cat_dev',
      colId: null,
      title: 'Legacy Python to TypeScript Migration Spec',
      desc: 'Archived template for legacy service migration.',
      content: `Step by step migration guide from Python 2.7 to modern TypeScript Node.js backend.
Legacy snippet:
\`\`\`python
{{legacy_code}}
\`\`\`
Target schema and typing:
{{target_types}}`,
      isFav: 0,
      isArch: 1,
      copyCount: 3,
      lastCopiedAt: new Date(Date.now() - 1000 * 60 * 1440 * 30).toISOString(),
      tags: ['tag_ts'],
    }
  ];

  for (const p of prompts) {
    db.run(
      `INSERT INTO prompts (id, user_id, category_id, collection_id, title, description, content, is_favorite, is_archived, copy_count, last_copied_at, last_viewed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.id, userId, p.catId, p.colId, p.title, p.desc, p.content, p.isFav, p.isArch, p.copyCount, p.lastCopiedAt, p.lastCopiedAt, now, now]
    );

    // Initial version
    db.run(
      `INSERT INTO prompt_versions (id, prompt_id, version_number, title, description, content, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [`ver_${p.id}_1`, p.id, 1, p.title, p.desc, p.content, now]
    );

    // Tags
    for (const tagId of p.tags) {
      db.run(
        `INSERT INTO prompt_tags (prompt_id, tag_id) VALUES (?, ?)`,
        [p.id, tagId]
      );
    }
  }
}
