"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonStore = void 0;
exports.readJsonFile = readJsonFile;
exports.writeJsonFile = writeJsonFile;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_DIR = path_1.default.resolve(__dirname, "..", "..", "..", "..", "data");
function ensureDir(dir) {
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
}
function getFilePath(entity, id) {
    const dir = path_1.default.join(DATA_DIR, entity);
    ensureDir(dir);
    if (id) {
        return path_1.default.join(dir, `${id}.json`);
    }
    return dir;
}
class JsonStore {
    entity;
    constructor(entity) {
        this.entity = entity;
    }
    filePath(id) {
        return getFilePath(this.entity, id);
    }
    listDir() {
        return getFilePath(this.entity);
    }
    async findAll() {
        const dir = this.listDir();
        if (!fs_1.default.existsSync(dir))
            return [];
        const files = fs_1.default.readdirSync(dir).filter((f) => f.endsWith(".json"));
        return files
            .map((f) => {
            const content = fs_1.default.readFileSync(path_1.default.join(dir, f), "utf-8");
            return JSON.parse(content);
        })
            .sort((a, b) => {
            const ta = a.createdAt || 0;
            const tb = b.createdAt || 0;
            return ta - tb;
        });
    }
    async findById(id) {
        const fp = this.filePath(id);
        if (!fs_1.default.existsSync(fp))
            return null;
        const content = fs_1.default.readFileSync(fp, "utf-8");
        return JSON.parse(content);
    }
    async findOne(predicate) {
        const all = await this.findAll();
        return all.find(predicate) || null;
    }
    async findMany(predicate) {
        const all = await this.findAll();
        return all.filter(predicate);
    }
    async create(data) {
        const fp = this.filePath(data.id);
        fs_1.default.writeFileSync(fp, JSON.stringify(data, null, 2), "utf-8");
        return data;
    }
    async update(id, patch) {
        const existing = await this.findById(id);
        if (!existing)
            return null;
        const updated = { ...existing, ...patch, id };
        const fp = this.filePath(id);
        fs_1.default.writeFileSync(fp, JSON.stringify(updated, null, 2), "utf-8");
        return updated;
    }
    async delete(id) {
        const fp = this.filePath(id);
        if (!fs_1.default.existsSync(fp))
            return false;
        fs_1.default.unlinkSync(fp);
        return true;
    }
}
exports.JsonStore = JsonStore;
// Helper for reading/writing single JSON files (e.g. config, lookup tables)
function readJsonFile(entity, filename) {
    const dir = getFilePath(entity);
    const fp = path_1.default.join(dir, filename);
    if (!fs_1.default.existsSync(fp))
        return null;
    return JSON.parse(fs_1.default.readFileSync(fp, "utf-8"));
}
function writeJsonFile(entity, filename, data) {
    const dir = getFilePath(entity);
    fs_1.default.writeFileSync(path_1.default.join(dir, filename), JSON.stringify(data, null, 2), "utf-8");
}
//# sourceMappingURL=json-store.js.map