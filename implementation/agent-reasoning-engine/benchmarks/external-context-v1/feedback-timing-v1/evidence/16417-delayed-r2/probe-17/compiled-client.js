import 'svelte/internal/disclose-version';
import 'svelte/internal/flags/legacy';
import * as $ from 'svelte/internal/client';

var on_click = (e) => {
	const index = Number(e.currentTarget.dataset.index);

	console.log(index);
};

var on_click_1 = (e) => {
	const i = Number(e.currentTarget.dataset.index);

	console.log(i);
};

var root_1 = $.from_html(`<button type="button">A</button> <button type="button">B</button> <button type="button">C</button>`, 1);

export default function _unknown_($$anchor) {
	var fragment = $.comment();
	var node = $.first_child(fragment);

	$.each(node, 0, () => ({ length: 1 }), $.index, ($$anchor, _, index) => {
		var fragment_1 = root_1();
		var button = $.first_child(fragment_1);

		button.__click = () => console.log(index);

		var button_1 = $.sibling(button, 2);

		$.set_attribute(button_1, 'data-index', index);
		button_1.__click = [on_click];

		var button_2 = $.sibling(button_1, 2);

		$.set_attribute(button_2, 'data-index', index);
		button_2.__click = [on_click_1];
		$.append($$anchor, fragment_1);
	});

	$.append($$anchor, fragment);
}

$.delegate(['click']);