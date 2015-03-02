document.addEventListener("DOMContentLoaded", function(event) {
	subs = ["askreddit", "askscience", "atheism", "games", "gaming", "iama", "mildlyinteresting", "music", "pics", "science", "technology", "tifu", "worldnews"];
	load(subs, draw);
	function load(subs, callback) {
		avg = [];
		subs.forEach(function(x, index, array){
			done = 0;
			d3.json("january/comments_"+ x +".json", function(e, json){
				var total_words = 0;
				var total_score = 0;
				for (var i = 0; i < json.length; i++) {
					var temp = [];
					var words = json[i].body.split(/\s|\r\n|\r|\n/);
					words = format(words)
					json[i].body = words;
					total_words += json[i].body.length;
					total_score += json[i].score;
				}
				avg.push({avg:total_words/json.length, sub:x});
				done++;
				if (done == array.length-1) {
					callback(avg);
				}
			});
		});
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
	function draw(avgs){
		console.log(avgs);
		var width = 960,
		height = 500;
		var y = d3.scale.linear().range([200, 0]);
		var chart = d3.select("#avg").append("svg").attr("width", width).attr("height", height);
		y.domain([0, 500]);
		var barWidth = width/avgs.length;
		var bar = chart.selectAll("g")
				.data(avgs).enter().append("g")
				.attr("transform", function(d, i) { return "translate(" + i * barWidth + ",0)"; });
		bar.append("rect")
			.attr("y", function(d) { return y(d.avg);})
			.attr("height", function(d) { return height - y(d.avg); })
			.attr("width", barWidth - 1);
		bar.append("text")
			.attr("x", barWidth / 2).attr("y", function(d) { return y(d.avg) + 3; })
			.attr("dy", ".75em")
			.text(function(d) { return d.sub; });
	}
});