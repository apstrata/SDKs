/*******************************************************************************
 *  Copyright 2009 Apstrata
 *  
 *  This file is part of Apstrata Database Javascript Client.
 *  
 *  Apstrata Database Javascript Client is free software: you can redistribute it
 *  and/or modify it under the terms of the GNU Lesser General Public License as
 *  published by the Free Software Foundation, either version 3 of the License,
 *  or (at your option) any later version.
 *  
 *  Apstrata Database Javascript Client is distributed in the hope that it will be
 *  useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Lesser General Public License for more details.
 *  
 *  You should have received a copy of the GNU Lesser General Public License
 *  along with Apstrata Database Javascript Client.  If not, see <http://www.gnu.org/licenses/>.
 * *****************************************************************************
 */
dojo.provide('apstrata.widgets.Alert');

dojo.require('dijit._Templated');
dojo.require('dijit._Widget');

dojo.require('dojo.fx.easing');

dojo.declare("apstrata.widgets.Alert", 
[dijit._Widget, dijit._Templated], 
{
	templateString:"<div class='Alert'><div class='alertContent'><h1 class='alertTitle' dojoAttachPoint='titleHeader'></h1><div class='AlertIcon' dojoAttachPoint='icon'></div><div class='AlertContent' dojoAttachPoint='content' dojoAttachEvent='onmouseover: _showButtons, onmouseout: _hideButtons'>Content</div><div class='AlertControl' dojoAttachEvent='onmouseover: _showButtons' dojoAttachPoint='control'></div></div></div>",
	width: 200,
	height: 200,
	animation: null,
	clazz: "",
	message: "",
	_factor: .2,
	actions: "close",
	iconSrc: "",
	modal: false,

	/**
	 * Creates a popup alert widget. To show the popup, call the "show" method.
	 *
	 * @param attrs
	 * 			An object containing these parameters:
	 * 		width
	 * 			A number representing the width of the popup.
	 * 		height
	 * 			A number representing the height of the popup.
	 * 		title
	 * 			A string that will be shown as the title of the popup.
	 * 		actions
	 * 			A comma-separated string of actions that will be used as labels to the popup buttons.
	 * 		message
	 * 			A string that will be shown as the message of the popup.
	 * 		iconSrc
	 * 			A string that is the path to the icon of the popup.
	 * 		startFocus
	 * 			A string representing the action that will be focused on once the popup is shown.
	 * 			By default, the button that is focused on is the last one in the set of actions if
	 * 			the popup is modal.
	 * 		animation
	 * 			An object containing "from" and "bounding" attributes that will be used to animate
	 * 			the popup in order to show it.
	 * 		modal
	 * 			A boolean that represents whether or not other focusable fields on the page will be
	 * 			accessible once the popup is shown. If the popup is modal, then the user cannot
	 * 			click anywhere else.
	 * 		clazz
	 * 			A space-separated string of classes that will be added to the popup's main dom
	 * 			Node. If none are passed, then only the "rounded" class will be added.
	 */
	constructor: function(attrs) {
		var self = this
		if (attrs) {
			if (attrs.width) this.width = attrs.width
			if (attrs.height) this.height = attrs.height
			if (attrs.title) this.titleStr = attrs.title;
			if (attrs.message) this.message = attrs.message
			if (attrs.iconSrc) this.iconSrc = attrs.iconSrc
			if (attrs.startFocus) this.startFocus = attrs.startFocus
			
			if (attrs.animation) {
				this._animation = attrs.animation
//				this.originNode = dojo.byId(attrs.animation.from)
//				this.bounding = dojo.byId(attrs.animation.bounding)
			}
			
			if (attrs.clazz) this._classes = attrs.clazz.split(' '); else this._classes = ['rounded']
			
			if (attrs.actions) this._actions = attrs.actions.split(',')//; else this._actions = ['close']
		}
		
	},
	
	create: function(/*Object?*/params, /*DomNode|String?*/srcNodeRef){
		this._inTheDom = (srcNodeRef != undefined)
		
		if (srcNodeRef) {
			
			this._message = dojo.trim(srcNodeRef.innerHTML)
/*
			if (srcNodeRef.getAttribute('class')) {
				this._classes = (srcNodeRef.getAttribute('class')).split(' ');
				srcNodeRef.setAttribute("class", "")
			}
*/						
		}
		
//					if (!this._classes) this._classes = ['Dialog', 'rounded']
		
		this.inherited(arguments)
	},
	
	postCreate: function() {
		var self = this

			if (this._animation) {
				if (dojo.isString(this._animation.from)) this.originNode = dojo.byId(this._animation.from);
				else this.originNode = this._animation.from
				
				this.bounding = dojo.byId(this._animation.bounding)
			}


		var w = dijit.getViewport()
		
		if (this.modal) {
			this._curtain = document.createElement('div')

			dojo.place(this._curtain, document.body, "last")
			this._curtain.setAttribute("class", "AlertCurtain")

			dojo.style(this._curtain, {
				position: "absolute",
				top: 0 + "px",
				left: 0 + "px",
				width: w.w + "px",
				height: w.h + "px",
				visibility: "hidden",
//				background: "grey",
//				opacity: ".50",
				"zIndex": 99998
			})
		}

		if (!this._inTheDom) {
			document.body.appendChild(this.domNode)
		}
		
		if (this._message && (this._message != "")) this.message = this._message


		if (this.originNode) {
			var offsetTop = (self.originNode.offsetTop) ? self.originNode.offsetTop : 0;
			var offsetLeft = (self.originNode.offsetLeft) ? self.originNode.offsetLeft : 0;
			this.origin = {
				t: offsetTop,
				l: offsetLeft,
				w: self.width * self._factor,
				h: self.height * self._factor
			}
		} else {
			this.origin = {
				t: (w.h - self.height * self._factor) / 2,
				l: (w.w - self.width * self._factor) / 2,
				w: self.width * self._factor,
				h: self.height * self._factor
			}
		}
		
		if (this.bounding) {
			this.destination = {
				t: self.bounding.offsetTop + (self.bounding.offsetHeight - self.height) / 2,
				l: self.bounding.offsetLeft + (self.bounding.offsetWidth - self.width) / 2,
				w: self.width,
				h: self.height
			}
		} else {
			this.destination = {
				t: (w.h - self.height) / 2,
				l: (w.w - self.width) / 2,
				w: self.width,
				h: self.height
			}
		}

		
		this._buttons = []
		dojo.forEach(this._actions, function(action) {
			var b = new dijit.form.Button({label: action})
			dojo.place(b.domNode, self.control, "last")
			dojo.connect(b, "onClick", function() {
				self.buttonPressed(b.label)
			})
			self._buttons.push(b)
		})
		
		if (this.iconSrc) {
			var img = document.createElement('img')
			img.setAttribute('src', this.iconSrc)
			dojo.place(img, this.icon, "only")
		}
		
		this._hideButtons()
	},
	
	buttonPressed: function(action) {
	},
	
	show: function(handler) {
		var self = this;

		for (var i=0; i<this._classes.length; i++) {
			dojo.addClass(self.domNode, this._classes[i])
		}

		dojo.style(this.domNode, {
			top: self.origin.t + "px",
			left: self.origin.l + "px",
			width: (self.origin.w) + "px",
			height: (self.origin.h) + "px",
			visibility: "visible",
			"zIndex": 99999
		})

		dojo.style(this.control, {
			top: (self.height - 42) + "px",
			width: (self.width - 15) + "px"
		})
		
		if (this.modal) {
			dojo.style(this._curtain, {
				visibility: "visible",
				"zIndex": 99998
			});
		}

		// Set the focus on the action button in the alert if an action was set to be focused on.
		var isFocusedOnAnAction = false;
		if (self.startFocus) {
			for (var i=0; i<self._buttons.length; i++) {
				if (self.startFocus == self._buttons[i].label) {
					self._buttons[i].focus();
					isFocusedOnAnAction = true;
					break;
				}
			}
		}
		// Make sure that the focus is on an action in the Alert if it is a modal alert.
		if (!isFocusedOnAnAction && this.modal && self._buttons && self._buttons.length > 0) {
			self._buttons[self._buttons.length - 1].focus();
		}

		if (self.titleStr) {
			self.titleHeader.innerHTML = self.titleStr;
		}
		self.content.innerHTML = self.message

		this._animation = {
			node: self.domNode,
			easing: dojo.fx.easing.bounceOut,
			duration: 200,
			onEnd: function() {
				if (handler) handler()
			}
		}
		
		this._animation.properties = {
			top: self.destination.t,
			left: self.destination.l,
			width: (self.destination.w),
			height: (self.destination.h)
		}

		dojo.animateProperty(this._animation).play()
	},
	
	hide: function(handler) {
		var self = this

		var w = dijit.getViewport()

		if (this.modal) dojo.style(this._curtain, {
			visibility: "hidden"
		})

		this._animation = {
			node: self.domNode,
			easing: dojo.fx.easing.bounceOut,
			duration: 200,
			onEnd: function() {
				if (self.domNode) dojo.style(self.domNode, {
					visibility: "hidden"
				})
				if (handler) handler()
			}
		}
		this._animation.properties = {
			top: self.origin.t,
			left: self.origin.l,
			width: 0,
			height: 0
		}

		dojo.animateProperty(this._animation).play()
	},
	
	destroy: function() {
		// delete modal curtain
		//if (this.modal) 
		
		this.inherited(arguments)
	},
	
	// TODO: showing/hiding the button on mouse over is not working
	_showButtons: function() {
		return
		
		dojo.forEach(this._buttons, function(button) {
			dojo.style(button, {
				visibility: 'visible'
			})
		})
	},
	
	_hideButtons: function() {
		return 
		
		dojo.forEach(this._buttons, function(button) {
			dojo.style(button, {
				visibility: 'hidden'
			})
		})
	}

})

apstrata.alert = function(msg, origin) {
	var dialog = new apstrata.widgets.Alert({width: 300, 
											height: 300, 
											actions: "close", 
											message: msg, 
											clazz: "rounded-sml Alert", 
											iconSrc: apstrata.baseUrl + "/resources/images/pencil-icons/alert.png", 
											animation: {from: origin}, 
											modal: true })

	dialog.show()
	var handle = dojo.connect(dialog, "buttonPressed", function(label) {
		dojo.disconnect(handle)
		dialog.hide()
		dialog.destroy()
	})
}

