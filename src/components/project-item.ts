import {Draggable} from '../models/drag-drop'
import {Component} from "./base-component";
import {autobind} from "../decorators/autobind";
import {Project} from "../models/project";

export class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> implements Draggable {
	private project: Project;

	get persons() {
		if (this.project.people === 1) {
			return '1 person assigned'
		}
		return `${this.project.people} persons assigned`
	}

	constructor(hostId: string, project: Project) {
		super('single-project', hostId, false, project.id);
		this.project = project;
		this.configure();
		this.renderContent();
	}

	@autobind
	dragStartHandler(event: DragEvent) {
		event.dataTransfer!.setData('text/plain', this.project.id);
		event.dataTransfer!.effectAllowed = 'move';
	}

	dragEndHandler(event: DragEvent) {
		console.log('dragEnd', event);
	}

	configure() {
		this.element.addEventListener('dragstart', this.dragStartHandler)
		this.element.addEventListener('dragend', this.dragEndHandler)
	}

	renderContent() {
		this.element.querySelector('h2')!.textContent = this.project.title;
		this.element.querySelector('h3')!.textContent = this.persons;
		this.element.querySelector('p')!.textContent = this.project.description;
	}
}