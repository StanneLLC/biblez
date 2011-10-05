enyo.kind({
	name: "BibleZ.SplitView",
	kind: "HFlexBox",
    //style: "background: url('../images/background.png')",
    //className: "scroller-background",
    published: {
        linebreak: false
    },
    events: {
        onLeftSnap: ""
    },
	components: [
        {kind: "ApplicationEvents", onWindowRotated: "windowRotated"},
		{name: "leftSnapper", kind: "SnapScroller", flex: 1, className: "splitview-left", onSnap: "doLeftSnap", autoVertical: false, vertical: false, components: [
	        {className: "selector-scroller", components: [
                {name: "prevChapterLeft", content: "Previous Chapter", className: "chapter-nav-left chapter-nav"}	
	        ]},
	        {name: "leftScroller", kind: "Scroller", className: "selector-scroller", components: [
                {name: "leftView", kind: "HtmlContent", allowHtml: true, content: "middle", className: "splitview-verse"}
	        ]},
	        {className: "selector-scroller", components: [
                {name: "nextChapterLeft", content: "Next Chapter", className: "chapter-nav-right chapter-nav"}	
	        ]}
		]},
		{name: "rightSnapper", kind: "SnapScroller", flex: 1, onSnap: "", autoVertical: false, vertical: false, components: [
			{name: "leftleft", className: "selector-scroller", components: [
                {name: "prevChapterRight", content: "Previous Chapter", className: "chapter-nav-left chapter-nav"}   
            ]},
            {name: "rightScroller", kind: "Scroller", className: "selector-scroller", components: [
                {name: "rightView", kind: "HtmlContent", allowHtml: true, content: "middle", className: "splitview-verse"}
            ]},
            {name: "leftright", className: "selector-scroller", components: [
                {name: "nextChapterRight", content: "Next Chapter", className: "chapter-nav-right chapter-nav"}  
            ]}
		]}
	],

    create: function () {
        this.inherited(arguments);
        this.$.leftright.hide();
        this.$.leftleft.hide();
    },

    setBackground: function (className) {
        //this.$.leftSnapper.setClassName("splitview-left " + className);
        //this.$.rightSnapper.setClassName(className);
        //enyo.log(this.hasNode());
        this.setClassName(className);
    },

    setFontSize: function (size) {
        this.$.leftView.addStyles("font-size: " + size + "px;");
        this.$.rightView.addStyles("font-size: " + size + "px;");
    },

    setFont: function (font) {
        this.$.leftView.addStyles("font-family: " + font + ";");
        this.$.rightView.addStyles("font-family: " + font + ";");
    },
    
    setVersesLeft: function (verses, vnumber) {
        this.$.leftSnapper.setIndex(1);
        this.$.leftScroller.setScrollTop(0);
        //enyo.log(this.node.clientHeight, this.$.leftSnapper.node.clientHeight);
        this.$.leftScroller.addStyles("height: " + this.node.clientHeight + "px;");
        this.$.leftView.setContent(biblezTools.renderVerses(verses, vnumber, this.linebreak));
    },

    setVersesRight: function (verses, vnumber) {
        this.$.rightSnapper.setIndex(1);
        this.$.rightScroller.setScrollTop(0);
        //enyo.log(this.node.clientHeight, this.$.leftSnapper.node.clientHeight);
        this.$.rightScroller.addStyles("height: " + this.node.clientHeight + "px;");
        this.$.rightView.setContent(biblezTools.renderVerses(verses, vnumber, this.linebreak));
    },

    setMessageLeft: function (message) {
        this.$.leftSnapper.setIndex(1);
        this.$.leftView.setContent(message);
    },

    setMessageRight: function (message) {
        this.$.rightSnapper.setIndex(1);
        this.$.rightView.setContent(message);
    },

    setPrevChapterLeft: function (passage) {
        this.$.prevChapterLeft.setContent("< " + passage);
    },
    
    setNextChapterLeft: function (passage) {
        this.$.nextChapterLeft.setContent(passage + " >");
    },

    setPrevChapterRight: function (passage) {
        this.$.prevChapterRight.setContent("< " + passage);
    },
    
    setNextChapterRight: function (passage) {
        this.$.nextChapterRight.setContent(passage + " >");
    },

    getIndexLeft: function () {
       return this.$.leftSnapper.getIndex(); 
    },

    windowRotated: function(inSender) {
        var height = enyo.byId("main").clientHeight;
        var width = enyo.byId("main").clientWidth/2;
        var widthFull = enyo.byId("main").clientWidth;
        enyo.log(height, width);
        this.$.leftScroller.addStyles("height: " + height + "px;");
        this.$.leftScroller.addStyles("width: " + width + "px;");
        this.$.rightScroller.addStyles("height: " + height + "px;");
        this.$.rightScroller.addStyles("width: " + width + "px;");
        
        this.$.leftSnapper.setIndex(this.$.leftSnapper.index);
        this.$.rightSnapper.setIndex(this.$.rightSnapper.index);
    }
});