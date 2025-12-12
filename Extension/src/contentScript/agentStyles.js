const STYLE_ID = 'autolancer-agent-style-block';

export const AUTOLANCER_HIGHLIGHT_CLASSES = {
	base: 'autolancer-highlight-base',
	child: 'autolancer-highlight-child',
	parent: 'autolancer-highlight-parent',
	submit: 'autolancer-highlight-submit',
	input: 'autolancer-input-enhanced',
	cursor: 'autolancer-input-cursor',
	cursorBar: 'autolancer-cursor-bar',
	cursorLogo: 'autolancer-cursor-logo',
	cursorLogoWrapper: 'autolancer-cursor-logo-wrapper',
	menu: 'autolancer-bot-menu',
	menuItem: 'autolancer-menu-item',
	mirror: 'autolancer-input-mirror'
};

const styleContent = `
@keyframes autolancer-border-wave {
	0% { background-position: 0% 50%; }
	50% { background-position: 100% 50%; }
	100% { background-position: 0% 50%; }
}

@keyframes autolancer-border-pulse {
	0% { transform: scale(0.98); opacity: 0.65; }
	50% { transform: scale(1.01); opacity: 1; }
	100% { transform: scale(0.98); opacity: 0.65; }
}

@keyframes autolancer-cursor-blink {
	0%, 100% { opacity: 1; }
	50% { opacity: 0; }
}

@keyframes autolancer-cursor-sheen {
	0% { transform: translateX(0); }
	100% { transform: translateX(8px); }
}

.autolancer-highlight-base {
	--autolancer-border-radius: 12px;
	--autolancer-highlight-gradient: linear-gradient(120deg, #00c6ff, #4facfe, #00c6ff);
	--autolancer-highlight-glow: rgba(79, 172, 254, 0.4);
	--autolancer-glow-size: 2px;
	box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08), 0 0 12px rgba(15, 23, 42, 0.25);
	isolation: isolate;
	border-radius: var(--autolancer-border-radius, 12px);
	transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.autolancer-highlight-base::before {
	content: "";
	position: absolute;
	inset: 0;
	padding: 2px;
	border-radius: var(--autolancer-border-radius, 12px);
	background: var(--autolancer-highlight-gradient, linear-gradient(120deg, #00c6ff, #4facfe, #00c6ff));
	background-size: 250% 250%;
	animation: autolancer-border-wave 5s linear infinite;
	-webkit-mask:
		linear-gradient(#000 0 0) content-box,
		linear-gradient(#000 0 0);
	-webkit-mask-composite: xor;
	mask-composite: exclude;
	pointer-events: none;
	z-index: 2;
}

.autolancer-highlight-base::after {
	content: "";
	position: absolute;
	inset: calc(-1 * var(--autolancer-glow-size, 2px));
	border-radius: calc(var(--autolancer-border-radius, 12px) + var(--autolancer-glow-size, 2px));
	background: var(--autolancer-highlight-gradient, linear-gradient(120deg, #00c6ff, #4facfe, #00c6ff));
	background-size: 250% 250%;
	filter: blur(4px);
	opacity: 0.35;
	animation: autolancer-border-wave 7s linear infinite;
	pointer-events: none;
	z-index: 1;
}

.autolancer-highlight-child {
	--autolancer-highlight-gradient: linear-gradient(120deg, #ff416c, #ff4b2b, #ff416c);
	--autolancer-highlight-glow: rgba(255, 65, 108, 0.55);
	box-shadow: 0 0 0 1px rgba(255, 100, 130, 0.4), 0 0 14px rgba(255, 65, 108, 0.35);
}

.autolancer-highlight-parent {
	--autolancer-highlight-gradient: linear-gradient(120deg, #0f9b0f34, #0b512691, #0f9b0f7e);
	--autolancer-highlight-glow: rgba(15, 155, 15, 0.15);
	box-shadow: 0 0 0 1px rgba(25, 100, 45, 0.35), 0 0 16px rgba(15, 155, 15, 0.35);
}

.autolancer-highlight-submit {
	--autolancer-highlight-gradient: linear-gradient(120deg, #00c6ff, #0072ff, #00c6ff);
	--autolancer-highlight-glow: rgba(0, 150, 255, 0.55);
	box-shadow: 0 0 0 1px rgba(0, 150, 255, 0.45), 0 0 16px rgba(0, 198, 255, 0.45);
}

.autolancer-highlight-base::before,
.autolancer-highlight-base::after {
	mix-blend-mode: screen;
}

.autolancer-highlight-base[data-autolancer-highlight="parent"]::before {
	animation-duration: 6s;
}

.autolancer-highlight-base[data-autolancer-highlight="child"]::before {
	animation-duration: 4s;
}

.autolancer-highlight-base[data-autolancer-highlight="submit"]::before {
	animation-duration: 3.5s;
}

/* Input augmentation */
.autolancer-input-enhanced {
	border-radius: 12px !important;
	border: 1px solid rgba(255, 255, 255, 0.15) !important;
	background-color: rgba(7, 14, 27, 0.85) !important;
	color: #f5f5f5 !important;
	box-shadow: inset 0 0 15px rgba(255, 255, 255, 0.08), 0 0 30px rgba(14, 33, 82, 0.4);
	caret-color: transparent !important;
	transition: box-shadow 0.3s ease, border-color 0.3s ease, background-color 0.3s ease;
}

.autolancer-input-enhanced:focus {
	border-color: rgba(0, 198, 255, 0.8) !important;
	box-shadow: inset 0 0 25px rgba(0, 198, 255, 0.2), 0 0 30px rgba(0, 198, 255, 0.35);
	background-color: rgba(10, 25, 54, 0.95) !important;
}

.autolancer-input-cursor {
	position: fixed;
	display: none;
	align-items: center;
	pointer-events: none;
	z-index: 2147483643;
	transform: translateY(-50%);
}

.autolancer-cursor-bar {
	width: 2px;
	height: 24px;
	background: linear-gradient(180deg, rgba(0, 198, 255, 1), rgba(0, 114, 255, 1));
	animation: autolancer-cursor-blink 1.2s steps(2, start) infinite;
	box-shadow: 0 0 12px rgba(0, 198, 255, 0.9);
}

.autolancer-cursor-logo-wrapper {
	position: relative;
	margin-left: 6px;
	display: flex;
	align-items: center;
	justify-content: center;
	pointer-events: auto;
}

.autolancer-cursor-logo {
	width: 28px;
	height: 28px;
	border-radius: 50%;
	padding: 4px;
	background: rgba(4, 18, 32, 0.9);
	border: 1px solid rgba(255, 255, 255, 0.12);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45);
	cursor: pointer;
	transition: transform 0.2s ease, box-shadow 0.2s ease;
	display: block;
	object-fit: contain;
	filter: invert(1);
}

.autolancer-cursor-logo:hover {
	transform: scale(1.08);
	box-shadow: 0 6px 15px rgba(0, 0, 0, 0.5);
}

.autolancer-bot-menu {
	position: absolute;
	top: 110%;
	left: -20px;
	width: 200px;
	background: rgba(7, 15, 32, 0.96);
	border: 1px solid rgba(255, 255, 255, 0.12);
	border-radius: 12px;
	padding: 8px;
	box-shadow: 0 12px 24px rgba(0, 0, 0, 0.5);
	opacity: 0;
	visibility: hidden;
	transform: translateY(10px);
	transition: opacity 0.2s ease, transform 0.2s ease;
	pointer-events: none;
}

.autolancer-cursor-logo-wrapper:hover .autolancer-bot-menu,
.autolancer-bot-menu:hover {
	opacity: 1;
	visibility: visible;
	transform: translateY(0);
	pointer-events: auto;
}

.autolancer-menu-item {
	padding: 10px;
	border-radius: 8px;
	font-size: 13px;
	color: #cbd5f5;
	cursor: pointer;
	transition: background 0.2s ease, color 0.2s ease;
	display: flex;
	align-items: center;
	gap: 8px;
}

.autolancer-menu-item::before {
	content: "⚡";
}

.autolancer-menu-item:hover {
	background: linear-gradient(120deg, rgba(0, 198, 255, 0.15), rgba(0, 114, 255, 0.2));
	color: #fff;
}

.autolancer-input-mirror {
	position: absolute;
	visibility: hidden;
	white-space: pre-wrap;
	word-break: break-word;
	overflow-wrap: break-word;
	pointer-events: none;
	z-index: -1;
	top: 0;
	left: -9999px;
}
`;

export function ensureAgentStyles() {
	if (document.getElementById(STYLE_ID)) return;
	const style = document.createElement('style');
	style.id = STYLE_ID;
	style.textContent = styleContent;
	(document.head || document.documentElement || document.body).appendChild(style);
}
