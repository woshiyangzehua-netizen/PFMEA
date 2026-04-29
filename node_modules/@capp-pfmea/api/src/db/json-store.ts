import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve(__dirname, "..", "..", "..", "..", "data");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getFilePath(entity: string, id?: string): string {
  const dir = path.join(DATA_DIR, entity);
  ensureDir(dir);
  if (id) {
    return path.join(dir, `${id}.json`);
  }
  return dir;
}

export class JsonStore<T extends { id: string }> {
  constructor(private entity: string) {}

  private filePath(id: string): string {
    return getFilePath(this.entity, id);
  }

  private listDir(): string {
    return getFilePath(this.entity);
  }

  async findAll(): Promise<T[]> {
    const dir = this.listDir();
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
    return files
      .map((f) => {
        const content = fs.readFileSync(path.join(dir, f), "utf-8");
        return JSON.parse(content) as T;
      })
      .sort((a, b) => {
        const ta = (a as any).createdAt || 0;
        const tb = (b as any).createdAt || 0;
        return ta - tb;
      });
  }

  async findById(id: string): Promise<T | null> {
    const fp = this.filePath(id);
    if (!fs.existsSync(fp)) return null;
    const content = fs.readFileSync(fp, "utf-8");
    return JSON.parse(content) as T;
  }

  async findOne(predicate: (item: T) => boolean): Promise<T | null> {
    const all = await this.findAll();
    return all.find(predicate) || null;
  }

  async findMany(predicate: (item: T) => boolean): Promise<T[]> {
    const all = await this.findAll();
    return all.filter(predicate);
  }

  async create(data: T): Promise<T> {
    const fp = this.filePath(data.id);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), "utf-8");
    return data;
  }

  async update(id: string, patch: Partial<T>): Promise<T | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated = { ...existing, ...patch, id };
    const fp = this.filePath(id);
    fs.writeFileSync(fp, JSON.stringify(updated, null, 2), "utf-8");
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const fp = this.filePath(id);
    if (!fs.existsSync(fp)) return false;
    fs.unlinkSync(fp);
    return true;
  }
}

// Helper for reading/writing single JSON files (e.g. config, lookup tables)
export function readJsonFile<T>(entity: string, filename: string): T | null {
  const dir = getFilePath(entity);
  const fp = path.join(dir, filename);
  if (!fs.existsSync(fp)) return null;
  return JSON.parse(fs.readFileSync(fp, "utf-8")) as T;
}

export function writeJsonFile<T>(entity: string, filename: string, data: T): void {
  const dir = getFilePath(entity);
  fs.writeFileSync(path.join(dir, filename), JSON.stringify(data, null, 2), "utf-8");
}
