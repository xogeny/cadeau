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
being `cadeau` was largely inspired by discussions with
[@dietmarw](http://github.com/dietmarw) and our joint goal of
separating the slide content as much as possible from the presentation
framework.

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

# Getting Started

Create an empty directory and create a file called slides.yaml that looks like this:

```
metadata:
  title: Getting Started
slides:
  Introduction:
    - <hero><h1>Introducing Cadeau</h1><hero>
```

Now run `cadeau` in that directory.  It will generate an `output`
directory with an `index.html` file in it that you can open with any
modern web browser.

At this point, you've got a presentation, but very little content.  In
this case, we added a slide "inline" by just giving its HTML.  But
this is not scalable.  Now change the `slides.yaml` file to:

```
metadata:
  title: Getting Started
slides:
  Introduction:
    - <hero><h1>Introducing Cadeau</h1><hero>
    - features.html
```

...and add a file in the same directory as `slides.yaml` entitled
`features.html` that looks like this:

```
<h1>Features</h1>

<h2>Separation of presentation, from slides, from backend renderer</h2>
<h2>Ability to group slides together by topic for easy mixing and
matching of slide groups</h2>
<h2>Abstracted markup to support multiple backends</h2>
<h2>Support for JADE, HTML, Markdown formatted content</h2>
<h2>
  Built-in HTML templating support using
  <a href="http://paularmstrong.github.io/swig/">Swig</a>
</h2>
```

Let's say we wanted to add reveal each feature, one by one.  We could
change features.html to this:

```
<h1>Features</h1>

<h2 class="c-step">Separation of presentation, from slides, from backend renderer</h2>
<h2 class="c-step">Ability to group slides together by topic for easy mixing and
matching of slide groups</h2>
<h2 class="c-step">Abstracted markup to support multiple backends</h2>
<h2 class="c-step">Support for JADE, HTML, Markdown formatted content</h2>
<h2 class="c-step">
  Built-in HTML templating support using
  <a href="http://paularmstrong.github.io/swig/">Swig</a>
</h2>
```

In order to avoid having to produce arcane and presentation framework
specific markup, Cadeau uses special elements and classes to convey
the intent of elements in the content and then transforms them to the
appropriate backend specific markup during code generation.  The
`<hero>` element shown in `slides.yaml` and the `c-step` class shown
in `features.html` are examples of this kind of markup.

Even with the condensed markup that Cadeau provides, we can quickly
get into situations where we are repeating the same markup.  So Cadeau
includes a built-in template engine with support for inheritance and
macros to help reduce the amount of redundant code.  For example, we
could have written `features.html` like this instead:

```
{% macro feature(desc) %}
<h2 class="c-step">{{desc|safe}}</h2>
{% endmacro %}

<h1>Features</h1>

{{ feature('Separation of presentation, from slides, from backend renderer') }}
{{ feature('Ability to group slides together by topic for easy mixing and matching of slide groups') }}
{{ feature('Abstracted markup to support multiple backends') }}
{{ feature('Support for JADE, HTML, Markdown formatted content') }}
{{ feature('Built-in HTML templating support using <a href="http://paularmstrong.github.io/swig/">Swig</a>') }}
```

The use of macros not only avoids repetitive markup, it means you can
quickly change the markup as well, *e.g.,*

```
{% macro feature(desc) %}
<li class="c-step"><h4>{{desc|safe}}</h4></li>
{% endmacro %}

<h1>Features</h1>

<ul>
{{ feature('Separation of presentation, from slides, from backend renderer') }}
{{ feature('Ability to group slides together by topic for easy mixing and matching of slide groups') }}
{{ feature('Abstracted markup to support multiple backends') }}
{{ feature('Support for JADE, HTML, Markdown formatted content') }}
{{ feature('Built-in HTML templating support using <a href="http://paularmstrong.github.io/swig/">Swig</a>') }}
</ul>
```

# Installation

## Prerequisites

* [Node](http://nodejs.org) installed.

### Ubuntu/Debian systems

If you are using a Debian/Ubuntu system then you need to do

    apt-get install nodejs-legacy npm

or you install nodejs using  Chris Lea's repo:

    sudo add-apt-repository ppa:chris-lea/node.js
    sudo apt-get update
    sudo apt-get install nodejs

As of Node.js v0.10.0, the nodejs package from Chris Lea's repo includes both *npm* and *nodejs-dev*.

## Install

*cadeau* requires Node to run. To install *cadeau* globally:

    npm install -g cadeau

If you get an error when running that command, and it contains this line somwhere in it:

    npm ERR! Please try running this command again as root/Administrator.

You will need to run the install via sudo:

    sudo npm install -g cadeau

# PDF Generation

## How

I added the ability to create PDF slides for presentations.  This
works by using `PhantomJS` (headless WebKit) to render each slide and
then using GhostScript to concatenate all the slides together.  PDF
generation is currently a two step process.  First, you must run
`cadeau` with both the `-w` and `-g/--pdf` options.  The `-g/--pdf` option will
cause a script to be created in the local directory (where `cadeau`
was run) called `makepdf.sh`.  While `cadeau` is still running (in
watch mode, due to the `-w` flag), you can run this script to generate
a PDF of the presentation.  **Please Note**: the script depends on
having the `cadeau` running with the `-w` flag because it requires a
server to be running that is serving the presentation.  As such, it is
important that you do not kill the `cadeau` process before running the
`makepdf.sh` script.

## Dependencies

The `-g/--pdf` flag doesn't introduce any additional depdendencies.
But in order to run it, you'll need to have both `PhantomJS` installed
(globally) and GhostScript.

To install `PhantomJS`, simply run:

    npm install -g phantomjs

On OSX, you can install GhostScript with:

    brew install ghostscript

