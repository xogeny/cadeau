'use strict';

/* Pull in common dependencies */
var path = require('path');
var fs = require('fs-extra');
var yaml = require('js-yaml');
var jade = require('jade');
var marked = require('marked');
var hb = require('handlebars');

/* These are functions to avoid writing repetitive code */
function getMetadata(root) {
    /* These are default values for metadata */
    var defaults = {
	math: true, /* Yay for math! */
	engine: "flowtime",
	static_path: "static"
    };

    /* This is the explicitly specified metadata for the presentation */
    var metadata = root.metadata || {}

    /* This is what we will eventually return. */
    var ret = {}
    
    /* First, plug in default values */
    for (var k in defaults) { ret[k] = defaults[k]; }

    /* Then override */
    for (var k in metadata) { ret[k] = metadata[k]; }

    /* Then return */
    return ret;
}

/* TODO: Just have a convenction that all scripts exist in a js directory? */
function getScripts(root) {
    return getMetadata(root).scripts || [];
}

/* TODO: Just have a convenction that all styles exist in a css directory? */
function getStyles(root) {
    return getMetadata(root).styles || [];
}

/* This indicates where any static files that are required are located.  Note
   that you could put css/ and js/ dirs in here as well and they would automatically
   get moved, but the <link> and <script> tags wouldn't get generated. */
function getStaticPath(root) {
    return getMetadata(root).static_path || [];
}

/* This is the presentation engine used on the backend. */
function getEngine(root) {
    var metadata = getMetadata(root);
    var engpath = "./"+(metadata.engine || "flowtime");
    var eng = require(engpath);
    return eng;
}

/* This function will be exposed as part fo the public API to the
 * bin/cadeau script.  It is used to trigger generation of the
 * main document. */
function generate(context, dst) {
    var metadata = getMetadata(context);
    var eng = getEngine(context);
    eng.generate(context, metadata, dst);
}

/* This function will be exposed as part fo the public API to the
 * bin/cadeau script.  It copies resources to the target directory. */
function copyResources(root, target) {
    var scripts = getScripts(root);
    var styles = getStyles(root);
    var staticPath = getStaticPath(root);

    /* If staticPath is specified and it exists, copy everything in it
       over to the target side */
    if (staticPath && fs.existsSync(staticPath)) {
	var dirs = fs.readdirSync(staticPath);
	for(var i=0;i<dirs.length;i++) {
	    var src = path.join(staticPath, dirs[i]);
	    var dst = path.join(target, dirs[i]);
	    fs.copySync(src, dst);
	}
    }

    /* Copy all scripts */
    var i = null;
    for(i=0;i<scripts.length;i++) {
	var src = scripts[i];
	var dst = path.join(target, src);
	if (fs.existsSync(src)) {
	    fs.copySync(src, dst);
	} else {
	    console.log("Unable to copy "+src+" since it doesn't exist");
	};
    }

    /* Copy all styles */
    for(i=0;i<styles.length;i++) {
	var src = styles[i];
	var dst = path.join(target, src);
	if (fs.existsSync(src)) {
	    fs.copySync(src, dst);
	} else {
	    console.log("Unable to copy "+src+" since it doesn't exist");
	};
    }
}

/* This function goes through the definition of the presentation and
   processes all the slides.  This processing converts them from their
   native markup into HTML. */
