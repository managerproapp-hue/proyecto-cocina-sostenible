export interface Zone {
    id: number;
    name: string;
    territory: string;
    concept: string;
    description: string;
    ingredients: string[];
    emoji: string;
}

export interface TeamMember {
    id: string;
    name: string;
    role: string;
    avatarInitials: string;
}

export interface Task {
    id: number;
    title: string;
    description: string;
    deliverableHint: string;
    assignedToId: string | null;
    content: string;
    completed: boolean;
}

export interface ProjectConfig {
    id?: string;
    teamName: string;
    selectedZone: Zone | null;
    zoneJustification: string;
    members: TeamMember[];
    tasks: Task[];
    createdAt?: string;
    updatedAt?: string;
}
