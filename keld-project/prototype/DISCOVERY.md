# The hidden shelf

This revision changes price discovery, not the release, software license or
accepted payment range.

## First visit

- The amount is $200 USD. The visible slider runs from $200 to $1,000.
- Visible presets: $200, $500 and $1,000.
- The $50 and $100 presets, lower endpoint and discovery copy are hidden.
- Initial FAQ, bag copy and accessible controls do not advertise the lower floor.

## Intentional discovery

The hidden shelf opens when a buyer attempts to go below $200 by:

- Pressing the minus control (a $25 decrement).
- Dragging the slider left past its initial $200 stop.
- Using ArrowLeft/ArrowDown or PageDown on the slider at the starting boundary.
- Using ArrowDown on the amount input.
- Entering a lower amount and committing with Tab, blur, Enter or a purchase action.
- Committing a lower amount in the bag editor.

A typed draft does not unlock the shelf. For example, typing `1000` naturally
passes through `1`, `10` and `100`: none should reveal lower prices. Input/change
handling deliberately separates these draft values from a committed amount.
A click on Add to bag or Review checkout is not lost to a reveal-induced layout
shift: that action commits and reveals before opening the next dialog.

## Revealed state

A copper-accented panel appears with the original line:

> You found the hidden shelf.
> A quieter price. The same instrument.

The $50 and $100 presets become available, and the slider's minimum extends to
$50. Arbitrary amounts with up to two decimal places remain supported, within
$50–$1,000 inclusive. Sub-$50 attempts reveal the shelf but are still rejected;
amounts above $1,000 remain invalid and do not reveal it. Reset returns to $200
without closing the discovered panel during the current page visit.

The release and license do not change at a lower price. The bag, review, mobile
purchase control and preview summary use the selected integer-cent amount.

A fresh visit starts closed. A restored, validated session cart containing a
below-$200 amount is treated as an already discovered price. No separate
tracking, discovery cookie, scarcity counter or eligibility test was added.

## Accessibility and implementation

- Controls support keyboard, mouse and touch; simple taps at $200 do not reveal.
- Hidden controls are removed from the accessibility tree by the hidden attribute.
- Reveal uses the existing polite announcement region without stealing focus.
- Reduced-motion settings suppress the reveal animation.
- The initial slider bound is a UI convention, not the server's actual minimum.
- These values are visible in source code: this is an Easter egg, not security.

Keep server-side validation at 5000–100000 integer USD cents; do not require a
client-side `unlocked` flag as authorization. Live payment and delivery remain
unconnected in this preview.
