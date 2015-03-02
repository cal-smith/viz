(function(){
	var workers = [];
	var counts = {};
	document.addEventListener("DOMContentLoaded", function(event) {
		if (window.location.hash) {
			window.args = window.decodeURI(window.location.hash).slice(1).split('&').map(function(x){return x.split('=');});
			for (var i = 0; i < args.length; i++) {
				if (args[i][0] === 'common') {
					elem(args[i][0]).checked = args[i][1] === 'true'?true:false;
				} else if (args[i][0] === 'sub'){
					for (var j = 0; j < elem('sub').length; j++) {
						if(elem('sub')[j].value === args[i][1]){
							elem('sub').selectedIndex = j;
						}
					}
				} else if (args[i][0] === 'month'){
					for (var j = 0; j < elem('month').length; j++) {
						if(elem('month')[j].value === args[i][1]){
							elem('month').selectedIndex = j;
						}
					}
				} else {
					elem(args[i][0]).value = args[i][1];
				}
			}
		}

		elem('sub').addEventListener("change", function(event){
			update_hash();
			load(elem('sub').value, elem('month').value);
		});

		elem('month').addEventListener("change", function(event){
			update_hash();
			load(elem('sub').value, elem('month').value);
		});

		elem('opts').addEventListener("submit", function(event){
			event.stopPropagation();
			event.preventDefault();
			update_hash();
			plot(counts, min, amount, common);
		});

		elem('reset').addEventListener('click', function(event){
			event.stopPropagation();
			event.preventDefault();
			elem('min').value = 3;
			elem('amount').value = 20;
			elem('filter').value = '';
			elem('common').checked = false;
			update_hash();
			plot(counts);
		});

		load(elem('sub').value, elem('month').value);
	});

	function load(sub, month){
		counts = {};
		d3.text(month + "/comments_"+ sub +".txt", function(err, txt){
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
			elem("stats").textContent = words.length + " individual words, " + Object.keys(counts).length + " unique words";
			plot(counts, 3, 20);
		});
	}

	function plot(uniques, minlen, amount, common) {
		var userfilter = {};

		if (elem('min').value !== minlen) { minlen = elem('min').value};
		
		if (typeof amount === "undefined" && elem('amount').value === 20) { 
			amount = 20; 
		} else {
			amount = elem('amount').value
		}

		if (typeof common === "undefined" && elem("common").checked) { 
			common = false;
		} else {
			common = elem("common").checked;
		}

		if (elem('filter').value !== ''){
			values = elem('filter').value.split(" ");
			for (var i = 0; i < values.length; i++) {
				userfilter[values[i]] = values[i];
			}
		}

		if (document.getElementsByClassName("bubble")[0]){
			document.getElementsByClassName("bubble")[0].remove();
		}

		info("filtering results");
		//the secret sauce - webworkers
		if (workers[0]) {
			workers[0].terminate();
			workers.pop();
		}
		var worker = new Worker("filter.js");
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

		//d3 magic
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

	//helper functions, etc
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

	function update_hash(){
		var min = elem('min').value;
		var amount = elem('amount').value;
		var common = elem('common').checked;
		var userfilter = elem('filter').value;
		var sub = elem('sub').value;
		var month = elem('month').value;
		window.location.hash = encodeURI("sub="+ sub + "&month=" + month + "&min="+ min +"&amount="+ amount +"&common="+common +"&filter="+ userfilter);
	}

	function elem(elem){
		return document.getElementById(elem);
	}
	window.elem = elem;
	
	function info(a){
		elem('info').textContent = a;
	}
})();