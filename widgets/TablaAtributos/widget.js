/**
 * Dojo AMD (Asynchronous Module Definition )
 * Widget que representa la funcionalidad para agregar URL o archivos externos al mapa
 * @version 1.0
 * @author Juan Carlos Valderrama Gonzalez<dyehuty@gmail.com>
 * History
 *
 */

/**
 * Descripción Widget
 * @module TablaAtributos
 */

define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/registry",
    "dojo/text!./template.html",
    "dojo/_base/window",
    "dojox/layout/FloatingPane",
    "dojox/layout/Dock",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/dnd/move",
    "dojo/_base/window",
    "dojo/_base/html",
    "dgrid/Grid",
    "dgrid/Keyboard",
    "dgrid/Selection",
    "dgrid/extensions/Pagination",
    "dojo/store/Memory",
    "dojo/_base/array",
    'dojo/_base/lang',
    "esri/tasks/query",
    "esri/layers/FeatureLayer",
    "esri/graphicsUtils",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/Color",
    "dijit/Dialog",
    "xstyle/css!./css/style.css"
],
  function(declare,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    registry,
    template,
    win,
    FloatingPane,
    Dock,
    domConstruct,
    domStyle,
    Move,
    win,
    html,
    GridDefinition,
    Keyboard,
    Selection,
    Pagination,
    Memory,
    dojoArray,
    lang,
    Query,
    FeatureLayer,
    graphicsUtils,
    SimpleFillSymbol,
    SimpleLineSymbol,
    Color,
    Dialog
  ) {

    /**
     * Crea un nuevo TablaAtributos (Constructor)
     * @class
     * @alias module:TablaAtributos
     * @property {String} templateString - Contenido del archivo template.html
     * @property {String} baseClass - valor del atributo class del nodo traido en el template
     * @property {String} id - identificador del widget
     *
     */
    return declare("TablaAtributos", [_WidgetBase, _TemplatedMixin,
      _WidgetsInTemplateMixin], {
      templateString: template,
      baseClass: "widget-TablaAtributos",
      id: 'Widget_TablaAtributos',
      dock: null,
      floatingPane: null,
      columns: null,
      dataStore: null,
      grid: null,
      CustomGrid: null,
      fieldOID: null,
      map: null,
      simbologiaPunto: null,
      simbologiaLinea: null,
      simbologiaPoligono: null,
      positionTop: 130,
      positionLeft: 202,
      titleFloatingPane: 'Tabla de Atributos',
      /**
       * Funcion del ciclo de vida del Widget en Dojo, se dispara cuando
       * todas las propiedades del widget son definidas y el fragmento
       * HTML es creado, pero este no ha sido incorporado en el DOM.
       *
       * @function
       */
      postCreate: function() {
        this.inherited(arguments);
        this.dock = registry.byId('dock');
        if (this.dock == undefined)
          this.dock = new Dock({
            id: 'dock',
            style: 'position:absolute; bottom:0; right:0; height:0px; width:0px; display:none; z-index:0;' //tuck the dock into the the bottom-right corner of the app
          }, domConstruct.create('div', null, win.body()));

        /*  this.dock = new Dock({
           id: 'dock',
           style: 'position:absolute; bottom:0; right:0; height:0px; width:0px; display:none; z-index:0;' //tuck the dock into the the bottom-right corner of the app
         }, domConstruct.create('div', null, win.body())); */
        let fixFloatingPane = declare(FloatingPane, {
          postCreate: function() {
            this.inherited(arguments);
            this.moveable = Move.constrainedMoveable(this.domNode, {
              handle: this.focusNode,
              constraints: function() {
                var coordsBody = html.coords(dojo.body());
                // or
                var coordsWindow = {
                  l: 0,
                  t: 0,
                  w: window.innerWidth,
                  h: window.innerHeight
                };
                return coordsWindow;
              },
              within: true
            })
          }
        });


        this.floatingPane = new fixFloatingPane({
          id: this.id + '_FP_TablaAtributos',
          title: this.titleFloatingPane,
          minSize: 300,
          class: 'FP_TablaAtributos',
          //href: 'html/options.html',
          //preload: true, //if you want to load content on app load set preload to true
          resizable: true, //allow resizing
          closable: false, //we never want to close a floating pane - this method destroys the dijit
          dockable: true, // yes we want to dock it
          dockTo: this.dock, //if you create the floating pane outside of the same function as the dock, you'll need to set as dijit.byId('dock')
          style: 'position:absolute;top:' + this.positionTop +
            'px;left:' + this.positionLeft +
            'px;width:500px;height:300px;z-index:999 !important',
          content: this
            //you must set position:absolute; and provide a top and left value (right and bottom DO NOT WORK and will cause the floating pane to appear in strange places depending on browser, for example 125684 pixels right)
            //Why top and left? The position of a floating pane is a relationship between the top-left corner of dojo.window and the top-left corner of the dijit
            //you must also set a height and width
            //z-index is mainly irrelavant as the dijit will control its own z-index, but I always set it to 999 !important to avoid the occasional and mysterious problem of the title and content panes of the floating pane appearing at different z-indexes
        }, domConstruct.create('div', null, win.body()));
        this.floatingPane.startup();
        //CONSTRUCCION DE TABLA
        this.CustomGrid = declare([GridDefinition, Pagination, Keyboard,
          Selection]);
        this.map = registry.byId('EsriMap').map;
        //DEFINICION ESTILOS QUE RESTALTAN FEATURES
        this.simbologiaLinea = new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASH,
          new Color([0, 99, 107]), 1);
        this.simbologiaPoligono = new SimpleFillSymbol(
          SimpleFillSymbol.STYLE_SOLID,
          this.simbologiaLinea,
          new Color([48, 144, 172, 0.7])
        );
      },
      /**
       * Funcion del ciclo de vida del Widget en Dojo,se dispara despues
       * del postCreate, cuando el nodo ya esta insertado en el DOM.
       *
       * @function
       */
      startup: function() {
        this.inherited(arguments);
      },
      setDataFeatures: function(datos, capaWidgetSelected) {
        console.log(this.id);
        console.log(datos);
        console.log(capaWidgetSelected);
        if (this.grid != null) {
          this.grid.destroy();
          this.clearSelection();
        }
        this.capaWidgetSelected = capaWidgetSelected;
        domConstruct.create('div', {
          id: 'dataGrid_' + this.id
        }, this.tablaNode);
        //TITULOS
        this.columns = {};
        datos.fields.forEach(field => {
          if (typeof field.alias != undefined)
            this.columns[field.name] = field.name;
          else
            this.columns[field.name] = field.alias;
          if (field.type == 'esriFieldTypeOID')
            this.fieldOID = field.name;

        });
        //ATRIBUTOS
        let attributes = [];
        datos.features.forEach(feature => {
          attributes.push(feature.attributes);
        });
        this.dataStore = new Memory({
          idProperty: this.fieldOID,
          data: attributes
        });
        this.grid = new this.CustomGrid({
          store: this.dataStore,
          columns: this.columns,
          selectionMode: 'extended',
          cellNavigation: false,
          className: 'gridTablaAtributos',
          rowsPerPage: 10,
        }, 'dataGrid_' + this.id);
        this.grid.on("dgrid-select", lang.hitch(this, this.resaltarFeatures));
        this.grid.refresh();
        this.floatingPane.show();
        this.floatingPane.bringToTop();

      },

      /**
       * Funcion dedicada a resaltar los features que se seleccionen en el grid
       * directamente desde un objeto de JavaScript
       * @param {string} data - Informacion enviada desde el grid
       * @function
       */

      setDataFeaturesObject: function(data) {
        // console.log("EN METODO PERSONALIZADO TABLA...");
        // console.log(data);

        if (this.grid != null) {
          this.grid.destroy();
          this.clearSelection();
        }

        this.columns = {};
        data.fields.forEach(field => {
          if (typeof field.alias != undefined)
            this.columns[field.name] = field.name;
          else
            this.columns[field.name] = field.alias;
          if (field.type == 'esriFieldTypeOID')
            this.fieldOID = field.name;
        });

        // console.log(this.columns);
        // this.columns.push({
        //   "GEOMETRIA":
        // });
        // this.columns.push();

        let attributes = [];
        data.features.forEach(feature => {
          attributes.push(feature.attributes);
        });
        console.log(attributes);

        this.dataStore = new Memory({
          idProperty: this.fieldOID,
          data: attributes
        });

        this.grid = new this.CustomGrid({
          store: this.dataStore,
          columns: this.columns,
          selectionMode: 'extended',
          cellNavigation: false,
          className: 'gridTablaAtributos',
          rowsPerPage: 10,
        }, 'dataGrid');
        this.grid.on("dgrid-select", lang.hitch(this, this.resaltarFeaturesObjeto));
        // this.grid.refresh();
        // this.floatingPane.show();
        // this.floatingPane.bringToTop();


      },
      /**
       * Responde a evento
       *
       * @memberof module:widgets/TablaAtributos#
       * @param {object} event - objeto del evento clic disparado
       *
       */
      closePopupNote: function(event) {
        domStyle.set(this.PopupNote, 'display', 'none');
      },
      buscar: function(event) {
        if (this.grid == null)
          return false;
        this.filterEstore = [];
        let keys = Object.keys(this.columns);
        this.grid.set("query", lang.hitch(this, function(fila) {
          let resultadoComparacion = false;
          let expresionRegular = new RegExp(this.inputParametroBusqueda
            .value, 'i');
          for (let j = 0; j < keys.length; j++) {
            if (expresionRegular.test(fila[keys[j]])) {
              resultadoComparacion = true;
            }
          }
          return resultadoComparacion;
        }));
      },
      limpiar: function(event) {
        this.inputParametroBusqueda.value = "";
        this.filterEstore = [];
        this.grid.set("query", {});
      },
      resaltarFeatures: function(objRow) {
        let objectIds = [];
        objRow.rows.forEach(row => {
          objectIds.push(row.data[this.fieldOID]);
        });

        let query = new Query();
        query.objectIds = objectIds;
        switch (this.capaWidgetSelected.tipo) {
          case 'A':
          case 'D':
          case 'E':
            this.capaWidgetSelected.layer.clearSelection();
            this.capaWidgetSelected.layer.setSelectionSymbol(this.simbologiaPoligono);
            this.capaWidgetSelected.layer.selectFeatures(query,
              FeatureLayer.SELECTION_NEW, lang.hitch(this, function(
                features) {
                selectExtent = graphicsUtils.graphicsExtent(
                  features);
                this.map.setExtent(selectExtent);
              }));
            break;
          case 'C':
            this.capaWidgetSelected.layer[0].clearSelection();
            this.capaWidgetSelected.layer[0].setSelectionSymbol(this.simbologiaPoligono);
            this.capaWidgetSelected.layer[0].selectFeatures(query,
              FeatureLayer.SELECTION_NEW, lang.hitch(this, function(
                features) {
                selectExtent = graphicsUtils.graphicsExtent(
                  features);
                this.map.setExtent(selectExtent);
              }));
            break;

        }

      },
      resaltarFeaturesObjeto: function(dataRow) {
        console.log("EN RESALTAR OBJETO");
        console.log(dataRow);

        let objectIds = [];
        dataRow.rows.forEach(row => {
          objectIds.push(row.data[this.fieldOID]);
        });

        console.log(objectIds);



      },
      clearSelection: function(event) {
        if (this.grid == null)
          return false;
        this.grid.refresh();
        switch (this.capaWidgetSelected.tipo) {
          case 'A':
          case 'D':
          case 'E':
            this.capaWidgetSelected.layer.clearSelection();
            break;
          case 'C':
            this.capaWidgetSelected.layer[0].clearSelection();
            break;

        }
      },
      export2csv: function(event) {
        if (this.dataStore == null) {
          this.generarDialog('La tabla de atributos esta vacia.');
          return;
        }
        let ReportTitle = 'Analisis_' + this.capaWidgetSelected.name;
        let arrData = this.dataStore.data;
        //let arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
        let CSV = '';
        let row = '';
        //This loop will extract the label from 1st index of on array
        for (var index in arrData[0]) {
          //Now convert each value to string and comma-seprated
          row += index + ',';
        }
        row = row.slice(0, -1);
        //append Label row with line break
        CSV += row + '\r\n';
        //1st loop is to extract each row
        for (var i = 0; i < arrData.length; i++) {
          row = "";
          //2nd loop will extract each column and convert it in string comma-seprated
          for (var index in arrData[i]) {
            row += '"' + arrData[i][index] + '",';
          }
          row.slice(0, row.length - 1);
          //add a line break after each row
          CSV += row + '\r\n';
        }
        if (CSV == '') {
          this.generarDialog('La tabla de atributos esta vacia.');
          return;
        }
        //Generate a file name
        let fileName = "MyReport_";
        //this will remove the blank-spaces from the title and replace it with an underscore
        fileName += ReportTitle.replace(/ /g, "_");
        //Initialize file format you want csv or xls
        var uri = 'data:text/csv;charset=iso-8859-1,' +
          encodeURIComponent(CSV);
        // Now the little tricky part.
        // you can use either>> window.open(uri);
        // but this will not work in some browsers
        // or you will not get the correct file extension

        //this trick will generate a temp <a /> tag
        var link = document.createElement("a");
        link.href = uri;

        //set the visibility hidden so it will not effect on your web-layout
        link.style = "visibility:hidden";
        link.download = fileName + ".csv";

        //this part will append the anchor tag and remove it after automatic click
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
      generarDialog: function(msg) {
        myDialog = new Dialog({
          title: '<i style="font-size:1.3em" class="icon ion-alert-circled"></i>' +
            ' <b>EXPORTAR TABLA ATRIBUTOS A CSV</b>',
          content: msg,
          style: "width: 400px"
        });
        myDialog.show();
      }
    });
  });
