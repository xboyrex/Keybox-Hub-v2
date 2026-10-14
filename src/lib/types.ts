export interface KeyboxMeta {
  /** Short stable id derived from the SHA-256 of the file contents. */
  id: string;
  /** Original basename of the file, e.g. `keybox.xml`. */
  filename: string;
  /** Full path inside the source repo, e.g. `certs/keybox.xml`. */
  path: string;
  /** `owner/name` */
  sourceRepo: string;
  /** HTML url to the file inside GitHub. */
  sourceUrl: string;
  /** raw.githubusercontent.com url. */
  rawUrl: string;
  /** Local static path, e.g. `/keyboxes/foo-abc123-keybox.xml`. */
  localPath: string;
  /** Full SHA-256 hex digest. */
  sha256: string;
  /** Byte size of the file. */
  size: number;
  /** Last commit date touching this file (ISO 8601) or repo pushed_at fallback. */
  lastCommit: string;
  /** When Keybox Hub first saw this file (ISO 8601). */
  discoveredAt: string;
  /** Basic structural validation passed (Keybox + Key + DeviceID). */
  verified: boolean;
  /** Rough XML validity — the file parses with a balanced tag check. */
  xmlValid: boolean;
}

export interface SourceRepo {
  repo: string;
  url: string;
  stars: number;
  forks: number;
  lastUpdated: string;
  keyboxCount: number;
  description: string | null;
}

export interface KeyboxIndex {
  generatedAt: string;
  totalKeyboxes: number;
  totalSources: number;
  keyboxes: KeyboxMeta[];
  sources: SourceRepo[];
}

/** Shape written by fetch-keyboxes.ts, consumed by generate-index.ts */
export interface Manifest {
  generatedAt: string;
  keyboxes: KeyboxMeta[];
}

export type FilterId = 'all' | 'new' | 'updated' | 'verified';

export interface FilterOption {
  id: FilterId;
  label: string;
  hint: string;
}
