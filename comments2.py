import praw, json, argparse
from StringIO import StringIO
from praw.handlers import MultiprocessHandler

parser = argparse.ArgumentParser(description="Reddit comment scraper v2")
parser.add_argument("-t", "--total", metavar="total number of comments to get")
parser.add_argument("-r", "--reddit", metavar="subreddit to scrape")
parser.add_argument("-i", "--id", metavar="identifier")
args = parser.parse_args()
id = "1" if not args.id else args.id

handler = MultiprocessHandler()
r = praw.Reddit(user_agent="comment scraper bot thing 2.0 by /u/hansolo669: " + id, handler=handler)
sub = "pics" if not args.reddit else args.reddit
total = 2000 if not args.total else args.total

ft = open("comments_"+sub+".txt", "a")
fj = open("comments_"+sub+".json", "w")
io = StringIO()
io.write("[")

i = 0
top = r.get_subreddit(sub).get_top_from_month(limit=100)
for submission in top:
	if i == total:
		break
	submission.replace_more_comments(1)
	tree = praw.helpers.flatten_tree(submission.comments)
	for comment in tree:
		ft.write(comment.body.encode('ascii', 'ignore')+" ")
		json.dump({"body":comment.body, "score":comment.score, "created":comment.created_utc, "gilded":comment.gilded}, io)
		io.write(",") if i < total-1 else io.write("")
		i += 1
		print "\r {} comments".format(i),
		if i == total:
			break

io.write("]")
fj.write(io.getvalue())
io.close()
ft.close()