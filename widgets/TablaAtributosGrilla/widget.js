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
 * @module TablaAtributosGrilla
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
    Color
  ) {

    /**
     * Crea un nuevo TablaAtributosGrilla (Constructor)
     * @class
     * @alias module:TablaAtributosGrilla
     * @property {String} templateString - Contenido del archivo template.html
     * @property {String} baseClass - valor del atributo class del nodo traido en el template
     * @property {String} id - identificador del widget
     *
     */
    return declare("TablaAtributosGrilla", [_WidgetBase, _TemplatedMixin,
      _WidgetsInTemplateMixin], {
      templateString: template,
      baseClass: "widget-TablaAtributosGrilla",
      id:'',
      dockGri: null,
      floatingPaneGri: null,
      columnsGri: null,
      dataStoreGri: null,
      gridGrilla: null,
      CustomGridGrilla: null,
      fieldOIDGrilla: null,
      map: null,
      simbologiaPunto: null,
      simbologiaLinea: null,
      simbologiaPoligono: null,
      /**
       * Funcion del ciclo de vida del Widget en Dojo, se dispara cuando
       * todas las propiedades del widget son definidas y el fragmento
       * HTML es creado, pero este no ha sido incorporado en el DOM.
       *
       * @function
       */
      postCreate: function() {
        this.inherited(arguments);
        this.dockGri = new Dock({
          id: 'dockGrilla',
          style: 'position:absolute; bottom:0; right:0; height:0px; width:0px; display:none; z-index:0;' //tuck the dock into the the bottom-right corner of the app
        }, domConstruct.create('div', null, win.body()));
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


        this.floatingPaneGri = new fixFloatingPane({
          id: 'FP_TablaAtributosGrilla',
          title: 'Tabla de Atributos Grilla',
          minSize: 300,
          //href: 'html/options.html',
          //preload: true, //if you want to load content on app load set preload to true
          resizable: true, //allow resizing
          closable: false, //we never want to close a floating pane - this method destroys the dijit
          dockable: true, // yes we want to dock it
          dockTo: this.dockGri, //if you create the floating pane outside of the same function as the dock, you'll need to set as dijit.byId('dock')
          style: 'position:absolute;top:130px;left:202px;width:500px;height:300px;z-index:999 !important',
          content: this
            //you must set position:absolute; and provide a top and left value (right and bottom DO NOT WORK and will cause the floating pane to appear in strange places depending on browser, for example 125684 pixels right)
            //Why top and left? The position of a floating pane is a relationship between the top-left corner of dojo.window and the top-left corner of the dijit
            //you must also set a height and width
            //z-index is mainly irrelavant as the dijit will control its own z-index, but I always set it to 999 !important to avoid the occasional and mysterious problem of the title and content panes of the floating pane appearing at different z-indexes
        }, domConstruct.create('div', null, win.body()));
        this.floatingPaneGri.startup();
        //CONSTRUCCION DE TABLA
        this.CustomGridGrilla = declare([GridDefinition, Pagination,
          Keyboard,
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
      /**
       * Funcion dedicada a resaltar los features que se seleccionen en el grid
       * directamente desde un objeto de JavaScript
       * @param {string} data - Informacion enviada desde el grid
       * @function
       */

      setDataFeaturesObject: function(data) {
        console.log("EN METODO PERSONALIZADO TABLA...");
        console.log(data);

        if (this.gridGrilla != null) {
          this.gridGrilla.destroy();
          this.clearSelection();
        }

        this.columnsGri = {};
        data.fields.forEach(field => {
          if (typeof field.alias != undefined)
            this.columnsGri[field.name] = field.name;
          else
            this.columnsGri[field.name] = field.alias;
          if (field.type == 'esriFieldTypeOID')
            this.fieldOIDGrilla = field.name;
        });

        let attributes = [];
        data.features.forEach(feature => {
          attributes.push(feature.attributes);
        });
        console.log(attributes);

        dataStoreGri = new Memory({
          idProperty: this.fieldOIDGrilla,
          data: attributes
        });

        this.gridGrilla = new this.CustomGridGrilla({
          store: dataStoreGri,
          columns: this.columnsGri,
          selectionMode: 'extended',
          cellNavigation: false,
          className: 'gridTablaAtributos',
          rowsPerPage: 10,
        }, 'dataGrid');
        this.gridGrilla.on("dgrid-select", lang.hitch(this, this.resaltarFeaturesObjeto));
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
        if (this.gridGrilla == null)
          return false;
        this.filterEstore = [];
        let keys = Object.keys(this.columnsGri);
        this.gridGrilla.set("query", lang.hitch(this, function(fila) {
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
        this.gridGrilla.set("query", {});
      },
      resaltarFeatures: function(objRow) {
        let objectIds = [];
        objRow.rows.forEach(row => {
          objectIds.push(row.data[this.fieldOIDGrilla]);
        });

        let query = new Query();
        query.objectIds = objectIds;
        switch (this.capaWidgetSelected.tipo) {
          case 'A':
          case 'D':
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
          case 'E':
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
          objectIds.push(row.data[this.fieldOIDGrilla]);
        });

        console.log(objectIds);



      },
      clearSelection: function(event) {
        if (this.gridGrilla == null)
          return false;
        this.gridGrilla.refresh();
        switch (this.capaWidgetSelected.tipo) {
          case 'A':
          case 'D':
            this.capaWidgetSelected.layer.clearSelection();
            break;
          case 'C':
          case 'E':
            this.capaWidgetSelected.layer[0].clearSelection();
            break;

        }

      },
      export2shp: function(event) {
        alert('exportar!');
      }
    });
  });
