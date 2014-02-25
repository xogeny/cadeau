Cadeau
======

I've been wanting to use Javascript presentation frameworks for some
time.  I like the idea of being able to use the power of HTML5 in my
presentation.  I also like the idea of managing slides like source
code so I can version control them and generally treat them as content
fragments instead of large decks of slides.

There are a lot of nice Javascript frameworks out there for doing
presentations.  But I find the markup is often arcane and their
support for different types of markup is always uneven.  The idea
being `cadeau` was largely inspired by discussions with @dietmarw and
our joint goal of separating the slide content as much as possible
from the presentation framework.

My goal in this project is to create collections of slides and then
use a presentation description file to organize those slides.  By
separating the organization representation from the slide content, I
hope to promote slide reuse.  Given the content and the organization
information, `cadeau` then generates a presentation in much the same
way static site generators generate web-sites.  However `cadeau` is
specialized around presentations (one could perhaps argue that some
site generator tools could be specialized to this task, and they might
be right...but I didn't go that route).

This project is in its infancy, but so far I'm happy with the ability
to separate slide content from presentation organization from
presentation framework.
