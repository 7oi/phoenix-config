import './screen';
import './window';

import {frameRatio} from './calc';
import {hyper, hyperShift} from './config';
import {cycleBackward, cycleForward} from './cycle';
import {onKey} from './key';
import log from './logger';
import {brightness} from './misc/brightness';
import {TimerStopper} from './misc/coffee';
import coffeTimer from './misc/coffee';
import {Profile, selectProfile} from './misc/karabiner';
import * as terminal from './misc/terminal';
import {titleModal} from './modal';
import {Scanner} from './scan';

const scanner = new Scanner();
let coffee: TimerStopper | null;

Phoenix.set({
	daemon: true,
	openAtLogin: true,
});

Event.on('screensDidChange', () => {
	log('Screens changed');
});

onKey('tab', hyper, () => {
	const win = Window.focused();
	if (!win) {
		return;
	}

	const oldScreen = win.screen();
	const newScreen = oldScreen.next();

	if (oldScreen.isEqual(newScreen)) {
		return;
	}

	const ratio = frameRatio(
		oldScreen.flippedVisibleFrame(),
		newScreen.flippedVisibleFrame(),
	);
	win.setFrame(ratio(win.frame()));
});

onKey(['left', 'j'], hyper, () => {
	const win = Window.focused();
	if (!win) {
		return;
	}

	let {width, height, x, y} = win.screen().flippedVisibleFrame();
	width = Math.ceil(width / 2);
	win.setFrame({width, height, x, y});
	win.clearUnmaximized();
});

onKey(['right', 'l'], hyper, () => {
	const win = Window.focused();
	if (!win) {
		return;
	}

	let {width, height, x, y} = win.screen().flippedVisibleFrame();
	width /= 2;
	x += Math.ceil(width);
	width = Math.floor(width);

	win.setFrame({width, height, x, y});
	win.clearUnmaximized();
});

onKey(['up', 'i'], hyper, () => {
	const win = Window.focused();
	if (!win) {
		return;
	}

	const {width, x} = win.frame();
	let {height, y} = win.screen().flippedVisibleFrame();
	height = Math.ceil(height / 2);

	win.setFrame({height, width, x, y});
	win.clearUnmaximized();
});

onKey(['down', 'k'], hyper, () => {
	const win = Window.focused();
	if (!win) {
		return;
	}

	const {width, x} = win.frame();
	let {height, y} = win.screen().flippedVisibleFrame();
	height /= 2;
	[height, y] = [Math.ceil(height), y + Math.floor(height)];

	win.setFrame({height, width, x, y});
	win.clearUnmaximized();
});

onKey('return', hyper, () => {
	const win = Window.focused();
	if (win) {
		win.toggleMaximized();
	}
});

onKey(['left', 'j'], hyperShift, () => {
	const win = Window.focused();
	if (!win) {
		return;
	}

	const {width, height, y, x: fX} = win.frame();
	let {width: sWidth, x} = win.screen().flippedVisibleFrame();

	const center = x + Math.ceil(sWidth / 2);
	const half = Math.floor(width / 2);
	if (fX + half > center) {
		x = center - half;
	}

	win.setFrame({width, height, y, x});
});

onKey(['right', 'l'], hyperShift, () => {
	const win = Window.focused();
	if (!win) {
		return;
	}

	const {width, height, y, x: fX} = win.frame();
	let {width: sWidth, x} = win.screen().flippedVisibleFrame();

	const center = x + Math.floor(sWidth / 2);
	const half = Math.ceil(width / 2);
	if (fX + half < center) {
		x = center - half;
	} else {
		x = x + sWidth - width;
	}

	win.setFrame({width, height, y, x});
});

onKey(['up', 'i'], hyperShift, () => {
	const win = Window.focused();
	if (!win) {
		return;
	}

	const {width, height, x, y: frameY} = win.frame();
	let {height: sHeight, y} = win.screen().flippedVisibleFrame();

	const center = Math.ceil(y + sHeight / 2);
	const half = Math.floor(height / 2);
	if (frameY + half > center) {
		y = center - half;
	}

	win.setFrame({width, height, x, y});
});

onKey(['down', 'k'], hyperShift, () => {
	const win = Window.focused();
	if (!win) {
		return;
	}

	const {width, height, x, y: frameY} = win.frame();
	let {height: sHeight, y} = win.screen().flippedVisibleFrame();

	const center = Math.floor(y + sHeight / 2);
	const half = Math.ceil(height / 2);
	if (frameY + half < center) {
		y = center - half;
	} else {
		y = y + sHeight - height;
	}

	win.setFrame({width, height, x, y});
});

onKey('return', hyperShift, () => {
	const win = Window.focused();
	if (!win) {
		return;
	}

	const {width, height} = win.frame();
	const {
		width: sWidth,
		height: sHeight,
		x,
		y,
	} = win.screen().flippedVisibleFrame();

	win.setFrame({
		height,
		width,
		x: x + sWidth / 2 - width / 2,
		y: y + sHeight / 2 - height / 2,
	});
});

onKey('§', [], () => terminal.toggle());
onKey('§', ['cmd'], () => terminal.cycleWindows());

