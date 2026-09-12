import 'svelte/internal/disclose-version';
import * as $ from 'svelte/internal/client';

var root = $.from_html(`<select><option>o1</option><option selected>o2</option></select> <select><option>o1</option><option selected>o2</option></select>`, 1);

export default function Main($$anchor) {
	let others = { onclick: () => {} };
	var fragment = root();
	var select = $.sibling($.first_child(fragment), 2);

	$.attribute_effect(select, () => ({ ...others }));
	$.append($$anchor, fragment);
}