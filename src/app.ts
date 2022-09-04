interface Draggable {
	dragStartHandler(event: DragEvent): void;
	dragEndHandler(event: DragEvent): void;
}

interface DragTarget {
	dragOverHandler(event: DragEvent): void;
	dropHandle(event: DragEvent): void;
	dragLeaveHandler(event: DragEvent): void;
}

enum ProjectStatus {
	Active,
	Finished
}

class Project {
	constructor(public id: string, public title: string, public description: string, public people: number, public status: ProjectStatus) {
	}
}

type Listener<T> = (item: T[]) => void;

class State<T> {
	protected listeners: Listener<T>[] = [];

	addListeners(listenerFn: Listener<T>) {
		this.listeners.push(listenerFn);
	}
}

class ProjectState extends State<Project> {
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

const projectState = ProjectState.getInstance();

interface Validatable {
	value: string | number;
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	min?: number;
	max?: number;
}

function validate(validatableInput: Validatable) {
	const {value, required, minLength, maxLength, min, max} = validatableInput
	let isValid = true;
	if (required) {
		isValid = isValid && value.toString().trim().length !== 0
	}
	if (minLength != null && typeof value === 'string') {
		isValid = isValid && value.length >= minLength
	}
	if (maxLength != null && typeof value === 'string') {
		isValid = isValid && value.length <= maxLength
	}
	if (min != null && typeof value === 'number') {
		isValid = isValid && value >= min
	}
	if (max != null && typeof value === 'number') {
		isValid = isValid && value <= max
	}
	return isValid;
}

function autobind(_: any, _2: string, descriptor: PropertyDescriptor) {
	const originalMethod = descriptor.value;
	const adjMethod: PropertyDescriptor = {
		configurable: true,
		get() {
			return originalMethod.bind(this);
		}
	};
	return adjMethod;
}

abstract class Component<T extends HTMLElement, U extends HTMLElement> {
	templateElement: HTMLTemplateElement;
	hostElement: T;
	element: U;
	protected constructor(templateId: string, hostElementId: string, insertAtStart: Boolean, newElementId?: string) {
		this.templateElement = document.getElementById(templateId)! as HTMLTemplateElement;
		this.hostElement = document.getElementById(hostElementId)! as T;
		const importedNode = document.importNode(this.templateElement.content, true);
		this.element = importedNode.firstElementChild as U;
		if (newElementId) {
			this.element.id = newElementId;
		}
		this.attach(insertAtStart);
	}

	private attach(insertAtStart: Boolean) {
		this.hostElement.insertAdjacentElement((insertAtStart ? 'afterbegin' : 'beforeend'), this.element)
	}
	abstract configure(): void;
	abstract renderContent(): void;
}

class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> implements Draggable {
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

class ProjectList extends Component<HTMLDivElement, HTMLElement> implements DragTarget {
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

class ProjectInput extends Component<HTMLDivElement, HTMLElement>{
	titleInput: HTMLInputElement;
	descriptionInput: HTMLInputElement;
	peopleInput: HTMLInputElement;

	constructor() {
		super('project-input', 'app', true, 'user-input');

		this.titleInput = this.element.querySelector('#title') as HTMLInputElement;
		this.descriptionInput = this.element.querySelector('#description') as HTMLInputElement;
		this.peopleInput = this.element.querySelector('#people') as HTMLInputElement;

		this.configure();
		this.renderContent();
	}

	configure() {
		this.element.addEventListener('submit', this.submitHandler);
	}

	renderContent() {
	}

	private gatherUserInput(): [string, string, number] | void {
		const enteredTitle = this.titleInput.value;
		const enteredDescription = this.descriptionInput.value;
		const enteredPeople = this.peopleInput.value;

		const titleValidatable = {
			value: enteredTitle,
			required: true,
		}
		const descriptionValidatable = {
			value: enteredDescription,
			required: true,
			minLength: 5,
		}
		const peopleValidatable = {
			value: enteredPeople,
			required: true,
			minLength: 1,
		}

		if (
			!validate(titleValidatable) ||
			!validate(descriptionValidatable) ||
			!validate(peopleValidatable)
		) {
			alert('Invalid input please try again');
			return;
		} else {
			return [enteredTitle, enteredDescription, +enteredPeople];
		}
	}

	private clearInputs() {
		this.titleInput.value = '';
		this.descriptionInput.value = '';
		this.peopleInput.value = '';
	}

	@autobind
	private submitHandler(event: Event) {
		event.preventDefault();
		const userInput = this.gatherUserInput();
		if (Array.isArray(userInput)) {
			const [title, desc, people] = userInput;
			projectState.addProject(title, desc, people);
			this.clearInputs();
		}
	}
}

const project = new ProjectInput();
const activeProjectList = new ProjectList('active');
const finishedProjectList = new ProjectList('finished');