enyo.kind({
    name: "BibleZ.Scroller",
    kind: "SnapScroller",
    events: {
      onVerseTap: "",
	  onShowNote: "",
	  onPrevChapter: "",
	  onNextChapter: ""
    },
	published: {
		numberOfSnappers: 0,
		popupLeft: 0,
		popupTop: 0,
		tappedVerse: 1,
		tappedNote: 0,
		notes: []
	},
	index: 1,
	//onSnap: "changeChapter",
    flex: 1,
    autoVertical: false,
    vertical: false,
	className: "scroller-background",
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
	},
	
	rendered: function () {
		this.inherited(arguments);
		this.setIndex(1);
		//this.$.mainView.addStyles("width: " + this.node.clientWidth + "px;");
		this.$.firstSnapper.addStyles("width: " + this.node.clientWidth + "px;");
	},
    
    windowRotated: function(inSender) {
		var height = this.node.clientHeight - 30;
		this.$.mainView.addStyles("height: " + height + "px;");
		var comp = this.getComponents()
		for (var j=0;j<comp.length;j++) {
			if (comp[j].name.search(/snapper\d+/) != -1) {
				comp[j].addStyles("width: " + this.node.clientWidth + "px;");
			}
		}
		//this.$.mainView.addStyles("width: " + this.node.clientWidth + "px;");
		this.$.firstSnapper.addStyles("width: " + this.node.clientWidth + "px;");
		this.$.lastSnapper.addStyles("width: " + this.node.clientWidth + "px;");
		
		this.snapTo(this.index);
	},
	
	changeChapter: function (inSender, inEvent) {
		console.log("CHANGE CHAPTER... " + this.index);
		if (this.index == 0) {
			this.doPrevChapter();
		} else if (this.index == this.numberOfSnappers + 2) {
			this.doNextChapter();
		}
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
		}
		this.resized();
		var height = this.node.clientHeight - 30;
		this.$.mainView.addStyles("height: " + height + "px;");
		//this.$.mainView.addStyles("width: " + this.node.clientWidth + "px;");
		this.$.mainView.setContent(content);
		this.log(this.node.clientWidth, this.node.scrollWidth, this.node.scrollWidth - this.node.clientWidth, parseInt((this.node.scrollWidth - this.node.clientWidth) / this.node.clientWidth));
		this.numberOfSnappers = (this.node.scrollWidth - this.node.clientWidth !== this.node.clientWidth) ? parseInt((this.node.scrollWidth - this.node.clientWidth) / this.node.clientWidth) : 0;
		
		var kindName = "";
		for (var j=0;j<this.numberOfSnappers; j++) {
			kindName = "snapper" + j;
			this.createComponent({name: kindName, style: "width: " + this.node.clientWidth + "px;"}).render();
		}
		
		this.createComponent({name: "lastSnapper", style: "width: " + this.node.clientWidth + "px;", components: [{name: "nextChapter", content: "Next Chapter", className: "chapter-nav-right chapter-nav"}]}).render();
		
		this.$.prevChapter.show();
	},
	
	handleVerseTap: function(inSender, inUrl) {
		//console.log(inUrl + " " + inUrl.match(/.*\:\/\//i));
		if (inUrl.match(/.*\:\/\//i) == "verse://") {
			this.tappedVerse = inUrl.replace("verse://","");
			this.popupTop = enyo.byId(inUrl.replace("verse://","")).getBoundingClientRect().top;
			this.popupLeft = enyo.byId(inUrl.replace("verse://","")).getBoundingClientRect().left;
			this.doVerseTap();
		} else if (inUrl.match(/.*\:\/\//i) == "note://") {
			this.tappedNote = parseInt(inUrl.replace("note://",""));
			this.popupTop = enyo.byId("note" + inUrl.replace("note://","")).getBoundingClientRect().top;
			this.popupLeft = enyo.byId("note" + inUrl.replace("note://","")).getBoundingClientRect().left;
			this.doShowNote();
		}
		
		//this.$.versePopup.openAt({top: top, left: left});
	},
	
	setNotes: function(notes) {
		this.notes = notes;
		console.log(enyo.json.stringify(notes));
		for (var i=0;i<notes.length; i++) {
			enyo.byId("noteIcon"+notes[i].vnumber).innerHTML = "<a href='note://" + i + "'><img id='note" + i + "' src='images/note.png' /></a>";
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
		passage = (nextBook !== "" && nextChapter !== 0) ? nextBook.name + " " + nextChapter : "End of Bible =)";
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
				prevtBook = this.bookNames[this.bnumber];
			}
		}
		passage = (prevBook !== "" && prevChapter !== 0) ? prevBook.name + " " + prevChapter : "Beginning of Bible =)";
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
				this.$.bookSelector.destroyComponents();
				this.$.bookSelector.createComponent({kind: "Divider", caption: "Old Testament"});
				for (var i=0;i<data.length;i++) {
					this.$.bookSelector.createComponent({kind: "Button",
						caption: data[i].abbrev.slice(0,5),
						onclick: "handleBooks",
						className: "book-selector",
						key: i}, {owner: this});
					if (i==38) {
						this.$.bookSelector.createComponent({kind: "Divider", caption: "New Testament", style: "clear: both;"});
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
