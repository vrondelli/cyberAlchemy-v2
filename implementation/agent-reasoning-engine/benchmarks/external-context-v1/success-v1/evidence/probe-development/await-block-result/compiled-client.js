import 'svelte/internal/disclose-version';
import 'svelte/internal/flags/async';
import * as $ from 'svelte/internal/client';

var root_1 = $.from_html(`<p>pending</p>`);
var root_4 = $.from_html(`<p> </p>`);

export default function Main($$anchor) {
	var fragment = $.comment();
	var node = $.first_child(fragment);

	{
		const pending = ($$anchor) => {
			var p = root_1();

			$.append($$anchor, p);
		};

		$.boundary(node, { pending }, ($$anchor) => {
			var fragment_1 = $.comment();
			var node_1 = $.first_child(fragment_1);

			$.await(node_1, () => Promise.resolve('ready'), null, ($$anchor, value) => {
				const display = ($$anchor) => {
					var p_1 = root_4();
					var text = $.child(p_1, true);

					$.reset(p_1);
					$.template_effect(() => $.set_text(text, $.get(value)));
					$.append($$anchor, p_1);
				};

				display($$anchor);
			});

			$.append($$anchor, fragment_1);
		});
	}

	$.append($$anchor, fragment);
}