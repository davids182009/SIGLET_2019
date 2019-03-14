//>>built
define("dojox/grid/TreeSelection","../main dojo/_base/declare dojo/_base/array dojo/_base/lang dojo/dom-attr dojo/query ./DataSelection".split(" "),function(g,m,n,p,h,k,l){return m("dojox.grid.TreeSelection",l,{setMode:function(a){this.selected={};this.sorted_sel=[];this.sorted_ltos={};this.sorted_stol={};l.prototype.setMode.call(this,a)},addToSelection:function(a){if("none"!=this.mode){var b=null,b="number"==typeof a||"string"==typeof a?a:this.grid.getItemIndex(a);this.selected[b]?this.selectedIndex=
b:!1!==this.onCanSelect(b)&&(this.selectedIndex=b,a=k("tr[dojoxTreeGridPath\x3d'"+b+"']",this.grid.domNode),a.length&&h.set(a[0],"aria-selected","true"),this._beginUpdate(),this.selected[b]=!0,this._insertSortedSelection(b),this.onSelected(b),this._endUpdate())}},deselect:function(a){if("none"!=this.mode){var b=null,b="number"==typeof a||"string"==typeof a?a:this.grid.getItemIndex(a);this.selectedIndex==b&&(this.selectedIndex=-1);this.selected[b]&&!1!==this.onCanDeselect(b)&&(a=k("tr[dojoxTreeGridPath\x3d'"+
b+"']",this.grid.domNode),a.length&&h.set(a[0],"aria-selected","false"),this._beginUpdate(),delete this.selected[b],this._removeSortedSelection(b),this.onDeselected(b),this._endUpdate())}},getSelected:function(){var a=[],b;for(b in this.selected)this.selected[b]&&a.push(this.grid.getItem(b));return a},getSelectedCount:function(){var a=0,b;for(b in this.selected)this.selected[b]&&a++;return a},_bsearch:function(a){for(var b=this.sorted_sel,d=b.length-1,e=0,c;e<=d;){var f=this._comparePaths(b[c=e+d>>
1],a);if(0>f)e=c+1;else if(0<f)d=c-1;else return c}return 0>f?c-f:c},_comparePaths:function(a,b){for(var d=0,e=a.length<b.length?a.length:b.length;d<e;d++){if(a[d]<b[d])return-1;if(a[d]>b[d])return 1}return a.length<b.length?-1:a.length>b.length?1:0},_insertSortedSelection:function(a){a=String(a);var b=this.sorted_sel,d=this.sorted_ltos,e=this.sorted_stol,c=a.split("/"),c=n.map(c,function(a){return parseInt(a,10)});d[c]=a;e[a]=c;0===b.length?b.push(c):1==b.length?1==this._comparePaths(b[0],c)?b.unshift(c):
b.push(c):(a=this._bsearch(c),this.sorted_sel.splice(a,0,c))},_removeSortedSelection:function(a){a=String(a);var b=this.sorted_sel,d=this.sorted_ltos,e=this.sorted_stol;if(0!==b.length){var c=e[a];if(c){var f=this._bsearch(c);-1<f&&(delete d[c],delete e[a],b.splice(f,1))}}},getFirstSelected:function(){if(!this.sorted_sel.length||"none"==this.mode)return-1;var a=this.sorted_sel[0];return a?(a=this.sorted_ltos[a])?a:-1:-1},getNextSelected:function(a){if(!this.sorted_sel.length||"none"==this.mode)return-1;
a=String(a);a=this.sorted_stol[a];if(!a)return-1;a=this._bsearch(a);return(a=this.sorted_sel[a+1])?this.sorted_ltos[a]:-1},_range:function(a,b,d){!p.isString(a)&&0>a&&(a=b);var e=this.grid;a=new g.grid.TreePath(String(a),e);b=new g.grid.TreePath(String(b),e);0<a.compare(b)&&(e=a,a=b,b=e);b=b._str;for(d(a._str);(a=a.next())&&a._str!=b;)d(a._str);d(b)}})});