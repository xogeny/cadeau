'use strict';

/* Pull in common dependencies */
var path = require('path');
var fs = require('fs-extra');
var yaml = require('js-yaml');
var jade = require('jade');
var marked = require('marked');
var swig = require('swig');
var cheerio = require('cheerio');
var colors = require('colors');
var url = require('url');

/* Disable swig caching.  This will cause problems
   when watching. */
swig.setDefaults({ cache: false });

function warningMsg(text) {
    console.log("Warning".yellow+": "+text)
}

function errorMsg(text) {
    console.log("ERROR".red+": "+text)
}

/* These are functions to avoid writing repetitive code */
function getMetadata(root) {
    /* These are default values for metadata */
    var defaults = {
	title: '',
	desc: null,
	authors: [],
	url: null,
	image: null,
	favicon: null,
	bower: [], /* Bower packages to bundle with presentation */
	math: true, /* Yay for math! */
	engine: "flowtime",
	draft: false,
	static_path: "static",
	styles: [],
	scripts: [],
	clicker: true,
	touch: false, /* Try to support touch */
	animation: true,
	includes: [],
	serve: [],
	appendix: ''
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

function getScripts(root) {
    return getMetadata(root).scripts;
}

function getBowerDependencies(root) {
    return getMetadata(root).bower;
}

function getStyles(root) {
    return getMetadata(root).styles;
}

/* This indicates where any static files that are required are located.  Note
   that you could put css/ and js/ dirs in here as well and they would automatically
   get moved, but the <link> and <script> tags wouldn't get generated. */
function getStaticPath(root) {
    return getMetadata(root).static_path;
}

function getEngineName(root) {
    var metadata = getMetadata(root);
    return (metadata.engine || "flowtime");
}

/* This is the presentation engine used on the backend. */
function getEngine(root) {
    var engpath = "./"+getEngineName(root);
    var eng = require(engpath);
    return eng;
}

/* This function will be exposed as part fo the public API to the
 * bin/cadeau script.  It is used to trigger generation of the
 * main document. */
function generate(context, filename, dst) {
    var metadata = getMetadata(context);
    var eng = getEngine(context);
    eng.generate(context, metadata, filename, dst);
    if (metadata['package']) {
	var p = {
	    "name": metadata.title,
	    "main": "index.html",
	    "window": {
		"title": metadata.title
	    }
	};
	for(var k in metadata['package']) {
	    p[k] = metadata['package'][k];
	}
	fs.writeFileSync(path.join(dst, "package.json"),
			 JSON.stringify(p, null, 4))
    }
}

function copyEngineResources(root, dirname, dst) {
    var engname = getEngineName(root);
    var resources = path.join(path.dirname(module.filename), engname);
    var dir = path.join(resources, dirname);
    if (fs.existsSync(dir)) fs.copySync(dir, path.join(dst, dirname));
    else { console.log("Couldn't find directory "+dir+" for engine "+engname); }
}

/* This function will be exposed as part fo the public API to the
 * bin/cadeau script.  It copies resources to the target directory. */
function copyResources(root, watchFile, target) {
    var scripts = getScripts(root);
    var styles = getStyles(root);
    var deps = getBowerDependencies(root);
    var metadata = getMetadata(root);
    var staticPath = getStaticPath(root);
    var watchFilter = function(name) {
	/* This is a sneaky way of keeping an eye
	   on what files are actually copied. */
	watchFile(src);
	return true;
    };

    /* Install bower dependencies */
    if (deps.length>0) {
	var bower = {name: metadata.title, dependencies: {}}; // will be written as bower.json
	for(var i=0;i<deps.length;i++) {
	    var data = deps[i].split("#");
	    if (data.length==1) {
		bower.dependencies[data[0]] = "*";
	    } else if (data.length==2) {
		bower.dependencies[data[0]] = data[1];
	    } else {
		errorMsg("Unrecognized dependency requirement: "+deps[i]);
	    }
	}
	fs.writeFileSync(path.join(target, "bower.json"), JSON.stringify(bower, null, 4));
    }
    

    /* Copy resources associated with cadeau over */
    var resdir = path.join(path.dirname(module.filename), "static");
    if (fs.existsSync(resdir)) fs.copySync(resdir, target);
    else { errorMsg("Couldn't locate cadeau resource directory "+resdir); }

    /* If staticPath is specified and it exists, copy everything in it
       over to the target side */
    if (staticPath && fs.existsSync(staticPath)) {
	var dirs = fs.readdirSync(staticPath);
	for(var i=0;i<dirs.length;i++) {
	    var src = path.join(staticPath, dirs[i]);
	    var dst = path.join(target, dirs[i]);
	    fs.copySync(src, dst, watchFilter);
	}
    }

    /* Copy all scripts */
    var i = null;
    for(i=0;i<scripts.length;i++) {
	var src = scripts[i];
	var dst = path.join(target, src);
	if (fs.existsSync(src)) {
	    fs.copySync(src, dst, watchFilter);
	} else {
	    var parsed = url.parse(src);
	    if (parsed.protocol===null) {
		errorMsg("Unable to copy "+src.underline+" since it doesn't exist");
	    }
	};
    }

    /* Copy all styles */
    for(i=0;i<styles.length;i++) {
	var src = styles[i];
	var dst = path.join(target, src);
	if (fs.existsSync(src)) {
	    fs.copySync(src, dst, watchFilter);
	} else {
	    var parsed = url.parse(src);
	    if (parsed.protocol===null) {
		errorMsg("Unable to copy "+src.underline+" since it doesn't exist");
	    } else {
		console.log("Assuming "+src+" is a link");
	    }
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
    var pmeta = getMetadata(root);

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

	if (pages===undefined || pages===[] || pages===null) {
	    warningMsg("Section '"+section+"' doesn't contain any pages");
	    pages = [];
	}

	var section_id = section;
	if (smeta.metadata && smeta.metadata.id)
	    section_id = smeta.metadata.id;

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
		    errorMsg("For page "+page.underline+
			     ", expected list of slide files, got "+insert+" instead");
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
	    var filename = "<literal>";

	    /* Check if the page is a file */
	    if (fs.existsSync(page)) {
		/* Read the file and see if it is split into 1 or 2 parts */
		var docs = fs.readFileSync(page, "utf8").split("\n---\n");
		watchFile(page);
		filename = page;
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
		    warningMsg("File "+page.underline+
			       " does not exist, treating as literal");
		}
		/* Take this text literally.  This is useful for title slides. */
		text = page;
		isliteral = true;
	    }

	    if (isliteral) {
		/* If it is literal, run it through handlebars */
		var id = "auto-page-"+auto_page;
		auto_page++;
	    } else if (page.slice(-5)===".html") {
		/* If the file ends in .html, run it through swig. */
		var template = null;
		var preamble = ""

		if (metadata['include'] && metadata['extends']) {
		    /* Some kind of bug/limitation in Swig */
		    warningMsg("Extends option override includes option in "+page);
		}

		var efile = metadata['extends'];
		if (efile) {
		    /*** Process extends metadata ***/
		    /* tfile is where the template actually exists on the file system.
		       This is necessary when slides are nested in directories. */
		    var tfile = path.join(path.dirname(page), metadata['extends']);
		    if (!fs.existsSync(tfile)) {
			errorMsg("slide "+page.underline+
				 " extends from non-existent template "+tfile);
		    } else {
			watchFile(tfile); // Watch the template file if it exists
		    }
		    /* Prepend some text to the markup to extend from the template */
		    preamble = preamble + '{% extends "'+efile+'" %}\n'
		}

		/* Massage include metadata into an array */
		var ifiles = []

		ifiles = ifiles.concat(pmeta.includes)
		if (metadata['include']) {
		    if (metadata['include'] instanceof Array) {
			ifiles = ifiles.concat(metadata['include'])
		    } else if (typeof(metadata['include'])==='string') {
			ifiles.push(metadata['include'])
		    } else {
			errorMsg("include metadata must be either a filename or "+
				 "a list of filenames");
		    }
		}

		/*** Process include files ***/
		for(var i=0;i<ifiles.length;i++) {
		    if (!fs.existsSync(ifiles[i])) {
			errorMsg("slide "+page.underline+
				 " includes non-existent template "+ifiles[i]);
		    } else {
			watchFile(ifiles[i]); // Watch the template file if it exists
			preamble = preamble + '{% include "'+ifiles[i]+'" %}\n'
		    }
		}

		/*** Add premable ***/
		text = preamble+text
		template = swig.compile(text, { filename: page });
		var id = page.slice(0,-5).replace("/","_");
		text = template({"metadata": metadata});
	    } else if (page.slice(-3)===".md") {
		/* If it is markdown, process it */
		text = marked(text);
		var id = page.slice(0,-3).replace("/","_");
	    } else if (page.slice(-5)===".jade") {
		/* If it is Jade process it. */
		/* I don't think Jade gives us much as a templating engine,
		   but the shorthand markup can be quite nice. */
		try {
		    var template = jade.compile(text, {
			filename: page,
			pretty: true
		    });
		    var id = page.slice(0,-5).replace("/","_");
		    text = template({"metadata": metadata});
		} catch(err) {
		    errorMsg("Error during jade processing: " + err);
		    text = "<pre>"+text+"</pre>";
		}
	    } else {
		errorMsg("Unable to process page "+
			 page.underline+", unknown type");
	    }

	    /** Some HTML transforms **/
	    /* Adding spaces is necessary to get pretty printing working later. */
	    /* text = "  "+text.replace(new RegExp("\n", 'g'), "\n  "); */

	    var $ = cheerio.load(text);

	    $("div").each(function(i, elem) {
		if (metadata.id) {
		    /* Flowtime won't let us assign an id, they take it
		       away at runtime, so we use a custom attribute since
		       CSS rules can still be written for this. */
		    $(elem).attr("c-id", metadata.id);
		}
		if (metadata['class']) {
		    /* Flowtime strips this too.  And I'm not sure how to work
		       around that. */
		    $(elem).addClass(metadata['class']);
		}
	    });

	    /* An element indicating all embedded lists or lists
	       immediately following it (to support Markdown) should
	       have their list items be marked for stepping. */
	    $('steplist').each(function(i, elem) {
		var stepitems = function(i, list) {
		    $(list).children("li").each(function(i, li) {
			$(li).addClass("c-step")
		    });
		};
		$(elem).children("ul").each(stepitems);
		var nul = $(elem).next("ul");
		nul.each(stepitems);
		var was = $(elem).html();
		$(elem).replaceWith(was);
	    });

	    /* Now store this markup away */
	    nsection.push({"id": id, "html": $.html(),
			   "metadata": metadata,
			   "pagenum": pi,
			   "file": filename});
	}
	nslides.push({"id": section_id, "pages": nsection, "metadata": smeta});
    }
    var nroot = {};
    for(var k in root) {
	nroot[k] = root[k];
    }
    nroot["slides"] = nslides;
    return nroot;
}

/* Export these functions for use by the cadeau script */
module.exports.processSlides = processSlides;
module.exports.copyResources = copyResources;
module.exports.copyEngineResources = copyEngineResources;
module.exports.generate = generate;
