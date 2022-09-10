import {autobind} from "../decorators/autobind";
import {Component} from "./base-component";
import {validate, Validatable} from "../utils/validation";
import {projectState} from "../state/project-state";

export class ProjectInput extends Component<HTMLDivElement, HTMLElement>{
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

		const titleValidatable: Validatable = {
			value: enteredTitle,
			required: true,
		}
		const descriptionValidatable: Validatable = {
			value: enteredDescription,
			required: true,
			minLength: 5,
		}
		const peopleValidatable: Validatable = {
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