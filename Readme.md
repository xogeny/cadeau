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
