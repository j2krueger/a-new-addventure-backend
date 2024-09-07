# A New Addventure

The goal of this project is to develop a collaborative fiction website similar to the ["Choose Your Own Adventure"](https://en.wikipedia.org/wiki/Choose_Your_Own_Adventure) series of books, but with the added twist that users can add their own writing, either starting a new story, or adding new choices and continuations to existing stories.

My desire to do this project has been inspired by "The Anime Addventure", a website that worked similarly that I used to frequent, which is sadly now defunct.

Out of a desire to give back to the community, and hope that I can start a new website that is at least as enjoyable as the old one, I intend to deploy this project for public use once it is in a usable state, and make it open source for anyone to download and deploy.

I'm looking for a front end or full stack dev, but I probably wouldn't say no to another back end dev.

Below this point are a slightly longer description of what I want the website to do, with a small example, and a rough outline of how I think the back end will likely be put together. The first part of the project is going to be, as a team, refining this outline into a back end specification, and making a specification for the front end/UI.

---

The idea behind the website is that any logged in user can post a chapter. A chapter can be either the start of a new story, or a continuation of an existing story, regardless of who posted the chapter being continued from or whether the chapter being continued from has any existing continuations. Each continuation will have to include a piece of "choice text", which will be used at the end of the post they are continuing to indicate options to future readers.

For example, suppose user Alice starts a new story called "Jerry's Journey" with the following text:

>Jerry was walking along a road, when he came to a fork in the road.

Alice can then post another chapter continuing the story with the choice text "Jerry followed the left path" and the text

>Jerry walked another mile along the left path, when a moose came out of nowhere and tried to bite him!

Bob can also continue from Alice's initial chapter with the choice text "Jerry looked more closely at the fork in the road." and the text

> The fork looked like it was made out of gold! He picked it up and put it in his pocket, then walked to the next village where he sold it.

At this point the original chapter would look something like this:

---
 **Jerry's Journey** by *Alice*

 Jerry was walking along a road, when he came to a fork in the road.
 
 - [Jerry followed the left path](https://example.com)
 - [Jerry looked more closely at the fork in the road.](https://example.com)
---

Story text will be licensed under [Creative Commons BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) (probably). Maybe let users chose a different license or public domain?

I'm leaning towards an MIT license for the code, but initial collaborators will have a say in this.

---
## Intended Capabilities:
- Anyone can read, only logged in users can post/edit/delete
- post a chapter that starts a story
	- story title
	- chapter title
	- author by login 
	- keywords
	- body
- post a chapter that continues a story
	- chapter title
	- author
	- keywords
	- body
- edit a chapter (creator/mod/admin only) (keep all versions?, only display last)
- delete a chapter (mod/admin only)
- flag a chapter
- edit keywords for a chapter (author/mods/admins can add keywords)
	- the keywords "NSFW", "SEX", "GORE", and "FF.(title)":
		- Must be marked when applicable
		- are automatically propagated to all continuations
		- may only be removed by mod/admin/?creator?
		- "FF.(title)" indicates fan fiction, e.g. "FF.Gurren Lagann"
- register user
	- username
	- password
	- email
- login
- logout
- profile/settings
	- light/dark mode
	- checkbox to make email public - DEFAULTS TO PRIVATE!
	- bio
	- avatar/picture
	- tag blacklist - defaults to "NSFW", "SEX", "GORE"
	- comment viewing options
	- store all relevant settings (light/dark mode, etc) in localStorage for everyone
	- store all settings on server for logged in users
- show a chapter
- show a chain of chapters up to a specified endpoint
- search by:
	- all
	- author
	- keywords
	- (story/branch/chapter) title text
	- body text
	- choice text
	- order by:
		 - latest
		 - lex by author
		 - lex by title
		 - length of text
		 - length of chain/depth?
		 - biggest subtree?
		 - most children
		 - popularity?
		 - rating?
- Flag:
	- chapter
- timeout on email validation


---

## Software tools/libraries:
- "use strict";
- git/github
- node/npm
- MongoDB/Mongoose
- express
- express-session
- bcrypt
- morgan
- nodemailer
- eslint
- mocha/chai/chai-http



---
## Database schemas:

```
created indices:
collection: chapters
{
  	authorName: "hashed"
}
{
	storyId: "hashed"
}
{
	previousChapter: "hashed"
}

collection: users
{
	userName: "hashed"
}
{
	email: "hashed"
}

collection: follows
{
	follower: "hashed"
}
{
	following: "hashed"
}

collection: likes
{
	user: "hashed"
}
{
	chapter: "hashed"
}

collection users: {
  _id: ObjectId,
  userName: String,
  email: String,
  passwordHash: String,
  admin: Boolean,
  moderator: Boolean,
  locked: Boolean,
  bio: String,
  publishEmail: Boolean,
  darkMode: Boolean,
}

collection chapters: {
  _id: ObjectId,
  storyId: ObjectId,	// references collection chapters
  authorName: String,
  chapterTitle: String,
  storyTitle: String,
  bodyText: String,
  previousChapter: ObjectId,	// references collection chapters
  keywords: [String],	// New field, needs multikey index <=========================
  createDate: Date,
}

collection bookmarks: {
	_id: ObjectId,
	user: ObjectId,	// references collection users
	chapter: ObjectId,	// references collection chapters
	createDate: Date,
}

collection flags: {
	_id: ObjectId,
	user: ObjectId,	// references collection users
	chapter: ObjectId,	// references collection chapters
	reason: String,
	createDate: Date,
}

collection follows: {
	_id: ObjectId,
	follower: ObjectId,	// references collection users
	following: ObjectId,	// references collection users
}

collection likes: {
	_id: ObjectId,
	user: ObjectId,	// references collection users
	chapter: ObjectId,	// references collection chapters
}

collection messages: {
	_id: ObjectId,
	name: String,
	email: String,
	messageText: String,
	createDate: Date,
	verified: Boolean,
	read: Boolean,
}


sessions - managed entirely by express-session
```

---

## Chapter Search (GET /chapter?search="...")

When searching for a chapter, for the most part you should just need to enter one or more search words and the site should return all of the chapters that include each search word in at least one of the following places: the body text of the chapter, the chapter title, the story title, the author name, or keywords.

For more control over where a search word should be searched for, you can prefix that particular word with one or more field specifiers and a colon. For example, if you know the name of the author of the chapter you're looking for is ***Freddy***, you can include the term `A:Freddy`, and the search will only match chapters written by the user ***Freddy***, but not the users ***freddy***, ***FreddyMercury***, or ***GetFreddyGetSetGo***. If you only know or remember part of the author's name, you can include the term `a:Freddy`, and the search can match chapters by any of the above users, but not by ***Fredy*** or ***Fred-dy***. Neither term will match against a chapter written by the user ***Michael*** even if it has the name ***Freddy*** in the body text.

You can also combine multiple field specifiers in one search term, and the term will match as long as the word is in one of the fields specified. The term `Ab:Freddy`, for example, will match any chapter written by the user ***Freddy***, as well as any chapter containing ***Freddy***, ***freddy***, ***FREDDY***, or ***getfreddygetsetgo*** in the body text. Any word with no field specifier prefix acts exactly as if it were prefixed with `seabK:`.

Specifies a case insensitive match to any part of the field:
 - s: story title
 - e: chapter title
 - a: author name
 - b: body text
 - k: keywords

Specifies a case sensitive match to the entire field:
 - S: story title
 - E: chapter title
 - A: author name
 - K: keywords


By default, the returned chapters are sorted with the newest ones first and the oldest ones last, but you can also specify the sort order of the list of returned chapters by adding a term starting with `o:`, followed by one or more of the following field specifiers:

 - s: story title
 - e: chapter title
 - a: author name
 - l: number of likes
 - c: creation date of the chapter

 If multiple field specifiers are used, earlier ones will always have priority over later ones. For example, `o:aC` will put all chapters written by ***ABBA*** before any chapters by ***Freddy***, but all of ***ABBA***'s chapters will be sorted newest first, and so will all of ***Freddy***'s chapters.

If a field specifier is lowercase, then that field will be sorted in ascending order (a to z, lower numbers before higher numbers, earliest/oldest to latest/newest), and if the field specifier is uppercase, that field will be sorted in decending order (z to a, higher numbers before lower numbers, latest/newest to earliest/oldest). Text is always sorted in a case insensitive way, so ***ABBA*** and ***anonymouse*** will both be before ***ZZZ*** and ***zzz***. 