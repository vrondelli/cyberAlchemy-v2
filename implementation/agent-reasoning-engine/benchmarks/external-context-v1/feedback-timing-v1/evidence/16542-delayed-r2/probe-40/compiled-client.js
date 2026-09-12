import 'svelte/internal/disclose-version';
import 'svelte/internal/flags/async';
import * as $ from 'svelte/internal/client';

export default function Main($$anchor) {
	var fragment = $.comment();
	var node = $.first_child(fragment);

	{
		const pending = ($$anchor) => {
			const number = (await $.save($.async_derived(() => Promise.resolve(5))))();
		};

		$.boundary(node, { pending }, ($$anchor) => {
			const number = (await $.save($.async_derived(() => Promise.resolve(5))))();

			$.next();

			var text = $.text();

			$.template_effect(() => $.set_text(text, $.get(number)));
			$.append($$anchor, text);
		});
	}

	$.append($$anchor, fragment);
}