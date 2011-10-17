/*### BEGIN LICENSE
# Copyright (C) 2011 Stephan Tetzel <info@zefanjas.de>
# This program is free software: you can redistribute it and/or modify it 
# under the terms of the GNU General Public License version 3, as published 
# by the Free Software Foundation.
# 
# This program is distributed in the hope that it will be useful, but 
# WITHOUT ANY WARRANTY; without even the implied warranties of 
# MERCHANTABILITY, SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR 
# PURPOSE.  See the GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License along 
# with this program.  If not, see <http://www.gnu.org/licenses/>.
### END LICENSE*/

enyo.kind({
    name: "BibleZ.Scroller",
    kind: "SnapScroller",
    index: 1,
	//onSnap: "changeChapter",
    flex: 1,
    autoVertical: false,
    vertical: false,
	//className: "scroller-background",
	events: {
      onVerseTap: "",
	  onShowNote: "",
	  onShowFootnote: "",
	  onPrevChapter: "",
	  onNextChapter: ""
    },
	published: {
		numberOfSnappers: 0,
		sidebarWidth: 0,
		popupLeft: 0,
		popupTop: 0,
		tappedVerse: 1,
		tappedNote: 0,
		notes: [],
		bookmarks: [],
		highlights: [],
		vnumber: 0,
		linebreak: false
	},
    components: [
        {kind: "ApplicationEvents", onWindowRotated: "windowRotated"},
		{name: "firstSnapper", components: [
			{name: "prevChapter", content: "Previous Chapter", className: "chapter-nav-left chapter-nav"}			
		]},
		{name: "mainView", kind: "HtmlContent", allowHtml: true, content: "Das ist ein Test", className: "view-verses", onLinkClick: "handleVerseTap"}
        
    ],
	
	create: function () {
		this.inherited(arguments);
		this.setIndex(1);
		this.$.prevChapter.hide();
		this.starter = 0;
		//enyo.keyboard.forceHide();
	},
	
	rendered: function () {
		this.inherited(arguments);
		if (this.starter === 0) {
			this.setIndex(1);
			//this.$.mvContainer.addStyles("width: " + this.node.clientWidth + "px;");
			this.$.firstSnapper.addStyles("width: " + this.node.clientWidth + "px;");
		}
		this.starter = 1;
		
		//enyo.log(this.$.mainView.hasNode());
	},
	
	changeChapter: function (inSender, inEvent) {
		//console.log("CHANGE CHAPTER... " + this.index);
		if (this.index === 0) {
			this.doPrevChapter();
		} else if (this.index == this.numberOfSnappers + 2) {
			this.doNextChapter();
		}
	},
	
	getVerseContent: function(vnumber) {
		
	},

	getIndexLeft: function () {
		return -1;
	},
    
    setVerses: function (verses, vnumber) {
		this.vnumber = vnumber;
		this.setIndex(1);
		//enyo.log("NODE1: ", this.node.clientWidth, this.node.clientHeight);
		//var height = this.node.clientHeight - 40;
		//var width = this.node.clientWidth - 40;
		//enyo.log("VARS:", width, height, widthMV,  heightMV);
		//this.$.mainView.addStyles("height: " + height + "px;");
		//this.$.mainView.addStyles("width: " + width + "px;");

		this.$.mainView.setContent(biblezTools.renderVerses(verses, vnumber, this.linebreak));
		this.setSnappers(this.vnumber);
		this.windowRotated();
	},
	
	handleVerseTap: function(inSender, inUrl) {
		//enyo.log(inUrl + " " + inUrl.match(/.*\:\/\//i));
		var urlParams = biblezTools.getUrlParams(inUrl);
		if (inUrl.match(/.*\:\/\//i) == "verse://") {
			this.tappedVerse = inUrl.replace("verse://","");
			this.popupTop = enyo.byId(inUrl.replace("verse://","")).getBoundingClientRect().top;
			this.popupLeft = enyo.byId(inUrl.replace("verse://","")).getBoundingClientRect().left;
			this.doVerseTap();
		} else if (inUrl.match(/.*\:\/\//i) == "note://") {
			this.tappedNote = parseInt(inUrl.replace("note://","").split(":")[0], 10);
			this.tappedVerse = parseInt(inUrl.replace("note://","").split(":")[1], 10);		
			this.popupTop = enyo.byId("note" + this.tappedNote).getBoundingClientRect().top;
			this.popupLeft = enyo.byId("note" + this.tappedNote).getBoundingClientRect().left;
			this.doShowNote();
		} else if (urlParams.action == "showNote") {
			enyo.application.currentFootnote = enyo.application.verses[parseInt(urlParams.passage.split(":")[1], 10)-1].footnotes[parseInt(urlParams.value, 10)-1].body;
			//enyo.log(enyo.application.verses[parseInt(urlParams.passage.split(":")[1], 10)-1].footnotes[parseInt(urlParams.value, 10)-1].body);
			this.tappedVerse = parseInt(urlParams.passage.split(":")[1], 10);
			this.popupTop = enyo.byId("footnote" + this.tappedVerse).getBoundingClientRect().top;
			this.popupLeft = enyo.byId("footnote" + this.tappedVerse).getBoundingClientRect().left;
			this.doShowFootnote();
		}
		
		//this.$.versePopup.openAt({top: top, left: left});
	},
	
	setNotes: function(notes) {
		this.notes = notes;
		enyo.application.notes = notes;
		//console.log(enyo.json.stringify(notes));
		for (var i=0;i<notes.length; i++) {
			enyo.byId("noteIcon"+notes[i].vnumber).innerHTML = "<a href='note://" + i + ":" + notes[i].vnumber + "'><img id='note" + i + "' src='images/note.png' /></a>";
			//enyo.byId("noteIconLeft"+notes[i].vnumber).innerHTML = "<a href='note://" + i + ":" + notes[i].vnumber + "'><img id='note" + i + "' src='images/note.png' /></a>";
		}
	},
	
	setBookmarks: function(bookmarks) {
		this.bookmarks = bookmarks;
		enyo.application.bookmarks = bookmarks;
		//enyo.log(enyo.json.stringify(bookmarks));
		//console.log(enyo.json.stringify(notes));
		for (var i=0;i<bookmarks.length; i++) {
			enyo.byId("bmIcon"+bookmarks[i].vnumber).innerHTML = "<a href='bookmark://" + i + ":" + bookmarks[i].vnumber + "'><img id='bookmark" + i + "' src='images/bookmark.png' /></a>";
			//enyo.byId("bmIconLeft"+bookmarks[i].vnumber).innerHTML = "<a href='bookmark://" + i + ":" + bookmarks[i].vnumber + "'><img id='bookmark" + i + "' src='images/bookmark.png' /></a>";
			
		}
	},
	
	setHighlights: function(highlights) {
		this.highlights = highlights;
		enyo.application.highlights = highlights;
		//enyo.log(enyo.json.stringify(highlights));
		for (var i=0;i<highlights.length; i++) {
			enyo.byId("verse"+highlights[i].vnumber).style.backgroundColor = highlights[i].color;
		}
		//this.windowRotated();
	},
	
	setPlain: function (content) {
		//enyo.log(content);
		//this.$.mainView.setAllowHtml(false);
		this.$.mainView.setContent(content);
		//this.log(content.length);
	},
	
	setPrevChapter: function (passage) {
		this.$.prevChapter.setContent("< " + passage);
	},
	
	setNextChapter: function (passage) {
		this.$.nextChapter.setContent(passage + " >");
	},
	
	setFontSize: function (size) {
		this.$.mainView.addStyles("font-size: " + size + "px;");
		//this.resized();
		var height = this.node.clientHeight - 40;
		this.$.mainView.addStyles("height: " + height + "px;");
		if (this.vnumber !== 0) {this.setSnappers();}
	},
	
	setFont: function (font) {
		this.$.mainView.addStyles("font-family: " + font + ";");
		//this.resized();
		var height = this.node.clientHeight - 40;
		this.$.mainView.addStyles("height: " + height + "px;");
		if (this.vnumber !== 0) {this.setSnappers();}
	},
	
	setSnappers: function (vnumber) {		
		var comp = this.getComponents();
		for (var i=0;i<comp.length;i++) {
			if (comp[i].name.search(/snapper\d+/) != -1) {
				comp[i].destroy();
			}
		}
		if(this.$.lastSnapper) {
			this.$.lastSnapper.destroy();
		}
		
		var height = this.node.clientHeight - 40;
		var width = this.node.clientWidth - 40;
		
		//enyo.log(this.node.clientWidth, this.node.scrollWidth, this.node.scrollWidth - this.node.clientWidth - this.sidebarWidth, parseInt((this.node.scrollWidth - this.node.clientWidth - this.sidebarWidth) / this.node.clientWidth));
		//enyo.log(this.$.mvContainer.node.clientWidth);
		this.numberOfSnappers = (this.node.scrollWidth - this.node.clientWidth - this.sidebarWidth > this.node.clientWidth) ? parseInt((this.node.scrollWidth - this.node.clientWidth - this.sidebarWidth) / this.node.clientWidth, 10) : 0;
		var kindName = "";
		for (var j=0;j<this.numberOfSnappers; j++) {
			kindName = "snapper" + j;
			this.createComponent({name: kindName, style: "width: " + this.node.clientWidth + "px;"}).render();
		}
		//enyo.log(this.node.clientWidth);
		this.createComponent({name: "lastSnapper", style: "width: " + this.node.clientWidth + "px;", components: [{name: "nextChapter", content: "Next Chapter", className: "chapter-nav-right chapter-nav"}]}).render();
		this.$.mainView.addStyles("width: " + width + "px;");
		this.$.mainView.addStyles("height: " + height + "px;");
		this.$.prevChapter.show();
		
		if (vnumber) {
			//enyo.log(enyo.byId(enyo.json.stringify(vnumber)).getBoundingClientRect().left);
			this.setIndex(parseInt(enyo.byId(enyo.json.stringify(vnumber)).getBoundingClientRect().left / this.$.mainView.node.clientWidth, 10) + 1);
		}
		//enyo.log("CONTAINER: ", this.$.mvContainer.node.clientWidth, this.$.mvContainer.node.clientHeight);
		//enyo.log("MAINVIEW: ", this.$.mainView.node.clientWidth, this.$.mainView.node.clientHeight);
	},
	
	windowRotated: function(inSender) {
		//enyo.log("NODE1: ", this.node.clientWidth, this.node.clientHeight);
		var height = this.node.clientHeight - 30;
		var width = this.node.clientWidth - 40;
		//enyo.log("VARS:", width, height);
		//this.$.mvContainer.addStyles("height: " + this.node.clientHeight + "px;");
		//this.$.mvContainer.addStyles("width: " + this.node.clientWidth + "px;");
		this.$.mainView.addStyles("height: " + height + "px;");
		this.$.mainView.addStyles("width: " + width + "px;");
		
		var comp = this.getComponents();
		for (var j=0;j<comp.length;j++) {
			if (comp[j].name.search(/snapper\d+/) != -1) {
				comp[j].addStyles("width: " + this.$.mainView.node.clientWidth + "px;");
			}
		}
		this.$.firstSnapper.addStyles("width: " + this.$.mainView.node.clientWidth + "px;");
		this.$.lastSnapper.addStyles("width: " + this.$.mainView.node.clientWidth + "px;");
		
		this.setIndex(this.index);
		//enyo.log("NODE2: ", this.node.clientWidth, this.node.clientHeight);
		//enyo.log("CONTAINER: ", this.$.mvContainer.node.clientWidth, this.$.mvContainer.node.clientHeight);
		//enyo.log("MAINVIEW: ", this.$.mainView.node.clientWidth, this.$.mainView.node.clientHeight);
	},
	
	//WORKAROUND
	snapto: function(ctx) {
		if (enyo.fetchDeviceInfo().platformVersion == "3.0.0") {
			this.snapable = false;
			this.snapTo(ctx);
		} else {
			this.snapTo(ctx);
		}	
	}
});

enyo.kind({
	name: "BibleZ.Selector",
	kind: "Toaster",
	flyInFrom: "left",
	scrim: false,
	style: "background-color: #D8D8D8; width: 320px; height: 100%, top: 0px; bottom: 0px;",
	lazy: false,
	published: {
        bookNames: [],
		book: {"name": "Matthew", "abbrev": "Matt"},
		bnumber: 39,
		chapter: 1,
		verse: 1
    },
	events: {
		onChapter: "",
		onVerse: ""
	},
	components: [
		{className: "toaster-shadow"},
		{kind: enyo.VFlexBox, width: "320px", height: "100%", components: [
			{kind: "Header", className: "enyo-header-dark", components: [
				{kind: "RadioGroup", onChange: "radioButtonSelected", style: "width: 300px;", components: [
					{name: "rgBook", caption: "", onclick: "changeSnapper"},
					{name: "rgChapter", caption: "", onclick: "changeSnapper"},
					{name: "rgVerse", caption: "", onclick: "changeSnapper"}
				]}
			]},
			{name: "selectorSnapper", kind: "SnapScroller", flex: 1, onSnap: "setRadioButton", autoVertical: false, vertical: false, components: [
				{name: "bookScroller", kind: "Scroller", className: "selector-scroller", components: [
					{name: "bookSelector"}
				]},
				{name: "chapterScroller", kind: "Scroller", className: "selector-scroller", components: [
					{name: "chapterSelector", content: $L("Select a book!"), className: "hint"}
				]},
				{name: "verseScroller", kind: "Scroller", className: "selector-scroller", components: [
					{name: "verseSelector", content: $L("Select a chapter!"), className: "hint"}
				]}
			]},
			{kind: "Toolbar", components: [
				{kind: "Spacer"},
				/*{caption: "Go", onclick: "handleChapters"},
				{kind: "Spacer"},*/
				{kind: "GrabButton", style: "position: relative;"}
			]}
		]}
	],
	
	create: function () {
		this.inherited(arguments);
		this.$.rgBook.setCaption(this.book.abbrev);
		this.$.rgChapter.setCaption(this.chapter);
		this.$.rgVerse.setCaption(this.verse);
	},
	
	getBook: function () {
		return this.book;
	},
	
	getChapter: function () {
		return this.chapter;
	},
	
	getVerse: function () {
		return this.verse;
	},
	
	getNextPassage: function () {
		var nextBook = "";
		var nextChapter = 0;
		var nextBnumber = this.bnumber;
		var passage = "";
		if (this.bnumber !== 65) {
			if (parseInt(this.chapter, 10) < parseInt(this.bookNames[this.bnumber].cmax, 10)) {
				nextChapter = parseInt(this.chapter, 10) + 1;
				nextBook = this.bookNames[this.bnumber];
			} else {
				nextChapter = 1;
				nextBook = this.bookNames[this.bnumber+1];
				nextBnumber = this.bnumber+1;
			}
		} else {
			if (parseInt(this.chapter, 10) < parseInt(this.bookNames[this.bnumber].cmax, 10)) {
				nextChapter = parseInt(this.chapter, 10) + 1;
				nextBook = this.bookNames[this.bnumber];
			}
		}
		//enyo.log(this.bnumber, this.chapter, nextChapter, nextBook);
		passage = (nextBook !== "" && nextChapter !== 0) ? nextBook.abbrev + " " + nextChapter : "End of Bible =)";
		return {"passage": passage, "nextChapter": nextChapter, "nextBook": nextBook, "nextBnumber": nextBnumber};
	},
	
	getPrevPassage: function () {
		var prevBook = "";
		var prevChapter = 0;
		var passage = "";
		var prevBnumber = this.bnumber;
		if (this.bnumber !== 0) {
			if (parseInt(this.chapter, 10) > 1) {
				prevChapter = parseInt(this.chapter, 10) - 1;
				prevBook = this.bookNames[this.bnumber];
			} else {
				prevChapter = this.bookNames[this.bnumber-1].cmax;
				prevBook = this.bookNames[this.bnumber-1];
				prevBnumber = this.bnumber-1;
			}
		} else {
			if (parseInt(this.chapter, 10) > 1) {
				prevChapter = parseInt(this.chapter, 10) - 1;
				prevBook = this.bookNames[this.bnumber];
			}
		}
		passage = (prevBook !== "" && prevChapter !== 0) ? prevBook.abbrev + " " + prevChapter : "Beginning of Bible =)";
		return {"passage": passage, "prevChapter": prevChapter, "prevBook": prevBook, "prevBnumber": prevBnumber};
	},
	
	setBookNames: function (bn) {
		this.bookNames = bn;
	},
	
	setCurrentPassage: function(passage) {
		var book = passage.split(" ")[0];
		this.chapter = passage.split(" ")[1];
		for (var i=0;i<this.bookNames.length;i++) {
			//console.log(this.bookNames[i].name + " " + book);
			if (this.bookNames[i].name == book || this.bookNames[i].abbrev == book) {
				this.book = this.bookNames[i];
				this.bnumber = i;
				//console.log(enyo.json.stringify(this.book));
			}
		}
	},
	
	setRadioButton: function(inSender, inEvent) {
		//console.log(this.$.selectorSnapper.index);
		switch (this.$.selectorSnapper.index) {
			case 0:
				this.$.rgBook.setDepressed(true);
				this.$.rgChapter.setDepressed(false);
				this.$.rgVerse.setDepressed(false);
			break;
			case 1:
				this.$.rgBook.setDepressed(false);
				this.$.rgChapter.setDepressed(true);
				this.$.rgVerse.setDepressed(false);
			break;
			case 2:
				this.$.rgBook.setDepressed(false);
				this.$.rgChapter.setDepressed(false);
				this.$.rgVerse.setDepressed(true);
			break;
		}
	},
	
	changeSnapper: function (inSender, inEvent) {
		switch (inSender.name) {
			case "rgBook":
				this.$.selectorSnapper.snapTo(0);
			break;
			case "rgChapter":
				this.$.selectorSnapper.snapTo(1);
			break;
			case "rgVerse":
				this.$.selectorSnapper.snapTo(2);
			break;
		}
	},
	
	createSection: function (section, data) {
		var kindName = "";
		var comp = this.getComponents();
		switch (section) {
			case "books":
				for (var j=0;j<comp.length;j++) {
					if (comp[j].name.search(/book\d+/) != -1) {
						comp[j].destroy();
					}
				}		
				//this.$.bookSelector.createComponent({name: "book1000", kind: "Divider", caption: "Old Testament"}, {owner: this});
				for (var i=0;i<data.length;i++) {
					kindName = "book" + i;
					if (i<39) {
						//this.$.bookSelector.createComponent({name: "book1001", kind: "Divider", caption: "New Testament", style: "clear: both;"}, {owner: this});
						this.$.bookSelector.createComponent({kind: "Button",
							caption: data[i].abbrev.slice(0,5),
							onclick: "handleBooks",
							className: "book-selector books-ot",
							name: kindName,
							key: i}, {owner: this});
					} else {
						this.$.bookSelector.createComponent({kind: "Button",
							caption: data[i].abbrev.slice(0,5),
							onclick: "handleBooks",
							className: "book-selector books-nt",
							name: kindName,
							key: i}, {owner: this});
					}
				}
				this.$.bookSelector.render();
			break;
			case "chapters":
				for (var k=0;k<comp.length;k++) {
					if (comp[k].name.search(/chapter\d+/) != -1) {
						comp[k].destroy();
					}
				}				
				for (var l=0;l<data;l++) {
					kindName = "chapter" + l;
					this.$.chapterSelector.createComponent({name: kindName, kind: "Button", caption: l+1, onclick: "handleChapters", className: "book-selector", book: this.book.name, chapter: l+1}, {owner: this});
				}
				this.$.chapterSelector.render();
			break;
			case "verses":
				for (var m=0;m<comp.length;m++) {
					if (comp[m].name.search(/verse\d+/) != -1) {
						comp[m].destroy();
					}
				}				
				for (var n=0;n<data;n++) {
					kindName = "verse" + n;
					this.$.verseSelector.createComponent({name: kindName, kind: "Button", caption: n+1, onclick: "handleVerses", className: "book-selector", verse: n+1}, {owner: this});
				}
				this.$.verseSelector.render();
			break;
		}
	},
	
	openSelector: function () {
		this.open();
		this.$.selectorSnapper.setIndex(0);
		
		//Set RadioButtons
		this.$.rgBook.setDepressed(true);
		this.$.rgChapter.setDepressed(false);
		this.$.rgVerse.setDepressed(false);
		
		this.$.bookScroller.addStyles("height: " + this.$.selectorSnapper.node.clientHeight + "px;");
		this.$.rgBook.setCaption(this.book.abbrev);
		this.$.rgChapter.setCaption(this.chapter);
		this.createSection("chapters", parseInt(this.book.cmax, 10));
	},
	
	handleBooks: function (inSender, inEvent) {
		this.book = this.bookNames[inSender.key];
		this.bnumber = inSender.key;
		this.chapter = 1;
		this.verse = 1;
		this.$.rgBook.setCaption(this.book.abbrev);
		this.$.rgChapter.setCaption(this.chapter);
		this.$.rgVerse.setCaption(this.verse);
		this.$.selectorSnapper.next();
		this.$.chapterScroller.scrollTo(0,0);
		this.createSection("chapters", parseInt(this.bookNames[inSender.key].cmax, 10));
	},
	
	handleChapters: function (inSender, inEvent) {
		this.chapter = (inSender.chapter) ? inSender.chapter : this.chapter;
		this.$.rgChapter.setCaption(this.chapter);
		this.doChapter();
		this.$.verseScroller.scrollTo(0,0);
		this.$.selectorSnapper.next();
	},
	
	handleVerses: function (inSender, inEvent) {
		this.verse = inSender.verse;
		this.$.rgVerse.setCaption(this.verse);
		this.doVerse();
		this.close();
	},	
	
	//WORKAROUND
	snapto: function(ctx) {
		if (enyo.fetchDeviceInfo().platformVersion == "3.0.0") {
			this.$.selectorSnapper.snapable = false;
			this.$.selectorSnapper.snapTo(ctx);
		} else {
			this.$.selectorSnapper.snapTo(ctx);
		}
	}
});

enyo.kind({
	name: "BibleZ.Sidebar",
	kind: "VFlexBox",
	className: "sidebar-inner",
	width: "320px",
	events: {
		onVerse: "",
		onSearch: "",
		onNewBm: ""
	},
	published: {
        bookNames: [],
		notes: [],
		bookmarks: [],
		highlights: [],
		results: [],
		passage: "",
		verse: 0,
		scope: "Mat-Rev",
		searchTerm: "",
		searchType: -2,
		currentBookmark: {},
		currentNote: {},
		currentHighlight: {},
		bmMode: "edit"
    },
	components: [
		{kind: "ApplicationEvents", onWindowRotated: "windowRotated"},
		{name: "editBM", kind: "BibleZ.EditBookmark", onEditBM: "updateBookmark"},
		{className: "sidebar-shadow"},
		{name: "sidebarPane", kind: "Pane", flex: 1, transitionKind: "enyo.transitions.Simple", onSelectView: "viewSelected", components: [
			{name: "bmView", kind: "VFlexBox", components: [
				{name: "bmSearch", kind: "SearchInput", hint: $L("Search Bookmarks"), selectAllOnFocus: true, oninput: "filterBookmarks"},
				{name: "scrollerBm", kind: "Scroller", flex: 1,components: [
					{name: "bmHint", content: $L("No Bookmarks available. Tap on a verse number to add one!"), className: "hint"},
					{name: "bmList", kind: "VirtualRepeater", onSetupRow: "getBmListItem", components: [
						{name: "itemBm", kind: "SwipeableItem", onConfirm: "deleteBookmark", layoutKind: "VFlexLayout", tapHighlight: false, className: "list-item", components: [
							{name: "bmPassage"},
							{kind: "HFlexBox", components: [
								{name: "bmFolder", flex: 1, className: "sidebar-folder"},
								{name: "bmTags", flex: 1, className: "sidebar-tags"}
							]}
						],
						onclick: "goToVerse",
						onmousehold: "openEditBookmark",
						onmouseout: "setPopupFocus"
						}]
					}
				]}
			]},
			{name: "noteView", kind: "VFlexBox", components: [
				{name: "scrollerNote", kind: "Scroller", flex: 1, components: [
					{name: "noteHint", content: $L("No Notes available. Tap on a verse number to add one!"), className: "hint"},
					{name: "noteList", kind: "VirtualRepeater", onSetupRow: "getNoteListItem", components: [
						{name: "itemNote", kind: "SwipeableItem", onConfirm: "deleteNote", layoutKind: "VFlexLayout", tapHighlight: false, className: "list-item", components: [
							{name: "notePassage", className: "note-passage"},
							{name: "noteText", allowHtml: true}
						],
						onclick: "goToVerse"
						}]
					}
				]}
			]},
			{name: "hlView", kind: "VFlexBox", components: [
				{name: "scrollerHl", kind: "Scroller", flex: 1,components: [
					{name: "hlHint", content: $L("No Highlights available. Tap on a verse number to add one!"), className: "hint"},
					{name: "hlList", kind: "VirtualRepeater", onSetupRow: "getHlListItem", components: [
						{name: "itemHl", kind: "SwipeableItem", onConfirm: "deleteHighlight", layoutKind: "VFlexLayout", tapHighlight: false, className: "list-item", components: [
							{name: "hlPassage"}
						],
						onclick: "goToVerse"
						}]
					}
				]}
			]},
			{name: "searchView", kind: "VFlexBox", components: [
				{className: "search-container", components: [
					{name: "searchInput", kind: "SearchInput", onkeydown: "inputKeydown"},
					{kind: "RadioGroup", onChange: "scopeSelected", value: "nt", components: [
						{caption: $L("OT"), value: "ot"},
						{caption: $L("NT"), value: "nt"},
						{caption: $L("All"), value: "all"}
					]},
					{name: "searchType", kind: "ListSelector", value: -2, onChange: "typeChanged", items: [
						{caption: $L("Regular Expression"), value: 1},
						{caption: $L("Multiword"), value: -2},
						{caption: $L("Exact Phrase"), value: -1}
					]}
				]},				
				//{name: "searchProgress", kind: "ProgressBar"},
				{name: "searchDivider", kind: "Divider", caption: $L("Results")},
				{name: "searchSpinner", kind: "Spinner", style: "margin-left: auto; margin-right: auto;"},
				{name: "scrollerSearch", kind: "Scroller", flex: 1,components: [
					{name: "searchList", kind: "VirtualRepeater", onSetupRow: "getSearchListItem", components: [
						{name: "itemSearch", kind: "Item", layoutKind: "VFlexLayout", tapHighlight: true, className: "list-item", components: [
							{name: "searchPassage"}
						],
						onclick: "goToVerse"
						}]
					}
				]}
			]}
		]},
		{kind: "Toolbar", components: [
			{kind: "RadioToolButtonGroup", components: [
				{name: "rgBM", icon: "images/bookmarks.png", /*caption: $L("Bookmarks"), */ onclick: "changeView"},
				{name: "rgNotes", icon: "images/notes.png", /*caption: $L("Notes"), */ onclick: "changeView"},
				{name: "rgHighlight", icon: "images/highlights.png", onclick: "changeView"},
				{name: "rgSearch", icon: "images/search.png", /*caption: $L("Bookmarks"), */ onclick: "changeView"}				
			]}
			//{caption: "TEST"}
		]}
	],
	
	create: function () {
		this.inherited(arguments);
		this.windowRotated();
		this.$.noteHint.hide();
		this.$.bmHint.hide();
		this.$.hlHint.hide();
		this.$.searchSpinner.hide();
		
		this.tappedItem = null;
	},
	
	rendered: function () {
		this.inherited(arguments);
		//this.windowRotated()
		this.getNotes();
		this.getBookmarks();
		this.getHighlights();
		biblezTools.getBmFolders(enyo.bind(this.$.editBM, this.$.editBM.handleFolders));
	},
	
	setProgress: function (pos) {
		this.$.searchProgress.setPosition(pos);
	},
	
	getNotes: function () {
		//this.$.spinner.show();
		biblezTools.getNotes(-1,-1,enyo.bind(this, this.handleNotes));
	},
	
	handleNotes: function (notes) {
		//this.$.spinner.hide();
		this.notes = notes;
		if (this.notes.length !== 0) {
			this.$.noteHint.hide();
		} else {
			this.$.noteHint.show();
		}
		this.$.noteList.render();		
	},
	
	getNoteListItem: function(inSender, inIndex) {
        var r = this.notes[inIndex];
        if (r) {
			this.$.noteText.setContent(r.note.replace(/"/g,""));
            if (this.bookNames[parseInt(r.bnumber, 10)]) {
				this.$.notePassage.setContent(this.bookNames[parseInt(r.bnumber, 10)].abbrev + " " + r.cnumber + ":" + r.vnumber);
			}
			var isRowSelected = (inIndex == this.tappedItem);
			this.$.itemNote.applyStyle("background", isRowSelected ? "#cde6f3" : null);
            return true;
        } else {
            return false;
        }
	},

	bmModeChanged: function () {
		if (this.bmMode == "edit") {
			this.$.editBM.setBtCaption($L("Edit"));
		} else {
			this.$.editBM.setBtCaption($L("Add"));
		}
	},
	
	getBookmarks: function (searchTerm) {
		//this.$.spinner.show();
		if (searchTerm) {
			biblezTools.getBookmarks(-1,-1,enyo.bind(this, this.handleBookmarks), searchTerm);
		} else {
			biblezTools.getBookmarks(-1,-1,enyo.bind(this, this.handleBookmarks));
		}
	},
	
	handleBookmarks: function (bm) {
		//enyo.log(enyo.json.stringify(bm));
		//this.$.spinner.hide();
		this.bookmarks = bm;
		if (this.bookmarks.length !== 0) {
			this.$.bmHint.hide();
		} else {
			this.$.bmHint.show();
		}
		this.$.bmList.render();
	},
	
	getBmListItem: function(inSender, inIndex) {
        var r = this.bookmarks[inIndex];
        if (r) {
			if (this.bookNames[parseInt(r.bnumber, 10)]) {
				if (r.title !== "") {
					this.$.bmPassage.setContent(r.title + " (" + this.bookNames[parseInt(r.bnumber, 10)].abbrev + " " + r.cnumber + ":" + r.vnumber + ")");
				} else {
					this.$.bmPassage.setContent(this.bookNames[parseInt(r.bnumber, 10)].abbrev + " " + r.cnumber + ":" + r.vnumber);
				}
				this.$.bmFolder.setContent(r.folder);
				this.$.bmTags.setContent(r.tags);
			}
            
			var isRowSelected = (inIndex == this.tappedItem);
			this.$.itemBm.applyStyle("background", isRowSelected ? "#cde6f3" : null);
            return true;
        } else {
            return false;
        }
	},

	openEditBookmark: function (inSender, inEvent, passage) {
		//enyo.log("Open Edit Menu...", passage);
		var r = null;
		if (inEvent && inEvent.rowIndex) {
			r = this.bookmarks[inEvent.rowIndex];
			this.currentBookmark = r;
			this.setBmMode("edit");
		} else if (passage) {
			r = passage;
			for (var i=0;i<this.bookmarks.length;i++) {
				if(parseInt(r.bnumber, 10) == parseInt(this.bookmarks[i].bnumber, 10) && parseInt(r.cnumber, 10) == parseInt(this.bookmarks[i].cnumber, 10) && parseInt(r.vnumber, 10) == parseInt(this.bookmarks[i].vnumber, 10)) {
					r = this.bookmarks[i];
				}
			}
			this.currentBookmark = r;
		}
		this.$.editBM.openAtTopCenter();
		this.$.editBM.setCaption(this.bookNames[parseInt(r.bnumber, 10)].abbrev + " " + r.cnumber + ":" + r.vnumber);
		this.$.editBM.setData(r.title, r.folder, r.tags);	
	},

	updateBookmark: function (inSender, inEvent) {
		var tmp = inSender.getData();
		//enyo.log(tmp);
		if (this.bmMode == "edit") {
			biblezTools.updateBookmark(this.currentBookmark.bnumber, this.currentBookmark.cnumber, this.currentBookmark.vnumber, tmp.title, tmp.folder, tmp.tags, enyo.bind(this, this.handleUpdateBookmark, $L("Updated")));
		} else {
			biblezTools.addBookmark(this.currentBookmark.bnumber, this.currentBookmark.cnumber, this.currentBookmark.vnumber, tmp.title, tmp.folder, tmp.tags, enyo.bind(this, this.handleUpdateBookmark, $L("Added")));
		}
		
		this.$.editBM.close();
	},

	handleUpdateBookmark: function (inAction) {
		enyo.log("Updated Bookmark");
		enyo.windows.addBannerMessage(inAction + " " + $L("Bookmark"), enyo.json.stringify({}));
		this.getBookmarks();
		biblezTools.getBmFolders(enyo.bind(this.$.editBM, this.$.editBM.handleFolders));
		this.doNewBm();
	},

	filterBookmarks: function (inSender, inEvent) {
		this.getBookmarks(inSender.getValue().toLowerCase());
	},
	
	getHighlights: function () {
		//enyo.log("GET HIGHLIGHTS...");
		//this.$.spinner.show();
		biblezTools.getHighlights(-1,-1,enyo.bind(this, this.handleHighlights));
	},
	
	handleHighlights: function (hl) {
		//enyo.log("GOT HIGHLIGHTS...");
		//enyo.log(enyo.json.stringify(hl));
		//this.$.spinner.hide();
		this.highlights = hl;
		if (this.highlights.length !== 0) {
			this.$.hlHint.hide();
		} else {
			this.$.hlHint.show();
		}
		this.$.hlList.render();
	},
	
	getHlListItem: function(inSender, inIndex) {
        var r = this.highlights[inIndex];
        if (r) {
			if (this.bookNames[parseInt(r.bnumber, 10)]) {
				this.$.hlPassage.setContent(this.bookNames[parseInt(r.bnumber, 10)].abbrev + " " + r.cnumber + ":" + r.vnumber);
				this.$.itemHl.addStyles("background-color: " + r.color +";");
			}		
            
			var isRowSelected = (inIndex == this.tappedItem);
			this.$.itemHl.applyStyle("background", isRowSelected ? "#cde6f3" : null);
            return true;
        } else {
            return false;
        }
	},
	
	scopeSelected: function(inSender) {
		//this.log("Selected button" + inSender.getValue());
		//var scope = "";
		switch (inSender.getValue()) {
			case "ot":
				this.scope = "Gen-Mal";
			break;
			case "nt":
				this.scope = "Mat-Rev";
			break;
			case "all":
				this.scope = "Gen-Rev";
			break;
		}
	},
	
	typeChanged: function(inSender, inValue, inOldValue) {
		this.searchType = inValue;
	},
	
	inputKeydown: function(inSender, inEvent) {
		if (inEvent.keyCode == 13) {
			//enyo.log("Search:", inSender.getValue());
			this.searchTerm = inSender.getValue();
			inSender.forceBlur();
			this.$.searchSpinner.show();
			this.results = [];
			this.$.searchList.render();
			this.$.searchDivider.setCaption($L("Results"));
			this.doSearch();
		}
	},
	
	setSearchResults: function (results) {
		this.results = results;
		if (this.results.length > 1) {
			this.$.searchDivider.setCaption(this.results.length + " " + $L("Results"));
		} else if (this.results.length == 1) {
			this.$.searchDivider.setCaption(this.results.length + " " + $L("Result"));
		} else {
			this.$.searchDivider.setCaption(this.results.length + " " + $L("Results"));
		}
		this.$.searchList.render();
		this.$.searchSpinner.hide();
	},
	
	getSearchListItem: function(inSender, inIndex) {
		//enyo.log(this.tappedItem);
        var r = this.results[inIndex];
        if (r) {
			this.$.searchPassage.setContent(r.passage);
			var isRowSelected = (inIndex == this.tappedItem);
			this.$.itemSearch.applyStyle("background", isRowSelected ? "#cde6f3" : null);
            return true;
        } else {
            return false;
        }
	},
	
	changeView: function (inSender, inEvent) {
		var oldTappedItem = this.tappedItem;
		this.tappedItem = undefined;
		this.$.noteList.renderRow(oldTappedItem);
		this.$.bmList.renderRow(oldTappedItem);
		this.$.searchList.renderRow(oldTappedItem);
		this.$.hlList.renderRow(oldTappedItem);
		//enyo.log(this.tappedItem);
		switch (inSender.name) {
			case "rgNotes":
				this.$.sidebarPane.selectViewByName("noteView");
			break;
			case "rgBM":
				this.$.sidebarPane.selectViewByName("bmView");
			break;
			case "rgSearch":
				this.$.sidebarPane.selectViewByName("searchView");
			break;
			case "rgHighlight":
				this.$.sidebarPane.selectViewByName("hlView");
			break;
		}
	},
	
	goToVerse: function(inSender, inEvent, rowIndex) {
		switch (inSender.name) {
			case "itemNote":
				this.tappedItem = rowIndex;
				this.$.noteList.render();
				this.passage = this.bookNames[parseInt(this.notes[rowIndex].bnumber, 10)].abbrev + " " + this.notes[rowIndex].cnumber;
				this.verse = this.notes[rowIndex].vnumber;
			break;
			case "itemBm":
				this.tappedItem = rowIndex;
				this.$.bmList.render();
				this.passage = this.bookNames[parseInt(this.bookmarks[rowIndex].bnumber, 10)].abbrev + " " + this.bookmarks[rowIndex].cnumber;
				this.verse = this.bookmarks[rowIndex].vnumber;
			break;
			case "itemHl":
				this.tappedItem = rowIndex;
				this.$.hlList.render();
				this.passage = this.bookNames[parseInt(this.highlights[rowIndex].bnumber, 10)].abbrev + " " + this.highlights[rowIndex].cnumber;
				this.verse = this.highlights[rowIndex].vnumber;
			break;
			case "itemSearch":
				this.tappedItem = rowIndex;
				this.$.searchList.render();
				this.passage = this.results[rowIndex].abbrev + " " + this.results[rowIndex].cnumber;
				this.verse = parseInt(this.results[rowIndex].vnumber, 10);
			break;		
		}
		this.doVerse();
	},
	
	deleteNote: function (inSender, inIndex) {
		this.verse = this.notes[inIndex].vnumber;
		biblezTools.removeNote(this.notes[inIndex].bnumber, this.notes[inIndex].cnumber, this.notes[inIndex].vnumber, enyo.bind(this, this.handleDelete, "notes", $L("Note")));
	},
	
	deleteBookmark: function (inSender, inIndex) {
		this.verse = this.bookmarks[inIndex].vnumber;
		biblezTools.removeBookmark(this.bookmarks[inIndex].bnumber, this.bookmarks[inIndex].cnumber, this.bookmarks[inIndex].vnumber, enyo.bind(this, this.handleDelete, "bookmarks", $L("Bookmark")));
	},
	
	deleteHighlight: function (inSender, inIndex) {
		this.verse = this.highlights[inIndex].vnumber;
		biblezTools.removeHighlight(this.highlights[inIndex].bnumber, this.highlights[inIndex].cnumber, this.highlights[inIndex].vnumber, enyo.bind(this, this.handleDelete, "highlights", $L("Highlight")));
	},
	
	handleDelete: function (list, item) {
		enyo.windows.addBannerMessage($L("Deleted") + " " + item, enyo.json.stringify({}));
		if (list == "notes") {
			this.getNotes();
			enyo.byId("noteIcon"+this.verse).innerHTML = "";
			//this.doNoteDelete();
		} else if (list == "bookmarks") {
			this.getBookmarks();
			enyo.byId("bmIcon"+this.verse).innerHTML = "";
			//this.doBmDelete();
		} else {
			this.getHighlights();
			enyo.byId("verse"+this.verse).style.backgroundColor = "transparent";
		}
	},

	setPopupFocus: function (inSender, inEvent) {
		//enyo.log("MouseUp");
		this.$.editBM.setFocus();
	},
	
	bookNamesChanged: function () {
		this.$.bmList.render();
		this.$.noteList.render();
		this.$.hlList.render();
	},
	
	windowRotated: function(inSender) {
		//enyo.log("HEIGHT:", enyo.fetchDeviceInfo().screenHeight, enyo.fetchDeviceInfo().screenWidth, this.$.sidebarPane.height);
		if (enyo.getWindowOrientation() == "up" || enyo.getWindowOrientation() == "down") {
			this.setStyle("height: 685px;");
			if (this.$.editBM.showing) {
				this.$.editBM.openAt({top: 30, left: 350}, true);
			}
		} else {
			this.setStyle("height: 940px;");
			if (this.$.editBM.showing) {
				this.$.editBM.openAt({top: 30, left: 250}, true);
			}
		}		
	}
});
