import {Project, ProjectStatus} from "../models/project";

type Listener<T> = (item: T[]) => void;

class State<T> {
	protected listeners: Listener<T>[] = [];

	addListeners(listenerFn: Listener<T>) {
		this.listeners.push(listenerFn);
	}
}

export class ProjectState extends State<Project> {
	private projects: Project[] = [];
	private static instance: ProjectState;

	private constructor() {
		super();
	}

	static getInstance() {
		if (this.instance) {
			return this.instance;
		}
		this.instance = new ProjectState();
		return this.instance;
	}

	private updateListeners() {
		for (const listenerFn of this.listeners) {
			listenerFn(this.projects.slice());
		}
	}

	addProject(title: string, description: string, numberOfPeople: number) {
		const newProject = new Project(Date.now() + Math.random().toString(), title, description, numberOfPeople, ProjectStatus.Active)
		this.projects.push(newProject);
		this.updateListeners();
	}

	moveProject(projectId: string, newStatus: ProjectStatus) {
		const project = this.projects.find(item => item.id === projectId);
		if (project && project.status !== newStatus) {
			project.status = newStatus;
			this.updateListeners();
		}
	}

}

export const projectState = ProjectState.getInstance();