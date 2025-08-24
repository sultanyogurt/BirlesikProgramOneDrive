
export interface RecordItem { id?: string; createdAt?: number; [k: string]: any }
export interface Paths { baseDataDir: string; jsonDB: string; sqliteDB: string; configPath: string; appRoot: string; }

declare global {
  interface Window {
    birlesikAPI: {
      list(): Promise<RecordItem[]>;
      add(rec: RecordItem): Promise<RecordItem>;
      update(rec: RecordItem): Promise<RecordItem>;
      remove(id: string): Promise<boolean>;
      sysPaths(): Promise<Paths>;
    }
  }
}
export {};
