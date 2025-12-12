import { AUTOLANCER_HIGHLIGHT_CLASSES, ensureAgentStyles } from './agentStyles';

const INPUT_SELECTOR = 'input:not([type="hidden"]):not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly])';
const TEXT_INPUT_TYPES = new Set(['text', 'search', 'email', 'url', 'password', 'number', 'tel']);
const DEFAULT_AUTOFILL_TEXT = "Hello world! This is a generated response. Lerium pepsa infinite loop of knowledge...  Everything is running asynchronously and concurrently.";
const AUTOFILL_MIN_DELAY = 20;
const AUTOFILL_MAX_DELAY = 70;

const CURSOR_LOGO_SRC = 'https://www.svgrepo.com/show/306500/openai.svg';
const CURSOR_LOGO_ALT = 'Autolancer bot';

const controllers = new Map();
let mutationObserver = null;
let effectsEnabled = false;

function wait(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomBetween(min, max) {
	return Math.random() * (max - min) + min;
}

function shouldEnhanceInput(element) {
	if (!element || !(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) return false;
	if (element instanceof HTMLTextAreaElement) return true;
	const type = (element.getAttribute('type') || 'text').toLowerCase();
	return TEXT_INPUT_TYPES.has(type);
}

function ensureController(element) {
	if (!shouldEnhanceInput(element)) return;
	if (controllers.has(element)) return;
	const controller = new AutolancerInputController(element);
	controllers.set(element, controller);
}

function removeStaleControllers() {
	controllers.forEach((controller, element) => {
		if (!document.contains(element)) {
			controller.destroy();
			controllers.delete(element);
		}
	});
}

function startObserver() {
	if (mutationObserver || !document?.body) return;
	mutationObserver = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			mutation.addedNodes?.forEach((node) => {
				if (!(node instanceof Element)) return;
				if (node.matches?.(INPUT_SELECTOR)) {
					ensureController(node);
				}
				node.querySelectorAll?.(INPUT_SELECTOR).forEach((el) => ensureController(el));
			});
		});
		removeStaleControllers();
	});
	try {
		mutationObserver.observe(document.body, { childList: true, subtree: true });
	} catch (e) {
		console.error('autolancer inputEffects observer failed', e);
	}
}

function stopObserver() {
	if (mutationObserver) {
		mutationObserver.disconnect();
		mutationObserver = null;
	}
}

export function enableAutolancerInputEffects() {
	ensureAgentStyles();
	if (!document?.body) return;
	document.querySelectorAll(INPUT_SELECTOR).forEach((element) => ensureController(element));
	removeStaleControllers();
	if (!effectsEnabled) {
		startObserver();
		effectsEnabled = true;
	}
}

export function disableAutolancerInputEffects() {
	controllers.forEach((controller) => controller.destroy());
	controllers.clear();
	stopObserver();
	effectsEnabled = false;
}

class AutolancerInputController {
	constructor(inputElement) {
		this.input = inputElement;
		this.isActive = false;
		this.cursor = null;
		this.mirror = null;
		this.isGenerating = false;
		this.generationToken = null;

		this.handleFocus = this.handleFocus.bind(this);
		this.handleBlur = this.handleBlur.bind(this);
		this.handleInput = this.handleInput.bind(this);
		this.handleSelectionChange = this.handleSelectionChange.bind(this);
		this.updateCursor = this.updateCursor.bind(this);
		this.handleMenuAction = this.handleMenuAction.bind(this);
		this.startGeneration = this.startGeneration.bind(this);

		this.init();
	}

	init() {
		if (!this.input) return;
		this.cursor = this.createCursor();
		this.mirror = document.createElement('span');
		this.mirror.className = AUTOLANCER_HIGHLIGHT_CLASSES.mirror;
		document.body.appendChild(this.mirror);

		this.input.classList.add(AUTOLANCER_HIGHLIGHT_CLASSES.input);
		this.input.addEventListener('focus', this.handleFocus);
		this.input.addEventListener('blur', this.handleBlur);
		this.input.addEventListener('input', this.handleInput);
		this.input.addEventListener('keyup', this.handleInput);
		this.input.addEventListener('click', this.handleInput);
		this.input.addEventListener('scroll', this.handleInput);
	}

	createCursor() {
		const cursor = document.createElement('div');
		cursor.className = AUTOLANCER_HIGHLIGHT_CLASSES.cursor;

		const bar = document.createElement('div');
		bar.className = AUTOLANCER_HIGHLIGHT_CLASSES.cursorBar;

		const logoWrapper = document.createElement('div');
		logoWrapper.className = AUTOLANCER_HIGHLIGHT_CLASSES.cursorLogoWrapper;

		const logo = document.createElement('img');
		logo.className = AUTOLANCER_HIGHLIGHT_CLASSES.cursorLogo;
		logo.src = CURSOR_LOGO_SRC;
		logo.alt = CURSOR_LOGO_ALT;
		logo.draggable = false;

		const menu = document.createElement('div');
		menu.className = AUTOLANCER_HIGHLIGHT_CLASSES.menu;

		const menuItem = document.createElement('div');
		menuItem.className = AUTOLANCER_HIGHLIGHT_CLASSES.menuItem;
		menuItem.textContent = 'Autolancer Agent';
		menuItem.addEventListener('mousedown', this.handleMenuAction);

		menu.appendChild(menuItem);
		logoWrapper.appendChild(logo);
		logoWrapper.appendChild(menu);

		logo.addEventListener('mousedown', (event) => {
			event.preventDefault();
			event.stopPropagation();
			this.input?.focus();
		});

		cursor.appendChild(bar);
		cursor.appendChild(logoWrapper);
		document.body.appendChild(cursor);
		return cursor;
	}

