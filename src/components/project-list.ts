import {DragTarget} from "../models/drag-drop";
import {Component} from "./base-component";
import {autobind} from "../decorators/autobind";
import {ProjectItem} from "./project-item";
import {Project, ProjectStatus} from "../models/project";
import {projectState} from "../state/project-state";

export class ProjectList extends Component<HTMLDivElement, HTMLElement> implements DragTarget {
	assignedProjects: Project[];

	constructor(private type: 'active' | 'finished') {
		super('project-list', 'app', false, `${type}-projects` )
		this.assignedProjects = [];

		this.configure();
		this.renderContent();
	}
	@autobind
	dragLeaveHandler(_: DragEvent) {
		const listEl = this.element.querySelector('ul')!;
		listEl.classList.remove('droppable');
	}
	@autobind
	dragOverHandler(event: DragEvent) {
		if (event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
			event.preventDefault();
			const listEl = this.element.querySelector('ul')!;
			listEl.classList.add('droppable');
		}
	}

	@autobind
	dropHandle(event: DragEvent) {
		const projectId = event.dataTransfer!.getData('text/plain');
		projectState.moveProject(projectId, this.type === 'active' ? ProjectStatus.Active : ProjectStatus.Finished)
	}

	configure() {
		this.element.addEventListener('dragleave', this.dragLeaveHandler);
		this.element.addEventListener('dragover', this.dragOverHandler);
		this.element.addEventListener('drop', this.dropHandle);
		projectState.addListeners((projects: Project[]) => {
			this.assignedProjects = projects.filter(prj => {
				if (this.type === 'active') {
					return prj.status === ProjectStatus.Active
				}
				return prj.status === ProjectStatus.Finished
			});
			this.renderProjects()
		})
	}

	renderContent() {
		this.element.querySelector('ul')!.id = `${this.type}-projects-list`;
		this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + 'PROJECTS'
	}

	private renderProjects() {
		const listEl = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement;
		listEl.innerHTML = '';
		for (const projectItem of this.assignedProjects) {
			new ProjectItem(`${this.type}-projects-list`, projectItem)
		}
	}
}