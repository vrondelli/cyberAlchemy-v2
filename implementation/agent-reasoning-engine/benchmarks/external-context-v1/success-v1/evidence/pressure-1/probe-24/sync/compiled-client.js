import 'svelte/internal/disclose-version';
import 'svelte/internal/flags/async';
import * as $ from 'svelte/internal/client';

var root_1 = $.from_html(`<p></p>`);

export default function Child($$anchor) {
	let value = 'steady';
	const selected = display;

	selected($$anchor);
}