	handleFocus() {
		this.isActive = true;
		this.cursor.style.display = 'flex';
		this.updateCursor();
		document.addEventListener('selectionchange', this.handleSelectionChange);
		window.addEventListener('scroll', this.updateCursor, true);
		window.addEventListener('resize', this.updateCursor);
	}

	handleBlur() {
		this.isActive = false;
		this.cursor.style.display = 'none';
		document.removeEventListener('selectionchange', this.handleSelectionChange);
		window.removeEventListener('scroll', this.updateCursor, true);
		window.removeEventListener('resize', this.updateCursor);
	}

	handleInput() {
		if (!this.isActive) return;
		this.updateCursor();
	}

	handleSelectionChange() {
		if (!this.isActive || document.activeElement !== this.input) return;
		this.updateCursor();
	}

	handleMenuAction(event) {
		event.preventDefault();
		event.stopPropagation();
		this.input?.focus();
		this.emitGenerateEvent('start');
		this.startGeneration();
	}

	async startGeneration() {
		if (!this.input || this.isGenerating) return;
		this.isGenerating = true;
		const token = Symbol('autolancer-generation');
		this.generationToken = token;
		const textToType = this.input.dataset.autolancerDemoText || DEFAULT_AUTOFILL_TEXT;

		this.input.focus();
		this.input.value = '';
		this.dispatchInputEvent();
		this.updateCursor();

		try {
			await this.typeTextSequence(textToType, token);
			if (this.generationToken === token) {
				this.emitGenerateEvent('complete');
			}
		} finally {
			if (this.generationToken === token) {
				this.generationToken = null;
			}
			this.isGenerating = false;
		}
	}

	async typeTextSequence(text, token) {
		for (const char of text) {
			if (!this.input || this.generationToken !== token) {
				break;
			}
			this.input.value += char;
			const length = this.input.value.length;
			if (typeof this.input.setSelectionRange === 'function') {
				this.input.setSelectionRange(length, length);
			}
			this.input.scrollLeft = this.input.scrollWidth;
			if (this.input instanceof HTMLTextAreaElement) {
				this.input.scrollTop = this.input.scrollHeight;
			}
			this.dispatchInputEvent();
			this.updateCursor();
			await wait(randomBetween(AUTOFILL_MIN_DELAY, AUTOFILL_MAX_DELAY));
		}
	}

	dispatchInputEvent() {
		if (!this.input) return;
		this.input.dispatchEvent(new Event('input', { bubbles: true }));
	}

	emitGenerateEvent(stage = 'start') {
		if (!this.input) return;
		const synthetic = new CustomEvent('autolancer-agent-generate', {
			bubbles: true,
			detail: {
				value: this.input.value ?? '',
				name: this.input.name || null,
				stage
			}
		});
		this.input.dispatchEvent(synthetic);
	}

	updateCursor() {
		if (!this.isActive || !this.input?.isConnected) return;
		const rect = this.input.getBoundingClientRect();
		if (!rect.width || !rect.height) {
			this.cursor.style.display = 'none';
			return;
		}

		const selectionStart = typeof this.input.selectionStart === 'number'
			? this.input.selectionStart
			: (this.input.value || '').length;
		const value = this.input.value || '';
		const textBeforeCursor = value.substring(0, selectionStart);

		const computed = window.getComputedStyle(this.input);
		this.mirror.style.font = computed.font;
		this.mirror.style.letterSpacing = computed.letterSpacing;
		this.mirror.style.textTransform = computed.textTransform;
		this.mirror.textContent = textBeforeCursor || '\u200b';

		const paddingLeft = parseFloat(computed.paddingLeft) || 0;
		const borderLeft = parseFloat(computed.borderLeftWidth) || 0;
		const scrollLeft = this.input.scrollLeft || 0;
		const mirrorWidth = this.mirror.offsetWidth;

		const caretX = rect.left + paddingLeft + borderLeft + mirrorWidth - scrollLeft;
		const clampedX = Math.max(rect.left, Math.min(rect.right, caretX));
		const centerY = rect.top + rect.height / 2;

		this.cursor.style.left = `${clampedX}px`;
		this.cursor.style.top = `${centerY}px`;
		this.cursor.style.display = 'flex';
	}

	cancelGeneration() {
		this.generationToken = null;
		this.isGenerating = false;
	}

	destroy() {
		this.cancelGeneration();
		this.handleBlur();
		if (this.cursor?.parentElement) {
			this.cursor.parentElement.removeChild(this.cursor);
		}
		if (this.mirror?.parentElement) {
			this.mirror.parentElement.removeChild(this.mirror);
		}
		this.cursor = null;
		this.mirror = null;

		if (this.input?.classList?.contains(AUTOLANCER_HIGHLIGHT_CLASSES.input)) {
			this.input.classList.remove(AUTOLANCER_HIGHLIGHT_CLASSES.input);
		}

		this.input?.removeEventListener('focus', this.handleFocus);
		this.input?.removeEventListener('blur', this.handleBlur);
		this.input?.removeEventListener('input', this.handleInput);
		this.input?.removeEventListener('keyup', this.handleInput);
		this.input?.removeEventListener('click', this.handleInput);
		this.input?.removeEventListener('scroll', this.handleInput);
	}
}