onKey('p', hyper, () => {
	const win = Window.focused();
	if (!win) {
		return;
	}
	const app = win.app().name();
	const bundleId = win.app().bundleIdentifier();
	const pid = win.app().processIdentifier();
	const title = win.title();
	const frame = win.frame();
	const msg = [
		`Application: ${app}`,
		`Title: ${title}`,
		`Frame: X=${frame.x}, Y=${frame.y}`,
		`Size: H=${frame.height}, W=${frame.width}`,
		`Bundle ID: ${bundleId}`,
		`PID: ${pid}`,
	].join('\n');

	log('Window information:\n' + msg);

	const modal = Modal.build({
		duration: 10,
		icon: win.app().icon(),
		text: msg,
		weight: 16,
	});
	modal.showCenterOn(Screen.main());
});

onKey('.', hyper, () => {
	const win = Window.focused();
	if (win) {
		log(
			win
				.screen()
				.windows({visible: true})
				.map(w => w.title()),
		);
		log(
			win
				.screen()
				.windows()
				.map(w => w.title()),
		);
	}
});

onKey('delete', hyper, () => {
	const win = Window.focused();
	if (win) {
		const visible = win.screen().windows({visible: true});
		log(visible.map(w => w.title()));
		// log(win.screen().windows({visible: true}).map(w => w.title()));
		// log(win.others({visible: true}).map(w => w.title()));
		win.minimize();
		if (visible.length) {
			const next = visible[visible.length > 1 ? 1 : 0];
			log('focusing: ' + next.title());
			next.focus();
		}
		// win.focusClosestNeighbor('east');
		// const others = win.others({visible: true});
		// if (others.length) {
		// 	log(others.map(w => w.title()));
		// 	others[0].focus();
		// }
	}
});

onKey('m', hyper, () => {
	const s = Screen.at(Mouse.location());
	log(s.identifier(), Mouse.location());
});

onKey('=', hyper, () => brightness(+10));
onKey('-', hyper, () => brightness(-10));

onKey('c', hyper, () => {
	if (coffee) {
		coffee.stop();
		coffee = null;
		return;
	}
	coffee = coffeTimer({screen: Screen.main(), timeout: 8});
});

onKey('escape', ['cmd'], () => cycleForward(Window.focused()));
onKey('escape', ['cmd', 'shift'], () => cycleBackward(Window.focused()));

// Experimental: Search for windows and cycle between results.
onKey('space', hyper, () => {
	const m = new Modal();
	const msg = 'Search: ';
	m.text = msg;
	m.showCenterOn(Screen.main());
	const originalWindow = Window.focused();
	const winCache = Window.all({visible: true});
	let matches = [...winCache];

	// Prevent modal from hopping from screen to screen.
	const mainScreen = Screen.main();

	// Since we focus the first window, start in reverse mode.
	let prevReverse = true;

	function nextWindow(reverse: boolean): Window | undefined {
		if (prevReverse !== reverse) {
			prevReverse = reverse;
			nextWindow(reverse); // Rotate.
		}

		const w = reverse ? matches.pop() : matches.shift();
		if (!w) {
			return;
		}
		reverse ? matches.unshift(w) : matches.push(w);
		return w;
	}

	const tabFn = (reverse: boolean) => () => {
		if (!matches.length) {
			return;
		}

		const w = nextWindow(reverse);
		if (!w) {
			return;
		}

		w.focus();
		m.icon = w.app().icon();
		m.showCenterOn(mainScreen);
	};

	const tab = new Key('tab', [], tabFn(false));
	const shiftTab = new Key('tab', ['shift'], tabFn(true));

	scanner.scanln(
		s => {
			m.close();
			tab.disable();
			shiftTab.disable();
			if (s === '' && originalWindow) {
				// No window selected, restore original.
				originalWindow.focus();

				// Window management on macOS with multiple monitors is pretty
				// bad, the right window might not be focused when an app is not
				// focused and has multiple windows on multiple monitors.
				setTimeout(() => originalWindow.focus(), 200);
			}
		},
		s => {
			tab.enable();
			shiftTab.enable();

			prevReverse = true; // Reset.

			matches = winCache.filter(w => appName(w) || title(w));
			m.text = msg + s + (s ? results(matches.length) : '');

			if (s && matches.length) {
				matches[0].focus();
				m.icon = matches[0].app().icon();
			} else {
				if (originalWindow) {
					originalWindow.focus();
				}
				m.icon = undefined;
			}

			m.showCenterOn(mainScreen);

			function appName(w: Window) {
				return w
					.app()
					.name()
					.toLowerCase()
					.match(s.toLowerCase());
			}

			function title(w: Window) {
				return w
					.title()
					.toLowerCase()
					.match(s.toLowerCase());
			}
		},
	);

	function results(n: number) {
		return `\n${n} results`;
	}
});

// Always hide apps, even if they're the last one on the desktop.
onKey('h', ['cmd'], (_: Key, repeated: boolean) => {
	// Hide all windows when Cmd+H is held.
	if (repeated) {
		const apps = Window.all({visible: true}).map(w => w.app());
		new Set(apps).forEach(a => a.hide());
		return;
	}

	const win = Window.focused();
	if (win) {
		win.app().hide();
	}
});

const phoenixApp = App.get('Phoenix');
titleModal('Phoenix (re)loaded!', 2, phoenixApp && phoenixApp.icon());
