import 'svelte/internal/disclose-version';
import 'svelte/internal/flags/async';
import * as $ from 'svelte/internal/client';

var root_1 = $.from_html(`<p> </p>`);

export default function Child($$anchor) {
	$.async_body(async () => {
		let value = (await $.save(Promise.resolve('ready')))();

		if ($.aborted()) return;

		const display = ($$anchor) => {
			var p = root_1();
			var text = $.child(p, true);

			$.reset(p);
			$.template_effect(() => $.set_text(text, value));
			$.append($$anchor, p);
		};

		display($$anchor);
	});
}