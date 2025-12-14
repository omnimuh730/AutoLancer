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
/* 
   CORE HIGHLIGHTING 
   Uses box-shadow for hardware-accelerated, non-layout-shifting borders.
*/
.autolancer-highlight-base {
	--autolancer-color: #00c6ff;
	position: relative;
	border-radius: 8px;
	box-shadow: 0 0 0 2px var(--autolancer-color), 0 0 8px var(--autolancer-color);
	transition: box-shadow 0.2s ease;
	pointer-events: none; /* Let clicks pass through the highlight container */
}

/* Specific Color States */
.autolancer-highlight-child {
	--autolancer-color: #ff416c; /* Red/Pink for errors/children */
}

.autolancer-highlight-parent {
	--autolancer-color: #28a745; /* Green for containers */
}

.autolancer-highlight-submit {
	--autolancer-color: #0072ff; /* Deep Blue for actions */
}

/* 
   INPUT AUGMENTATION 
   Removed forced background/colors. Only adds the focus glow.
*/
.autolancer-input-enhanced {
	transition: box-shadow 0.2s ease;
}

.autolancer-input-enhanced:focus {
	outline: none !important;
	box-shadow: 0 0 0 2px #00c6ff, 0 0 12px rgba(0, 198, 255, 0.6) !important;
}

/* 
   CURSOR & UI ELEMENTS 
   Removed the fake text caret bar to allow native accessibility.
   Kept the Bot Menu/Logo but simplified the styling.
*/

/* Container for the floating UI helper */
.autolancer-input-cursor {
	position: fixed;
	display: none; /* JS toggles this to flex */
	align-items: center;
	pointer-events: none;
	z-index: 2147483643;
	transform: translateY(-50%);
}

/* Hide the fake vertical cursor bar, use native browser cursor instead */
.autolancer-cursor-bar {
	display: none; 
}

.autolancer-cursor-logo-wrapper {
	position: relative;
	margin-left: 4px;
	display: flex;
	align-items: center;
	justify-content: center;
	pointer-events: auto;
}

.autolancer-cursor-logo {
	width: 24px;
	height: 24px;
	border-radius: 50%;
	background: #ffffff;
	border: 1px solid #ccc;
	box-shadow: 0 2px 5px rgba(0,0,0,0.2);
	cursor: pointer;
	transition: transform 0.1s ease;
	display: block;
	object-fit: contain;
}

.autolancer-cursor-logo:hover {
	transform: scale(1.1);
	border-color: #00c6ff;
}

/* 
   BOT MENU 
   Clean, high-contrast readability.
*/
.autolancer-bot-menu {
	position: absolute;
	top: 110%;
	left: 0;
	min-width: 180px;
	background: #ffffff;
	color: #333;
	border: 1px solid #e0e0e0;
	border-radius: 6px;
	padding: 4px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	opacity: 0;
	visibility: hidden;
	transform: translateY(5px);
	transition: opacity 0.1s ease, transform 0.1s ease;
	pointer-events: none;
	z-index: 2147483644;
}

/* Dark mode preference support for the menu */
@media (prefers-color-scheme: dark) {
	.autolancer-bot-menu {
		background: #1a1a1a;
		color: #f0f0f0;
		border-color: #333;
	}
}

.autolancer-cursor-logo-wrapper:hover .autolancer-bot-menu,
.autolancer-bot-menu:hover {
	opacity: 1;
	visibility: visible;
	transform: translateY(0);
	pointer-events: auto;
}

.autolancer-menu-item {
	padding: 8px 12px;
	border-radius: 4px;
	font-size: 13px;
	font-family: sans-serif;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 8px;
}

.autolancer-menu-item:hover {
	background-color: #f0f5ff;
	color: #0072ff;
}

@media (prefers-color-scheme: dark) {
	.autolancer-menu-item:hover {
		background-color: #333;
		color: #4facfe;
	}
}

/* Utility for coordinate calculation - Must remain hidden */
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