(function(){
	var workers = [];
	document.addEventListener("DOMContentLoaded", function(event) {
		var counts = {};
		load("pics");
		function load(sub){
			counts = {};
			d3.text("comments_"+ sub +".txt", function(err, txt){
				info("getting comments");
				var words = txt.split(/\s|\r\n|\r|\n/);
				info("formatting text");
				words = format(words);
				info("counting words");
				for (var i = 0; i < words.length; i++) {
					if (!words[i].match(/\d/)) {
						if (counts[words[i]] == null) {
							counts[words[i]] = 1;
						} else {
							counts[words[i]]++;
						}
					}
				}
				elem("stats").textContent = "2000 comments, " + words.length + " individual words, " + Object.keys(counts).length + " unique words";
				plot(counts, 3, 20);
			});
		}
		elem('sub').addEventListener("change", function(event){
			load(event.target.value);
		});
		elem('opts').addEventListener("submit", function(event){
			event.stopPropagation();
			event.preventDefault();
			var min = elem('min').value;
			var amount = elem('amount').value;
			var common = !elem("common").checked
			plot(counts, min, amount, common);
		});
	});

	function plot(uniques, minlen, amount, common) {
		var userfilter = {};
		if (typeof amount === "undefined" && elem('amount').value === 20) { 
			amount = 20; 
		} else {
			amount = elem('amount').value
		}

		if (typeof common === "undefined" && !elem("common").checked) { 
			common = true;
		} else {
			common = !elem("common").checked;
		}

		if (elem('min').value !== minlen) { minlen = elem('min').value};

		if (elem('filter').value !== ''){
			values = elem('filter').value.split(" ");
			for (var i = values.length - 1; i >= 0; i--) {
				userfilter[values[i]] = values[i];
			}
		}

		if (document.getElementsByClassName("bubble")[0]){
			document.getElementsByClassName("bubble")[0].remove();
		}
		if (workers[0]) {
			workers[0].terminate();
			workers.pop();
		}
		info("filtering results");
		if (!window.Worker) {
			var words = []
			//we have to duplicate the worker code on the off chance a browser doesn't support webworkers
			//I'm looking at you IE
			//actually I don't even know if this will work in IE...
			//oh apprently this does work in IE >= 10...
			//maybe, just maybe, I can remove this... 
			var common = {"the":"the", "be":"be", "to":"to", "of":"of", 
						"and":"and", "a":"a", "in":"in", "that":"that", 
						"have":"have", "i":"i", "it":"it", "for":"for", 
						"not":"not", "on":"on", "with":"with", "he":"he", 
						"as":"as", "you":"you", "do":"do", "at":"at", "this":"this", 
						"but":"but", "his":"his", "by":"by", "from":"from", 
						"they":"they", "we":"we", "say":"say", "her":"her", 
						"she":"she", "or":"or", "an":"an", "will":"will", 
						"my":"my", "one":"one", "all":"all", "would":"would", 
						"there":"there", "their":"their", "what":"what", 
						"so":"so", "up":"up", "out":"out", "if":"if", "about":"about", 
						"who":"who", "get":"get", "which":"which", "go":"go", 
						"me":"me", "when":"when", "make":"make", "can":"can", 
						"like":"like", "time":"time", "no":"no", "just":"just", 
						"him":"him", "know":"know", "take":"take", "people":"people", 
						"into":"into", "year":"year", "your":"your", "good":"good", 
						"some":"some", "could":"could", "them":"them", "see":"see", 
						"other":"other", "than":"than", "then":"then", "now":"now", 
						"look":"look", "only":"only", "come":"come", "its":"its", 
						"over":"over", "think":"think", "also":"also", "back":"back", 
						"after":"after", "use":"use", "two":"two", "how":"how", 
						"our":"our", "work":"work", "first":"first", "well":"well", 
						"way":"way", "even":"even", "new":"new", "want":"want", 
						"because":"because", "any":"any", "these":"these", "give":"give", 
						"day":"day", "most":"most", "us":"us"};
			keys = Object.keys(uniques);
			var i = 0;
			for (var i = 0; i < keys.length; i++) {
				var k = keys[i];
				var v = m.data.data[keys[i]];
				if (!(common == true && k in common || k in userfilter || k.length < m.data.minlen)){
					words.push({word:k, value:v});
				}
				i++;
				info("filtered: "+((i/keys.length)*100).toString().slice(0,5)+"%");
			}
			draw(words);
		} else {
			var worker = new Worker("cull.js");
			workers.push(worker);
			worker.postMessage({data:uniques, minlen:minlen, common:common, userfilter:userfilter});
			worker.onmessage = function(m){
				if (m.data.status == "info") {
					info(m.data.data);
				}
				if (m.data.status == "done") {
					draw(m.data.data);
				}
			};
		}
		function draw(words){
			info("sorting");
			words = words.sort(function(a,b){return b.value - a.value;}).slice(0,amount);

			info("plotting");
			var diameter = 960,
			    format = d3.format(",d"),
			    color = d3.scale.category20c();

			var bubble = d3.layout.pack()
			    .sort(null)
			    .size([diameter, diameter])
			    .padding(1.5);

			var svg = d3.select("body").append("svg")
			    .attr("width", diameter)
			    .attr("height", diameter)
			    .attr("class", "bubble");

			var node = svg.selectAll(".node")
				.data(bubble.nodes({children: words}))
				.enter().append("g")
			 	.attr("class", "node")
			  	.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

			node.append("title").text(function(d){ return d.word; });
			node.append("circle")
				.attr("r", function(d) { return d.r; })
				.style("fill", function(d) { return color(d.word); });;
			node.append("text")
			  .attr("dy", ".3em")
			  .style("text-anchor", "middle")
			  .text(function(d) { return d.word; });
			node.append("text")
				.attr("dy", ".3em")
				.style("text-anchor", "middle")
				.attr("transform", "translate(0,20)")
				.text(function(d) { return d.value; });
			d3.select(self.frameElement).style("height", diameter + "px");
		}
	}

	function format(words){
		var temp = [];
		words = words.map(function(word){//peliminary data normilization. A lot of pointless stuff gets reduced to "" or " ", which is kinda nice.
			var a = word.toLowerCase()
			.replace(/[h|f]t+ps?/g, "")//removes http/https/ftp
			.replace(/www\.?|\.com/g, "")
			.replace(/\/?(r|u|message)\/\w+/g,"")
			.replace(/\d+|\\|\/|\&((gt|lt|amp)\;)+/g, " ")//replaces digits and slashes with spaces, also &gt|lt|amp;
			.replace(/[^A-Za-z|\'|\"]/g, " ")
			.replace(/\'|\"/g,"")
			.trim().split(" ");
			if (a.length > 0) temp = temp.concat(a.slice(1,a.length));
			return a[0];
		});
		words = words.concat(temp);
		words = words = words.filter(function(x){//filter out spaces
			if (x !== "" || x !== " ") { return x; }
		});
		return words;
	}

	function elem(elem){
		return document.getElementById(elem);
	}
	window.elem = elem;
	
	function info(a){
		elem('info').textContent = a;
	}
})();