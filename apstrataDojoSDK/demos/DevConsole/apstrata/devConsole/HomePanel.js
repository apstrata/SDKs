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

dojo.provide("apstrata.devConsole.HomePanel")

dojo.require("dijit.form.Form");
dojo.require("dijit.form.Button");
dojo.require("dijit.form.ValidationTextBox");
dojo.require("dijit.form.SimpleTextarea");
dojo.require("dijit.form.DateTextBox");
dojo.require("dijit.form.HorizontalSlider")
dojo.require("dijit.form.HorizontalRuleLabels")


dojo.declare("apstrata.devConsole.HomePanel", 
[dijit._Widget, dojox.dtl._Templated, apstrata.horizon._HStackableMixin], 
{
	widgetsInTemplate: true,
	templatePath: dojo.moduleUrl("apstrata.devConsole", "templates/HomePanel.html"),

	maximizePanel: true,
	
	postCreate: function() {
		var self = this

		dojo.publish("/apstrata/documentation/topic", [{
			topic: "apstrata API",
			id: "ApstrataAPI"
		}])
		
		this.inherited(arguments)
	},
})
