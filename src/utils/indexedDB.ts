import { Project } from "@/types/project";
import { RNEFileFormat } from "./fileSystem";

const DB_NAME = "RhythmnatorDB";
const DB_VERSION = 1;
const STORE_PROJECTS = "projects";
const STORE_AUDIO = "audioFiles";

export interface AudioFileData {
    id: string; // Project ID it belongs to
    file: File | Blob;
    name: string;
}

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
                db.createObjectStore(STORE_PROJECTS, { keyPath: "id" });
            }
            if (!db.objectStoreNames.contains(STORE_AUDIO)) {
                db.createObjectStore(STORE_AUDIO, { keyPath: "id" });
            }
        };

        request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
        request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
    });
};

// Projects Store Methods
export const saveProjectToDB = async (projectData: RNEFileFormat): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_PROJECTS, "readwrite");
        const store = transaction.objectStore(STORE_PROJECTS);

        // We add an id at the root level so indexedDB can key by it, then store the rest inside
        store.put({ id: projectData.project.id, data: projectData });

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const loadProjectFromDB = async (id: string): Promise<RNEFileFormat | null> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_PROJECTS, "readonly");
        const store = transaction.objectStore(STORE_PROJECTS);
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result ? request.result.data : null);
        };
        request.onerror = () => reject(request.error);
    });
};

export const deleteProjectFromDB = async (id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_PROJECTS, STORE_AUDIO], "readwrite");

        // Delete project payload
        const projStore = transaction.objectStore(STORE_PROJECTS);
        projStore.delete(id);

        // Delete associated audio file
        const audioStore = transaction.objectStore(STORE_AUDIO);
        audioStore.delete(id);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const getAllProjectsFromDB = async (): Promise<RNEFileFormat[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_PROJECTS, "readonly");
        const store = transaction.objectStore(STORE_PROJECTS);
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result ? request.result.map(r => r.data) : []);
        };
        request.onerror = () => reject(request.error);
    });
};

// Audio files Store Methods
export const saveAudioToDB = async (projectId: string, file: File | Blob, fileName: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_AUDIO, "readwrite");
        const store = transaction.objectStore(STORE_AUDIO);

        const audioData: AudioFileData = { id: projectId, file, name: fileName };
        store.put(audioData);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const loadAudioFromDB = async (projectId: string): Promise<AudioFileData | null> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_AUDIO, "readonly");
        const store = transaction.objectStore(STORE_AUDIO);
        const request = store.get(projectId);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
};
