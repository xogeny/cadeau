# Abstract markup

One of the goal for Cadeau is to be as neutral as possible with
respect to the backend presentation processing.  Ideally, we'd like to
focus on the content in the slides being managed by Cadeau and not
include backend specific markup in them.  At the same time, we want to
try and capitalize as much as possible on the visual capabilities of
these backends.

Our solution is to create some Cadeau specific markup elements and
classes that can be used to express intent.  These intentions will
then be transformed by the specific presentation backend into markup
that fits that particular backends markup conventions.

The goal of this file is to document some of the special elements and
classes that Cadeau recognizes.

# Caveats

The abstractions mentioned here meant to express intentions.  But how
well those intentions can be met depends on the degree of support in
the backend.  We try our best to implement these intentions as best as
we can for each engine.  But as with all abstractions, we can't
necessarily provide complete low-level control.

Note that if you are not concerned with backend portability (*i.e.,*
being able to generate presentations using multiple backends), you can
always use backend-specific markup.

# Elements

## `hero`

The `hero` element is used to surround content that should be strongly
emphasized on a slide.

# Classes

## `c-step`

By adding the `c-step` class to an element, you are indicating that
that element is one step in a step-by-step reveal process on the
slide.

Any content marked with the `c-step` class will remain visible (but
de-emphasized, in some cases) when the next piece of content is
rendered.

## `c-shy`

The `c-shy` class works in the same way as `c-step` except that the
content is removed when the next piece of content is displayed.
