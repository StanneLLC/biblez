enyo.kind({
    name: "BibleZ.VersePopup",
    scrim: false,
    kind: "Popup",
    lazy: false,
    events: {
      onNote: ""
    },
    components:[
        {kind: "VFlexBox", flex: 1, components: [
            {kind: "ToolButtonGroup", components: [
                {content: "Copy"},
                {content: "Bookmark"},
                {content: "Note", onclick: "doNote"},
                {content: "Highlight"},
            ]}
        ]}
        
       
    ],
    
    closePopup: function() {
       this.close();
    }
});

enyo.kind({
    name: "BibleZ.AddNote",
    kind: "ModalDialog",
    events: {
      onAddNote: ""
    },
    caption: $L("Add A Note"), components:[        
        {name: "noteInput", kind: "RichText", className: "note-input", hint: $L("Add your note here.")},
        {layoutKind: "HFlexLayout", style: "margin-top: 10px;", components: [  
            {kind: "Button", caption: $L("Cancel"), flex: 1, onclick: "closePopup"},
            {kind: "Button", caption: $L("Add"), flex: 1, onclick: "addNote", className: "enyo-button-affirmative"},
        ]}
    ],
    
    rendered: function () {
        this.inherited(arguments);
        this.setFocus();
    },
    
    getNote: function () {
        return this.$.noteInput.getValue();
    },
    
    setFocus: function () {
        this.$.noteInput.forceFocusEnableKeyboard();
    },
    
    clearInput: function () {
        this.$.noteInput.setValue("");
    },
    
    addNote: function (inSender, inEvent) {
        console.log(this.$.noteInput.getValue());
        this.doAddNote();
        this.closePopup();
    },
    
    closePopup: function() {
       this.close();
    }
});

enyo.kind({
    name: "BibleZ.ShowNote",
    kind: "Popup",
    //caption: "",
    lazy: false,
    components:[
        {name: "noteContent", content: "", className: "popup-note"}
        //{kind: "Button", caption: $L("OK"), onclick: "closePopup", style: "margin-top:10px"}
    ],
    
    setNote: function (note) {
        this.$.noteContent.setContent(note);
    },
    
    closePopup: function() {
       this.close();
    }
})

enyo.kind({
   name: "BibleZ.About",
   scrim: true,
   kind: "Popup", components: [
      {kind: "PalmService", service: "palm://com.palm.applicationManager/", method: "open"},
      {content: "About " + enyo.fetchAppInfo().title, className: "popup-title"},
      {content: "Version " + enyo.fetchAppInfo().version, className: "popup-version"},
      {content: "BibleZ HD is based on the <a href='http://www.crosswire.org/sword'>SWORD Project</a>. \
                <br><br>&copy; 2010-2011 by <a href='http://zefanjas.de'>zefanjas.de</a>", className: "popup-info"},      
      {kind: "Button", flex: 1, caption: $L("Send eMail"), onclick: "sendMail"},
      {kind: "Button", flex: 1, caption: "Close", onclick: "doCancel"}
   ],
   
   doCancel: function () {
    this.close();
   },
   
   sendMail: function () {
      this.$.palmService.call({
         id: 'com.palm.app.email',
            params: {
               summary: $L("Support ") + enyo.fetchAppInfo().title + " TouchPad - " + enyo.fetchAppInfo().version
            }
      });
   }
});