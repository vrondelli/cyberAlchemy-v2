import 'svelte/internal/disclose-version';
import 'svelte/internal/flags/async';
import * as $ from 'svelte/internal/client';

export default function Main($$anchor) {
	var fragment = $.comment();
	var node = $.first_child(fragment);

	{
		const pending = ($$anchor) => {
			const number = $.derived(() => 5);
		};

		$.boundary(node, { pending }, ($$anchor) => {
			const number = $.derived(() => 5);

			$.next();

			var text = $.text();

			text.nodeValue = $.get(number);
			$.append($$anchor, text);
		});
	}

	$.append($$anchor, fragment);
}