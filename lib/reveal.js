'use strict';

/* Bring in dependencies */
var path = require('path');
var hb = require('handlebars');
var fs = require('fs-extra');
var cheerio = require('cheerio');
var main = require('./main');
var resources = path.join(path.dirname(module.filename), "reveal");

/* This is the code that actually generates the presentation. */
function generate(context, metadata, filename, dst) {
    /* Copy resources needed by reveal. */
    main.copyEngineResources(context, "css", dst);
    main.copyEngineResources(context, "js", dst);
    main.copyEngineResources(context, "font", dst);

    /* Generate index.html */
    var ft = hb.compile(fs.readFileSync(path.join(resources, "reveal.html"), "utf8"));

    /* Generate index.html */
    var ot = hb.compile(fs.readFileSync(path.join(resources, "outline.html"), "utf8"));

    /* Run the results through the handlebars template (this is one case where we
       definitely want to use handlebars. */
    var tcon = {
	"slides": context['slides'],
	"metadata": metadata
    };
    var result = ft(tcon);
    var outline = ot(tcon);

    /* Now load cheerio and perform some HTML transformations.
       TODO: Is there a 'nicer' way to do this, perhaps in conjunction
       with handlebars.  I hate writing literal HTML code.  It seems ugly
       and potentially unsafe. */
    var $ = cheerio.load(result);

    /* Replace any <hero> elements with some surrounding divs */
    $('hero').each(function(i, elem) {
	var was = $(elem).html();
	var to = '<div class="stack-center"><div class="stacked-center">'+was+'</div></div>';
	$(elem).replaceWith(to);
    });

    if (metadata.animation) {
	/* Make any step fragments */
	$('.c-step').each(function(i, elem) {
	    $(elem).removeClass('c-step');
	    $(elem).addClass('ft-fragment');
	});

	/* Make any step fragments */
	$('.c-dim').each(function(i, elem) {
	    $(elem).removeClass('c-dim');
	    $(elem).addClass('ft-fragment');
	    $(elem).addClass('step');
	});

	/* Make any shy fragments */
	$('.c-shy').each(function(i, elem) {
	    $(elem).removeClass('c-shy');
	    $(elem).addClass('ft-fragment');
	    $(elem).addClass('shy');
	});
    }

    // N.B. - We don't pretty print because it will mess up <pre> blocks
    fs.writeFileSync(path.join(dst, filename), $.html());
    if (metadata.draft) {
	fs.writeFileSync(path.join(dst, "outline.html"), outline);
    }
}

/* Export these functions for use in main.js.  These essentially form
   the engine API. */
module.exports.resources = resources;
module.exports.generate = generate;
module.exports.name = "Reveal Engine";
