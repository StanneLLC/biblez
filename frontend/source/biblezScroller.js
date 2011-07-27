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
	className: "scroller-background",
	events: {
      onVerseTap: "",
	  onShowNote: "",
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
		bookmarks: []
	},
    components: [
        {kind: "ApplicationEvents", onWindowRotated: "windowRotated"},
		{name: "firstSnapper", components: [
			{name: "prevChapter", content: "Previous Chapter", className: "chapter-nav-left chapter-nav"}			
		]},
        {name: "mainView", kind: "HtmlContent", allowHtml: true, content: "", className: "view-verses", onLinkClick: "handleVerseTap"}
    ],
	
	create: function () {
		this.inherited(arguments);
		this.setIndex(1);
		this.$.prevChapter.hide();
		this.starter = 0;
	},
	
	rendered: function () {
		this.inherited(arguments);
		if (this.starter == 0) {
			this.setIndex(1);
			//this.$.mainView.addStyles("width: " + this.node.clientWidth + "px;");
			this.$.firstSnapper.addStyles("width: " + this.node.clientWidth + "px;");
		}
		this.starter = 1;
		
		//enyo.log(this.$.mainView.hasNode());
	},
	
	changeChapter: function (inSender, inEvent) {
		console.log("CHANGE CHAPTER... " + this.index);
		if (this.index == 0) {
			this.doPrevChapter();
		} else if (this.index == this.numberOfSnappers + 2) {
			this.doNextChapter();
		}
	},
	
	getVerseContent: function(vnumber) {
		
	},
    
    setVerses: function (verses, vnumber) {
        //this.log(verses);
		this.setIndex(1);
		//this.snapTo(1);
		var comp = this.getComponents()
		for (var j=0;j<comp.length;j++) {
			if (comp[j].name.search(/snapper\d+/) != -1) {
				comp[j].destroy();
			}
		}
		if(this.$.lastSnapper) {
			this.$.lastSnapper.destroy();
		}
		var content = "";
		var tmpVerse = "";
		for (var i=0; i<verses.length; i++) {
			tmpVerse = verses[i].content;
			if (tmpVerse.search(/<note.*<\/note>/i) != -1) {
				tmpVerse = tmpVerse.replace(/<note.*<\/note>/i, " <span class='verse-footnote'>" + tmpVerse.match(/<note.*<\/note>/i) + "</span>");
			}
			content = content + "<a href='verse://" + verses[i].vnumber + "'>";
			content = content + " <span id='" + verses[i].vnumber + "' class='verse-number'>" + verses[i].vnumber + "</span> </a>";
			content = (parseInt(vnumber) != 1 && parseInt(vnumber) == parseInt(verses[i].vnumber)) ? content + "<span class='verse-highlighted'>" + tmpVerse + "</span>" : content + tmpVerse;
			content = content + " <span id='noteIcon" + verses[i].vnumber + "'></span> ";
			content = content + " <span id='bmIcon" + verses[i].vnumber + "'></span> ";			
		}
		this.resized();
		var height = this.node.clientHeight - 30;
		this.$.mainView.addStyles("height: " + height + "px;");
		
		this.$.mainView.setContent(content);
		this.setSnappers();
		//this.log(this.node.clientWidth, this.node.scrollWidth, this.node.scrollWidth - this.node.clientWidth, parseInt((this.node.scrollWidth - this.node.clientWidth) / this.node.clientWidth));
		/*this.numberOfSnappers = (this.node.scrollWidth - this.node.clientWidth !== this.node.clientWidth) ? parseInt((this.node.scrollWidth - this.node.clientWidth) / this.node.clientWidth) : 0;
		var kindName = "";
		for (var j=0;j<this.numberOfSnappers; j++) {
			kindName = "snapper" + j;
			this.createComponent({name: kindName, style: "width: " + this.node.clientWidth + "px;"}).render();
		}
		
		this.createComponent({name: "lastSnapper", style: "width: " + this.node.clientWidth + "px;", components: [{name: "nextChapter", content: "Next Chapter", className: "chapter-nav-right chapter-nav"}]}).render();
		//this.$.mainView.render(); */
	},
	
	handleVerseTap: function(inSender, inUrl) {
		//console.log(inUrl + " " + inUrl.match(/.*\:\/\//i));
		if (inUrl.match(/.*\:\/\//i) == "verse://") {
			this.tappedVerse = inUrl.replace("verse://","");
			this.popupTop = enyo.byId(inUrl.replace("verse://","")).getBoundingClientRect().top;
			this.popupLeft = enyo.byId(inUrl.replace("verse://","")).getBoundingClientRect().left;
			this.doVerseTap();
		} else if (inUrl.match(/.*\:\/\//i) == "note://") {
			this.tappedNote = parseInt(inUrl.replace("note://","").split(":")[0]);
			this.tappedVerse = parseInt(inUrl.replace("note://","").split(":")[1]);			
			this.popupTop = enyo.byId("note" + this.tappedNote).getBoundingClientRect().top;
			this.popupLeft = enyo.byId("note" + this.tappedNote).getBoundingClientRect().left;
			this.doShowNote();
		}
		
		//this.$.versePopup.openAt({top: top, left: left});
	},
	
	setNotes: function(notes) {
		this.notes = notes;
		//console.log(enyo.json.stringify(notes));
		for (var i=0;i<notes.length; i++) {
			enyo.byId("noteIcon"+notes[i].vnumber).innerHTML = "<a href='note://" + i + ":" + notes[i].vnumber + "'><img id='note" + i + "' src='images/note.png' /></a>";
		}
	},
	
	setBookmarks: function(bookmarks) {
		this.bookmarks = bookmarks;
		//console.log(enyo.json.stringify(notes));
		for (var i=0;i<bookmarks.length; i++) {
			enyo.byId("bmIcon"+bookmarks[i].vnumber).innerHTML = "<a href='bookmark://" + i + ":" + bookmarks[i].vnumber + "'><img id='bookmark" + i + "' src='images/bookmark.png' /></a>";
		}
	},
	
	setPlain: function (content) {
		this.$.mainView.setContent(content);
		this.log(content.length);
	},
	
	setPrevChapter: function (passage) {
		this.$.prevChapter.setContent("< " + passage);
	},
	
	setNextChapter: function (passage) {
		this.$.nextChapter.setContent(passage + " >");
	},
	
	setSnappers: function () {
		var comp = this.getComponents()
		for (var j=0;j<comp.length;j++) {
			if (comp[j].name.search(/snapper\d+/) != -1) {
				comp[j].destroy();
			}
		}
		if(this.$.lastSnapper) {
			this.$.lastSnapper.destroy();
		}
		
		//enyo.log(this.$.mainView.node.clientWidth, this.sidebarWidth, this.node.scrollWidth, this.node.scrollWidth - this.$.mainView.node.clientWidth, parseInt((this.node.scrollWidth - this.$.mainView.node.clientWidth) / this.$.mainView.node.clientWidth));
		this.numberOfSnappers = (this.node.scrollWidth - this.$.mainView.node.clientWidth - this.sidebarWidth > this.$.mainView.node.clientWidth) ? parseInt((this.node.scrollWidth - this.$.mainView.node.clientWidth - this.sidebarWidth) / this.$.mainView.node.clientWidth) : 0;
		var kindName = "";
		for (var j=0;j<this.numberOfSnappers; j++) {
			kindName = "snapper" + j;
			this.createComponent({name: kindName, style: "width: " + this.$.mainView.node.clientWidth + "px;"}).render();
		}
		this.createComponent({name: "lastSnapper", style: "width: " + this.$.mainView.node.clientWidth + "px;", components: [{name: "nextChapter", content: "Next Chapter", className: "chapter-nav-right chapter-nav"}]}).render();
		this.$.prevChapter.show();
	},
	
	windowRotated: function(inSender) {
		var height = this.node.clientHeight - 30;
		this.$.mainView.addStyles("height: " + height + "px;");
		var comp = this.getComponents()
		for (var j=0;j<comp.length;j++) {
			if (comp[j].name.search(/snapper\d+/) != -1) {
				comp[j].addStyles("width: " + this.$.mainView.node.clientWidth + "px;");
			}
		}
		//this.$.mainView.addStyles("width: " + this.node.clientWidth + "px;");
		this.$.firstSnapper.addStyles("width: " + this.$.mainView.node.clientWidth + "px;");
		this.$.lastSnapper.addStyles("width: " + this.$.mainView.node.clientWidth + "px;");
		
		this.snapTo(this.index);
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
					{name: "chapterSelector", content: "Select a book!", className: "hint"}
				]},
				{name: "verseScroller", kind: "Scroller", className: "selector-scroller", components: [
					{name: "verseSelector", content: "Select a chapter!", className: "hint"}
				]},
			]
			},
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
				this.snapto(0);
			break;
			case "rgChapter":
				this.snapto(1);
			break;
			case "rgVerse":
				this.snapto(2);
			break;
		}
	},
	
	createSection: function (section, data) {
		switch (section) {
			case "books":
				var kindName = "";
				var comp = this.getComponents()
				for (var j=0;j<comp.length;j++) {
					if (comp[j].name.search(/book\d+/) != -1) {
						comp[j].destroy();
					}
				}		
				this.$.bookSelector.createComponent({name: "book1000", kind: "Divider", caption: "Old Testament"}, {owner: this});
				for (var i=0;i<data.length;i++) {
					kindName = "book" + i;
					this.$.bookSelector.createComponent({kind: "Button",
						caption: data[i].abbrev.slice(0,5),
						onclick: "handleBooks",
						className: "book-selector",
						name: kindName,
						key: i}, {owner: this});
					if (i==38) {
						this.$.bookSelector.createComponent({name: "book1001", kind: "Divider", caption: "New Testament", style: "clear: both;"}, {owner: this});
					}
				}
				this.$.bookSelector.render();
			break;
			case "chapters":
				var kindName = "";
				var comp = this.getComponents()
				for (var j=0;j<comp.length;j++) {
					if (comp[j].name.search(/chapter\d+/) != -1) {
						comp[j].destroy();
					}
				}				
				for (var i=0;i<data;i++) {
					kindName = "chapter" + i;
					this.$.chapterSelector.createComponent({name: kindName, kind: "Button", caption: i+1, onclick: "handleChapters", className: "book-selector", book: this.book.name, chapter: i+1}, {owner: this});
				}
				this.$.chapterSelector.render();
			break;
			case "verses":
				var kindName = "";
				var comp = this.getComponents()
				for (var j=0;j<comp.length;j++) {
					if (comp[j].name.search(/verse\d+/) != -1) {
						comp[j].destroy();
					}
				}				
				for (var i=0;i<data;i++) {
					kindName = "verse" + i;
					this.$.verseSelector.createComponent({name: kindName, kind: "Button", caption: i+1, onclick: "handleVerses", className: "book-selector", verse: i+1}, {owner: this});
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
		
		this.$.bookScroller.addStyles("height: " + this.$.selectorSnapper.node.clientHeight + "px;")
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
		this.createSection("chapters", parseInt(this.bookNames[inSender.key].cmax, 10));
	},
	
	handleChapters: function (inSender, inEvent) {
		this.chapter = (inSender.chapter) ? inSender.chapter : this.chapter;
		this.$.rgChapter.setCaption(this.chapter);
		this.doChapter();
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
})

enyo.kind({
	name: "BibleZ.Sidebar",
	kind: "VFlexBox",
	className: "sidebar-inner",
	width: "320px",
	events: {
		onVerse: ""
	},
	published: {
        bookNames: [],
		notes: [],
		bookmarks: [],
		passage: "",
		verse: 0
    },
	components: [
		/*enyo.fetchDeviceInfo().screenHeight-138 +"px"*/
		{kind: "ApplicationEvents", onWindowRotated: "windowRotated"},
		{className: "sidebar-shadow"},
		{name: "sidebarPane", kind: "Pane", flex: 1, onSelectView: "viewSelected", components: [
			{name: "noteView", kind: "VFlexBox", components: [
				{name: "scrollerNote", kind: "Scroller", flex: 1, components: [
					{name: "noteList", kind: "VirtualRepeater", onSetupRow: "getNoteListItem", components: [
						{name: "itemNote", kind: "SwipeableItem", onConfirm: "deleteNote", layoutKind: "VFlexLayout", tapHighlight: true, className: "list-item", components: [
							{name: "notePassage", className: "note-passage"},
							{name: "noteText", allowHtml: true}
						],
						onclick: "goToVerse"
						}]
					}
				]}
			]},
			{name: "bmView", kind: "VFlexBox", components: [
				{name: "scrollerBm", kind: "Scroller", flex: 1,components: [
					{name: "bmList", kind: "VirtualRepeater", onSetupRow: "getBmListItem", components: [
						{name: "itemBm", kind: "SwipeableItem", onConfirm: "deleteBookmark", layoutKind: "VFlexLayout", tapHighlight: true, className: "list-item", components: [
							{name: "bmPassage"}
						],
						onclick: "goToVerse"
						}]
					}
				]}
			]}			
		]},
		{kind: "Toolbar", components: [
			{kind: "RadioToolButtonGroup", style: "width: 250px;", components: [
				{name: "rgNotes", caption: $L("Notes"), onclick: "changeView"},
				{name: "rgBM", caption: $L("Bookmarks"), onclick: "changeView"}
				//{name: "rgVerse", caption: "", onclick: "changeSnapper"}
			]}
			//{caption: "TEST"}
		]}
	],
	
	create: function () {
		this.inherited(arguments);
		this.windowRotated()
	},
	
	rendered: function () {
		this.inherited(arguments);
		//this.windowRotated()
		this.getNotes();
		this.getBookmarks();
	},
	
	getNotes: function () {
		//this.$.spinner.show();
		biblezTools.getNotes(0,0,enyo.bind(this, this.handleNotes));
	},
	
	handleNotes: function (notes) {
		//this.$.spinner.hide();
		this.notes = notes;
		this.$.noteList.render();
	},
	
	getNoteListItem: function(inSender, inIndex) {
        var r = this.notes[inIndex];
        if (r) {
			this.$.noteText.setContent(r.note.replace(/"/g,""));
            if (this.bookNames[parseInt(r.bnumber)]) {
				this.$.notePassage.setContent(this.bookNames[parseInt(r.bnumber)].abbrev + " " + r.cnumber + ":" + r.vnumber);
			}
			/*var isRowSelected = (inIndex == this.lastModItem);
			this.$.itemMod.applyStyle("background", isRowSelected ? "#3A8BCB" : null); */
            return true;
        } else {
            return false;
        }
	},
	
	getBookmarks: function () {
		//this.$.spinner.show();
		biblezTools.getBookmarks(0,0,enyo.bind(this, this.handleBookmarks));
	},
	
	handleBookmarks: function (bm) {
		//this.$.spinner.hide();
		this.bookmarks = bm;
		this.$.bmList.render();
	},
	
	getBmListItem: function(inSender, inIndex) {
        var r = this.bookmarks[inIndex];
        if (r) {
			if (this.bookNames[parseInt(r.bnumber)]) {
				this.$.bmPassage.setContent(this.bookNames[parseInt(r.bnumber)].abbrev + " " + r.cnumber + ":" + r.vnumber);
			}
			
            
			/*var isRowSelected = (inIndex == this.lastModItem);
			this.$.itemMod.applyStyle("background", isRowSelected ? "#3A8BCB" : null); */
            return true;
        } else {
            return false;
        }
	},
	
	changeView: function (inSender, inEvent) {
		//enyo.log(inSender.name);
		switch (inSender.name) {
			case "rgNotes":
				this.$.sidebarPane.selectViewByName("noteView");
			break;
			case "rgBM":
				this.$.sidebarPane.selectViewByName("bmView");
			break;
		}
	},
	
	goToVerse: function(inSender, inEvent, rowIndex) {
		switch (inSender.name) {
			case "itemNote":
				this.passage = this.bookNames[parseInt(this.notes[rowIndex].bnumber)].abbrev + " " + this.notes[rowIndex].cnumber;
				this.verse = this.notes[rowIndex].vnumber;
			break;
			case "itemBm":
				this.passage = this.bookNames[parseInt(this.bookmarks[rowIndex].bnumber)].abbrev + " " + this.bookmarks[rowIndex].cnumber;
				this.verse = this.bookmarks[rowIndex].vnumber;
			break;
		}
		this.doVerse();
	},
	
	deleteNote: function (inSender, inIndex) {
		biblezTools.removeNote(this.notes[inIndex].bnumber, this.notes[inIndex].cnumber, this.notes[inIndex].vnumber, enyo.bind(this, this.handleDelete, "notes", $L("Note")));
	},
	
	deleteBookmark: function (inSender, inIndex) {
		biblezTools.removeBookmark(this.bookmarks[inIndex].bnumber, this.bookmarks[inIndex].cnumber, this.bookmarks[inIndex].vnumber, enyo.bind(this, this.handleDelete, "bookmarks", $L("Bookmark")));
	},
	
	handleDelete: function (list, item) {
		enyo.windows.addBannerMessage($L("Deleted") + " " + item, enyo.json.stringify({}));
		if (list == "notes") {
			this.getNotes();
		} else {
			this.getBookmarks();
		}
	},
	
	bookNamesChanged: function () {
		this.$.bmList.render();
		this.$.noteList.render();
	},
	
	windowRotated: function(inSender) {
		//enyo.log("HEIGHT:", enyo.fetchDeviceInfo().screenHeight, enyo.fetchDeviceInfo().screenWidth, this.$.sidebarPane.height);
		if (enyo.getWindowOrientation() == "up" || enyo.getWindowOrientation() == "down") {
			this.setStyle("height: 685px;");
		} else {
			this.setStyle("height: 940px;");
		}		
	}
})
