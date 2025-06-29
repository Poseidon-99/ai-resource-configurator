// src/lib/types.ts

export interface Client {
  ClientID: string;
  ClientName: string;
  PriorityLevel: string; // Ensure this matches your CSV/Excel header
  RequestedTaskIDs: string; // Ensure this matches
  GroupTag?: string; // Optional, as it might not be in every row
  AttributesJSON?: string; // Optional, JSON string
}

export interface Worker {
  WorkerID: string;
  WorkerName: string;
  Skills: string; // Comma-separated tags
  AvailableSlots: string; // E.g., "1,3,5" or "[1,3,5]" - handle parsing as needed
  MaxLoadPerPhase: string;
  WorkerGroup: string;
  QualificationLevel: string;
}

export interface Task {
  TaskID: string;
  TaskName: string;
  Category: string;
  Duration: string; // Number of phases
  RequiredSkills: string; // Comma-separated tags
  PreferredPhases: string; // E.g., "1-3" or "[2,4,5]" - handle parsing as needed
  MaxConcurrent: string;
}

export interface ValidationError {
  row: number;
  column: string;
  message: string;
  type: 'error' | 'warning';
}

export interface Rule {
  id: string;
  type: string;
  description: string;
  // Add other rule properties as needed, e.g., conditions, actions
}

export interface Priority {
  id: string;
  name: string;
  weight: number;
  description?: string;
}