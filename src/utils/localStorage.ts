import { Project } from "@/types/project";

const STORAGE_KEY = "rhythmnator_projects";

// Interface for locally stored project metadata
export interface ProjectMetadata {
  id: string;
  name: string;
  filePath?: string;
  createdAt: string;
  updatedAt: string;
}

export const getProjectsMetadata = (): ProjectMetadata[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error loading projects metadata:", error);
    return [];
  }
};

export const saveProjectsMetadata = (projects: ProjectMetadata[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error("Error saving projects metadata:", error);
  }
};

export const addProjectMetadata = (project: Project): void => {
  const metadata: ProjectMetadata = {
    id: project.id,
    name: project.name,
    filePath: project.filePath,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
  
  const projects = getProjectsMetadata();
  const existingIndex = projects.findIndex(p => p.id === project.id);
  
  if (existingIndex !== -1) {
    projects[existingIndex] = metadata;
  } else {
    projects.push(metadata);
  }
  
  saveProjectsMetadata(projects);
};

export const updateProjectMetadata = (id: string, updates: Partial<ProjectMetadata>): void => {
  const projects = getProjectsMetadata();
  const index = projects.findIndex((p) => p.id === id);
  
  if (index !== -1) {
    projects[index] = {
      ...projects[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveProjectsMetadata(projects);
  }
};

export const deleteProjectMetadata = (id: string): void => {
  const projects = getProjectsMetadata();
  const filtered = projects.filter((p) => p.id !== id);
  saveProjectsMetadata(filtered);
};

// Compatibility functions for the old system
export const getProjects = (): Project[] => {
  const metadata = getProjectsMetadata();
  return metadata.map(meta => ({
    id: meta.id,
    name: meta.name,
    createdAt: meta.createdAt,
    updatedAt: meta.updatedAt,
    filePath: meta.filePath,
  }));
};

export const saveProjects = (projects: Project[]): void => {
  const metadata = projects.map(project => ({
    id: project.id,
    name: project.name,
    filePath: project.filePath,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  }));
  saveProjectsMetadata(metadata);
};

export const createProject = (
  name: string,
  projectFolder?: string,
  musicPath?: string,
  musicFileName?: string
): Project => {
  const newProject: Project = {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    projectPath: projectFolder,
    musicPath: musicPath,
    musicFileName: musicFileName,
  };
  
  addProjectMetadata(newProject);
  return newProject;
};

export const updateProject = (id: string, updates: Partial<Project>): void => {
  updateProjectMetadata(id, updates);
};

export const deleteProject = (id: string): void => {
  deleteProjectMetadata(id);
};
