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

class ProjectList {
	templateElement: HTMLTemplateElement;
	hostElement: HTMLDivElement;
	element: HTMLElement;

	constructor(private type: 'active' | 'finished') {
		this.templateElement = document.getElementById('project-list')! as HTMLTemplateElement;
		this.hostElement = document.getElementById('app')! as HTMLDivElement;

		const importedNode = document.importNode(this.templateElement.content, true);
		this.element = importedNode.firstElementChild as HTMLElement;
		this.element.id = `${this.type}-projects`;
		this.attach();
		this.renderContent();
	}

	private renderContent() {
		this.element.querySelector('ul')!.id = `${this.type}-projects-list`;
		this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + 'PROJECTS'
	}

	private attach() {
		this.hostElement.insertAdjacentElement('beforeend', this.element)
	}
}

class ProjectInput {
	templateElement: HTMLTemplateElement;
	hostElement: HTMLDivElement;
	element: HTMLElement;
	titleInput: HTMLInputElement;
	descriptionInput: HTMLInputElement;
	peopleInput: HTMLInputElement;

	constructor() {
		this.templateElement = document.getElementById('project-input')! as HTMLTemplateElement;
		this.hostElement = document.getElementById('app')! as HTMLDivElement;

		const importedNode = document.importNode(this.templateElement.content, true);
		this.element = importedNode.firstElementChild as HTMLFormElement;
		this.element.id = 'user-input'

		this.titleInput = this.element.querySelector('#title') as HTMLInputElement;
		this.descriptionInput = this.element.querySelector('#description') as HTMLInputElement;
		this.peopleInput = this.element.querySelector('#people') as HTMLInputElement;

		this.configure();
		this.attach();
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
			console.log(title, desc, people);
			this.clearInputs();
		}
	}

	private configure() {
		this.element.addEventListener('submit', this.submitHandler);
	}

	private attach() {
		this.hostElement.insertAdjacentElement('afterbegin', this.element)
	}
}

const project = new ProjectInput();
const activeProjectList = new ProjectList('active');
const finishedProjectList = new ProjectList('finished');