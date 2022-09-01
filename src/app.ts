enum ProjectStatus {
	Active,
	Finished
}

class Project {
	constructor(public id: string, public title: string, public description: string, public people: number, public status: ProjectStatus) {
	}
}

type Listener = (item: Project[]) => void;

class ProjectState {
	private listeners: Listener[] = [];
	private projects: Project[] = [];
	private static instance: ProjectState;

	private constructor() {
	}

	static getInstance() {
		if (this.instance) {
			return this.instance;
		}
		this.instance = new ProjectState();
		return this.instance;
	}

	addListeners(listenerFn: Listener) {
		this.listeners.push(listenerFn);
	}

	addProject(title: string, description: string, numberOfPeople: number) {
		const newProject = new Project(Date.now() + Math.random().toString(), title, description, numberOfPeople, ProjectStatus.Active)
		this.projects.push(newProject);
		for (const listenerFn of this.listeners) {
			listenerFn(this.projects.slice());
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

class ProjectList extends Component<HTMLDivElement, HTMLElement>{
	assignedProjects: Project[];

	constructor(private type: 'active' | 'finished') {
		super('project-list', 'app', false, `${type}-projects` )
		this.assignedProjects = [];

		this.configure();
		this.renderContent();
	}

	configure() {
		projectState.addListeners((projects: Project[]) => {
			const relevantProjects = projects.filter(prj => {
				if (this.type === 'active') {
					return prj.status === ProjectStatus.Active
				}
				return prj.status === ProjectStatus.Finished
			})
			this.assignedProjects = relevantProjects;
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
			const listItem = document.createElement('li');
			listItem.textContent = projectItem.title;
			listEl.appendChild(listItem)
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