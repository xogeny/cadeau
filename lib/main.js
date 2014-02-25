'use strict';
var path = require('path');
var fs = require('fs-extra');

function getMetadata(root) {
    var metadata = root.metadata || {}
    return metadata;
}

function getScripts(root) {
    return getMetadata(root).scripts || [];
}

function getStyles(root) {
    return getMetadata(root).styles || [];
}

function getEngine(root) {
    var metadata = getMetadata(root);
    var engpath = "./"+(metadata.engine || "flowtime");
    var eng = require(engpath);
    return eng;
}

function generate(context, dst) {
    var metadata = getMetadata(root);
    var eng = getEngine(context);
    eng.generate(context, metadata, dst);
}

function copyResources(root, target) {
    var scripts = getScripts(root);
    var styles = getStyles(root);
    var eng = getEngine(root);
    var engdir = eng.resources;

    var cssdir = path.join(engdir, "css");
    if (fs.existsSync(cssdir)) fs.copy(cssdir, target);

    var jsdir = path.join(engdir, "js");
    if (fs.existsSync(jsdir)) fs.copy(jsdir, target);

    var i = null;
    for(i=0;i<scripts.length;i++) {
	var src = scripts[i];
	var dst = path.join(target, src);
	if (fs.existsSync(src)) {
	    fs.copy(src, dst, function(err) {
		if (err) console.log("Error copying "+src+" to "+dst+": "+err);
	    });
	} else {
	    console.log("Unable to copy "+src+" since it doesn't exist");
	};
    }
    for(i=0;i<styles.length;i++) {
	var src = styles[i];
	var dst = path.join(target, src);
	if (fs.existsSync(src)) {
	    fs.copy(src, dst, function(err) {
		if (err) console.log("Error copying "+src+" to "+dst+": "+err);
	    });
	} else {
	    console.log("Unable to copy "+src+" since it doesn't exist");
	};
    }
}

function processSlides(root, preamble) {
    console.log("root = ");
    console.log(root);
    var fs = require('fs');
    var yaml = require('js-yaml');
    var jade = require('jade');
    var marked = require('marked');
    var hb = require('handlebars');
    var slides = root["slides"]
    var auto_page = 0;
    var auto_section = 0;
    var nslides = [];
     for(var section in slides) {
	 var smeta = {};
	 var pages = [];
	 var nsection = [];
	 if (slides[section] instanceof Array) {
	     pages = slides[section];
	 } else {
	     smeta = slides[section] || {}
	     pages = slides[section]['pages']
	 }
	 console.log("Pages for section "+section+": ");
	 console.log(pages);
	 for(var pi=0;pi<pages.length;pi++) {
	     var page = pages[pi];
	     console.log("page = ");
	     console.log(page);

	     /* Initialize a bunch of data needed per page */
	     var id = null;
	     var metadata = {};
	     var text = null;
	     var docs = [];
	     var isliteral = false;

	     if (fs.existsSync(page)) {
		 console.log("File "+page+" exists");
		 var docs = fs.readFileSync(page, "utf8").split("\n---\n");
		 if (docs.length==0) {
		     text = "";
		 } else if (docs.length==1) {
		     text = docs[0];
		 } else if (docs.length==2) {
		     metadata = yaml.safeLoad(docs[0], {"filename": page});
		     text = docs[1];
		 } else {
		     throw page+" contained "+docs.length+" documents, no more than 2 expected";
		 }
	     } else {
		 console.log("File "+page+" does not exist");
		 text = page;
		 isliteral = true;
	     }

	     if (isliteral) {
		 console.log("literal template is: "+preamble+text);
		 var template = hb.compile(preamble+"\n"+text);
		 var id = "auto-page-"+auto_page;
		 auto_page++;
		 text = template({"metadata": metadata});
		 console.log("result is: "+text);
	     } else if (page.slice(-5)===".html") {
		 console.log("template is: "+text);
		 var template = hb.compile(text);
		 var id = page.slice(0,-5);
		 text = template({"metadata": metadata});
		 console.log("result is: "+text);
	     } else if (page.slice(-3)===".md") {
		 console.log("template is: "+text);
		 text = marked(text);
		 var id = page.slice(0,-3);
		 console.log("result is: "+text);
	     } else if (page.slice(-5)===".jade") {
		 console.log("template is: "+preamble+text);
		 var template = jade.compile(preamble+"\n"+text, {
		     filename: page,
		     pretty: true
		 });
		 var id = page.slice(0,-5);
		 text = template({"metadata": metadata});
		 console.log("result is: "+text);
	     } else {
		 console.log("Unable to process page "+page);
	     }
	     nsection.push({"id": id, "html": text, "metadata": metadata});
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

module.exports.processSlides = processSlides;
module.exports.copyResources = copyResources;
module.exports.generate = generate;