function processSlides(root, watchFile) {
    /* Added here because this might be stateful if we start adding
       engine specific helpers. */
    var eng = getEngine(root);


    var slides = root["slides"]
    var auto_page = 0;
    var auto_section = 0;
    var nslides = [];

    /* Iterate over every section in the presentation structure */
    for(var section in slides) {
	var smeta = {};
	var pages = [];
	var nsection = [];

	/* A section can either be a straight list of pages to process
	   or an object with a 'metadata' key and a 'pages' key.  In the case
	   of the latter, the value associated with 'pages' is the list of
	   pages to process. */
	if (slides[section] instanceof Array) {
	    pages = slides[section];
	} else {
	    smeta = slides[section] || {}
	    pages = slides[section]['pages']
	}

	/* Look through the pages to see if one of them is a YAML file.  If so,
	   expand its contents inline.  This only makes sense if the contents of
	   the YAML file are a list (so they can be properly spliced in). */
	for(var pi=0;pi<pages.length;pi++) {
	    var page = pages[pi];
	    /* Is it a YAML file? */
	    if (page.slice(-5)==".yaml") {
		/* If so, what directory is it in.  All file references in the YAML
		   file are assumed to be with relative to the YAML file, so we need
		   this information to build the correct path. */
		var bdir = path.dirname(page);
		/* Grab what should be an array from the YAML file */
		var insert = yaml.safeLoad(fs.readFileSync(page, "utf8"), {"filename": page});
		if (insert instanceof Array) {
		    /* It *IS* an array, so remove the YAML file from the tree and
		       splice in what the YAML file contained. */
		    watchFile(page);
		    pages.splice(pi, 1); // Remove .yaml page
		    for(var j=0;j<insert.length;j++) {
			pages.splice(pi+j, 0, path.join(bdir, insert[j]));
		    }
		} else {
		    /* Report an issue with the tree */
		    console.log("Error processing "+page+", expected list of slide files");
		    console.log("Got: "+insert+" instead");
		}
	    }
	}

	/* OK, now that the tree is finalized, let's loop through it again and
	   do any markup processing. */
	for(var pi=0;pi<pages.length;pi++) {
	    /* This is page information */
	    var page = pages[pi];

	    /* Initialize a bunch of data needed per page */
	    var id = null;
	    var metadata = {};
	    var text = null;
	    var docs = [];
	    var isliteral = false;

	    /* Check if the page is a file */
	    if (fs.existsSync(page)) {
		/* Read the file and see if it is split into 1 or 2 parts */
		var docs = fs.readFileSync(page, "utf8").split("\n---\n");
		watchFile(page);
		if (docs.length==0) {
		    text = "";
		} else if (docs.length==1) {
		    /* If only one part, that is our markup */
		    text = docs[0];
		} else if (docs.length==2) {
		    /* If two parts, the first part is metadata in YAML format */
		    metadata = yaml.safeLoad(docs[0], {"filename": page});
		    text = docs[1];
		} else {
		    /* Bad format */
		    throw page+" contained "+docs.length+" documents, no more than 2 expected";
		}
	    } else {
		/* If we get here, the file didn't exist.  This could be because it
		   was a bad file name.  If it has one of the supported extensions,
		   warn the user. */
		if (page.slice(-5)===".html" ||
		    page.slice(-5)===".yaml" ||
		    page.slice(-3)===".md" ||
		    page.slice(-5)===".jade") {
		    console.log("File "+page+" does not exist, treating as literal");
		    console.log("That is probably not what you want");
		}
		/* Take this text literally.  This is useful for title slides. */
		text = page;
		isliteral = true;
	    }

	    if (isliteral) {
		/* If it is literal, run it through handlebars */
		/* TODO: Is this useful?!?  Probably not. We could probably 
		   just take the raw text as HTML. */
		var template = hb.compile(text);
		var id = "auto-page-"+auto_page;
		auto_page++;
		text = template({"metadata": metadata});
	    } else if (page.slice(-5)===".html") {
		/* If the file ends in .html, run it through handlebars. */
		/* TODO: So far, we aren't using handlebars at all.  I
		   originally envisioned a bunch of pre-defined macros
		   being used.  But it turns out that the polymer-like
		   HTML transformations we do at the end were
		   completely sufficient. */
		var template = hb.compile(text);
		var id = page.slice(0,-5);
		text = template({"metadata": metadata});
	    } else if (page.slice(-3)===".md") {
		/* If it is markdown, process it */
		text = marked(text);
		var id = page.slice(0,-3);
	    } else if (page.slice(-5)===".jade") {
		/* If it is Jade process it. */
		/* TODO: Again, like handlebars, I'm not sure we gain anything
		   by running this througha template engine.  I like the
		   custom tags and pseudo-classes I've used up to this point. */
		var template = jade.compile(text, {
		    filename: page,
		    pretty: true
		});
		var id = page.slice(0,-5);
		text = template({"metadata": metadata});
	    } else {
		console.log("Unable to process page "+page);
	    }
	    /* Adding spaces is necessary to get pretty printing working later. */
	    text = "  "+text.replace(new RegExp("\n", 'g'), "\n  ");
	    nsection.push({"id": id, "html": " "+text, "metadata": metadata});
	}
	nslides.push({"id": section, "pages": nsection, "metadata": smeta});
    }
    var nroot = {};
    for(var k in root) {
	nroot[k] = root[k];
    }
    nroot["slides"] = nslides
    return nroot;
}

/* Export these functions for use by the cadeau script */
module.exports.processSlides = processSlides;
module.exports.copyResources = copyResources;
module.exports.generate = generate;
