'use strict';

var path = require('path');
var hb = require('handlebars');
var fs = require('fs-extra');
var html = require('html');
var cheerio = require('cheerio');
var resources = path.join(path.dirname(module.filename), "flowtime");

function registerHelpers(handlebars) {
}

function generate(context, metadata, dst) {
    /* Copy resources */
    var cssdir = path.join(resources, "css");
    if (fs.existsSync(cssdir)) fs.copySync(cssdir, path.join(dst, "css"));
    else { console.log("Couldn't find CSS files for Flowtime at "+cssdir); }

    var jsdir = path.join(resources, "js");
    if (fs.existsSync(jsdir)) fs.copySync(jsdir, path.join(dst, "js"));
    else { console.log("Couldn't find JS files for engine Flowtim at "+jsdir); }

    var imgdir = path.join(resources, "img");
    if (fs.existsSync(imgdir)) fs.copySync(imgdir, path.join(dst, "img"));
    else { console.log("Couldn't find image files for engine Flowtim at "+imgdir); }

    /* Generate index.html */
    var ft = hb.compile(fs.readFileSync(path.join(resources, "flowtime.html"), "utf8"));

    var result = ft(context);

    var $ = cheerio.load(result);
    /* Replace any <splash> elements with some surrounding divs */
    $('splash').each(function(i, elem) {
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

    /* Make any step fragments */
    $('.c-shy').each(function(i, elem) {
	$(elem).removeClass('c-shy');
	$(elem).addClass('ft-fragment');
	$(elem).addClass('shy');
    });

    var pretty = html.prettyPrint($.html(), { indent_size: 2 });
    fs.writeFileSync(path.join(dst, "index.html"), pretty);
}

module.exports.resources = resources;
module.exports.generate = generate;
module.exports.name = "Flowtime Engine";
module.exports.registerHelpers = registerHelpers;
