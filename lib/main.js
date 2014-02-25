'use strict';

function process_slides(root, preamble) {
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

module.exports.process_slides = process_slides;
