'use strict';

/* Bring in dependencies */
var path = require('path');
var hb = require('handlebars');
var fs = require('fs-extra');
var html = require('html');
var cheerio = require('cheerio');
var resources = path.join(path.dirname(module.filename), "flowtime");

/* This is the code that actually generates the presentation. */
function generate(context, metadata, dst) {
    /* Copy CSS resources needed by flowtime. */
    var cssdir = path.join(resources, "css");
    if (fs.existsSync(cssdir)) fs.copySync(cssdir, path.join(dst, "css"));
    else { console.log("Couldn't find CSS files for Flowtime at "+cssdir); }

    /* Copy Javascript needed by flowtime */
    var jsdir = path.join(resources, "js");
    if (fs.existsSync(jsdir)) fs.copySync(jsdir, path.join(dst, "js"));
    else { console.log("Couldn't find JS files for engine Flowtim at "+jsdir); }

    /* Copy images needed by flowtime */    
    var imgdir = path.join(resources, "img");
    if (fs.existsSync(imgdir)) fs.copySync(imgdir, path.join(dst, "img"));
    else { console.log("Couldn't find image files for engine Flowtim at "+imgdir); }

    /* Generate index.html */
    var ft = hb.compile(fs.readFileSync(path.join(resources, "flowtime.html"), "utf8"));

    /* Generate index.html */
    var ot = hb.compile(fs.readFileSync(path.join(resources, "outline.html"), "utf8"));

    /* Run the results through the handlebars template (this is one case where we
       definitely want to use handlebars. */
    var tcon = {"slides": context['slides'],
		"metadata": metadata};
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

    /* Make any step fragments */
    $('.c-step').each(function(i, elem) {
	$(elem).removeClass('c-step');
	$(elem).addClass('ft-fragment');
	$(elem).addClass('step');
    });

    /* Make any shy fragments */
    $('.c-shy').each(function(i, elem) {
	$(elem).removeClass('c-shy');
	$(elem).addClass('ft-fragment');
	$(elem).addClass('shy');
    });

    /* Now pretty print the results before writing them to index.html */
    var pretty = html.prettyPrint($.html(), { indent_size: 2 });
    fs.writeFileSync(path.join(dst, "index.html"), pretty);
    if (metadata.draft) {
	fs.writeFileSync(path.join(dst, "outline.html"), outline);
    }
}

/* Export these functions for use in main.js.  These essentially form
   the engine API. */
module.exports.resources = resources;
module.exports.generate = generate;
module.exports.name = "Flowtime Engine";
