/**
 * Dojo AMD (Asynchronous Module Definition )
 * Widget que muestra resultado de analisis de limites y permite persistir
 * los datos en base de datos.
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
    "dijit/ConfirmDialog",
    "esri/request",
    "dojo/request",
    "dojo/request/notify",
    "dojo/on",
    "dojo/dom",
    "dojo/dom-class",
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
    Dialog,
    ConfirmDialog,
    esriRequest,
    request,
    notify,
    on,
    dom,
    domClass
  ) {

    /**
     * Crea un nuevo TablaResultadoAnalisisLimite (Constructor)
     * @class
     * @alias module:TablaResultadoAnalisisLimite
     * @property {String} templateString - Contenido del archivo template.html
     * @property {String} baseClass - valor del atributo class del nodo traido en el template
     * @property {String} id - identificador del widget
     *
     */
    return declare("TablaResultadoAnalisisLimite", [_WidgetBase,
      _TemplatedMixin,
      _WidgetsInTemplateMixin], {
      templateString: template,
      baseClass: "widget-TablaAtributos",
      id: 'Widget_TablaResultadoAnalisisLimite',
      dock: null,
      floatingPane: null,
      columns: [null, null],
      dataStore: [null, null],
      grid: [null, null],
      capaWidgetSelected: [null, null],
      CustomGrid: null,
      fieldOID: [null, null],
      map: null,
      simbologiaPunto: null,
      simbologiaLinea: null,
      simbologiaPoligono: null,
      positionTop: 142,
      positionLeft: 408,
      titleFloatingPane: 'TABLA DE RESULTADO ANALISIS DE LIMITES',
      tablaNode: [null, null],
      datosEnviarServicio: null,
      jsonEnviarServicio: null,
      urlServicioBusqueda: 'http://172.28.9.203:8080/AdministradorUsuariosWS/WS/solicitud/buscar/',
      urlServicioPersistencia: 'http://172.28.9.203:8080/AdministradorUsuariosWS/WS/solicitud/analisis/registrar',
      numeroSolicitudGlobal: null,
      tipoSolicitud: null,
      /**
       * Funcion del ciclo de vida del Widget en Dojo, se dispara cuando
       * todas las propiedades del widget son definidas y el fragmento
       * HTML es creado, pero este no ha sido incorporado en el DOM.
       *
       * @function
       */
      postCreate: function() {
        this.inherited(arguments);
        this.tablaNode[0] = this.tablaNodeA;
        // this.tablaNode[1] = this.tablaNodeB;
        this.dock = registry.byId('dock');
        if (this.dock == undefined)
          this.dock = new Dock({
            id: 'dock',
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

        this.floatingPane = new fixFloatingPane({
          id: this.id + '_FP_analisisLimites',
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
            'px;width:795px;height:444px;z-index:999 !important',
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

        on(dom.byId("numeroSolicitud"), 'keyup', this.countChar);
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
        // console.log(this.id);
        // console.log(datos);
        // console.log(capaWidgetSelected);
        // console.log('******** LLEGO TODO');
        let typeGrid = -1;

        for (var i = 0; i < datos.fields.length; i++) {
          // console.log(datos.fields[i]);
          if (datos.fields[i].name == "PLANCHA" || datos.fields[i].name ==
            "FID_Grilla") {
            typeGrid = 0;
            break;
          } else {
            typeGrid = 1;
          }
        }

        if (this.grid[typeGrid] != null) {
          this.grid[typeGrid].destroy();
          //this.clearSelection();
        }
        this.capaWidgetSelected[typeGrid] = capaWidgetSelected;
        domConstruct.create('div', {
          id: 'dataGrid_' + typeGrid
        }, this.tablaNode[typeGrid]);
        //TITULOS
        this.columns[typeGrid] = {};
        datos.fields.forEach(field => {
          if (typeof field.alias != undefined)
            this.columns[typeGrid][field.name] = field.name;
          else
            this.columns[typeGrid][field.name] = field.alias;
          if (field.type == 'esriFieldTypeOID')
            this.fieldOID[typeGrid] = field.name;

        });
        //ATRIBUTOS
        let attributes = [];
        datos.features.forEach(feature => {
          attributes.push(feature.attributes);
        });
        this.dataStore[typeGrid] = new Memory({
          idProperty: this.fieldOID[typeGrid],
          data: attributes
        });

        this.datosEnviarServicio = this.dataStore[typeGrid]

        this.grid[typeGrid] = new this.CustomGrid({
          store: this.dataStore[typeGrid],
          columns: this.columns[typeGrid],
          selectionMode: 'extended',
          cellNavigation: false,
          className: 'gridTablaAtributos',
          rowsPerPage: 10,
        }, 'dataGrid_' + typeGrid);
        if (typeGrid == 0)
          this.grid[typeGrid].on("dgrid-select", lang.hitch(this,
            this.resaltarFeaturesPrincipal));
        else
          this.grid[typeGrid].on("dgrid-select", lang.hitch(this,
            this.resaltarFeaturesCercana));
        this.grid[typeGrid].refresh();
        this.grid[typeGrid].set("sort", this.columns[typeGrid].CODIGO
          .label,
          "ASC");
        // this.floatingPane.show();
        this.floatingPane.bringToTop();
        console.log("PANEL...");
        console.log(this.floatingPane);
        domClass.replace(this.floatingPane.domNode,
          "tablaResultadosVisible", "tablaResultadosOculta");
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

        let attributes = [];
        data.features.forEach(feature => {
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
        }, 'dataGrid');
        this.grid.on("dgrid-select", lang.hitch(this, this.resaltarFeaturesObjeto));
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
        if (this.grid[0] == null || this.grid[1] == null)
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
      persistirResultados: function(event) {
        let arregloResultados = null;
        let jsonEnviarServicio = null;
        let existe = false;
        let campoSolicitud = dom.byId("numeroSolicitud");
        let numeroSolicitud = null;

        // console.log("DATOS VACIOS");
        // console.log(this.datosEnviarServicio);

        if (this.datosEnviarServicio != null) {
          if (campoSolicitud.textLength != 0) {
            numeroSolicitud = campoSolicitud.value.replace(/\s/g, '');
            let urlServicios = this.urlServicioBusqueda;
            this.numeroSolicitudGlobal = numeroSolicitud;
            this.consultarDatosNumeroSolicitud(urlServicios,
              numeroSolicitud);
          } else {
            this.generarDialog("Digite un numero de Solicitud");
          }
        } else {
          this.generarDialog(
            "Debe realizar una operacion para consultar el numero");
        }

      },
      resaltarFeaturesPrincipal: function(objRow) {
        let objectIds = [];
        objRow.rows.forEach(row => {
          objectIds.push(row.data[this.fieldOID[0]]);
        });
        let query = new Query();
        query.objectIds = objectIds;
        switch (this.capaWidgetSelected[0].tipo) {
          case 'A':
          case 'D':
          case 'E':
            this.capaWidgetSelected[0].layer.clearSelection();
            this.capaWidgetSelected[0].layer.setSelectionSymbol(
              this.simbologiaPoligono);
            this.capaWidgetSelected[0].layer.selectFeatures(query,
              FeatureLayer.SELECTION_NEW, lang.hitch(this,
                function(
                  features) {
                  selectExtent = graphicsUtils.graphicsExtent(
                    features);
                  this.map.setExtent(selectExtent);
                }));
            break;
          case 'C':
            this.capaWidgetSelected[0].layer[0].clearSelection();
            this.capaWidgetSelected[0].layer[0].setSelectionSymbol(
              this
              .simbologiaPoligono);
            this.capaWidgetSelected[0].layer[0].selectFeatures(
              query,
              FeatureLayer.SELECTION_NEW, lang.hitch(this,
                function(
                  features) {
                  selectExtent = graphicsUtils.graphicsExtent(
                    features);
                  this.map.setExtent(selectExtent);
                }));
            break;
        }
      },
      resaltarFeaturesCercana: function(objRow) {
        let objectIds = [];
        objRow.rows.forEach(row => {
          objectIds.push(row.data[this.fieldOID[0]]);
        });
        let query = new Query();
        query.objectIds = objectIds;
        switch (this.capaWidgetSelected[1].tipo) {
          case 'A':
          case 'D':
          case 'E':
            this.capaWidgetSelected[1].layer.clearSelection();
            this.capaWidgetSelected[1].layer.setSelectionSymbol(
              this.simbologiaPoligono);
            this.capaWidgetSelected[1].layer.selectFeatures(query,
              FeatureLayer.SELECTION_NEW, lang.hitch(this,
                function(
                  features) {
                  selectExtent = graphicsUtils.graphicsExtent(
                    features);
                  this.map.setExtent(selectExtent);
                }));
            break;
          case 'C':
            this.capaWidgetSelected[1].layer[0].clearSelection();
            this.capaWidgetSelected[1].layer[0].setSelectionSymbol(
              this
              .simbologiaPoligono);
            this.capaWidgetSelected[1].layer[0].selectFeatures(
              query,
              FeatureLayer.SELECTION_NEW, lang.hitch(this,
                function(
                  features) {
                  selectExtent = graphicsUtils.graphicsExtent(
                    features);
                  this.map.setExtent(selectExtent);
                }));
            break;
        }
      },
      resaltarFeaturesObjeto: function(dataRow) {
        let objectIds = [];
        dataRow.rows.forEach(row => {
          objectIds.push(row.data[this.fieldOID]);
        });
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
      },
      generateConfirmDialog: function(msg, opt) {

        if (opt == 0) {
          myConfirmationDialog = new ConfirmDialog({
            title: '<i style="font-size:1.3em" class="icon ion-alert-circled"></i>' +
              ' <b>CONFIRMAR GUARDADO ANALISIS LIMITES</b>',
            content: msg,
            style: "width: 400px",
            closable: false,
            onExecute: lang.hitch(this, function() { //Callback function
              this.persistirInformacionResultados();
            })
          });
          myConfirmationDialog.show();
        } else {
          myConfirmationDialog = new ConfirmDialog({
            title: '<i style="font-size:1.3em" class="icon ion-alert-circled"></i>' +
              ' <b>CONFIRMAR GUARDADO ANALISIS LIMITES</b>',
            content: msg,
            style: "width: 400px",
            closable: false,
            onExecute: lang.hitch(this, function() { //Callback function
              this.persistirInformacionResultados();
            })
          });
          myConfirmationDialog.show();
        }
      },
      generarDialog: function(msg) {
        myDialog = new Dialog({
          title: '<i style="font-size:1.3em" class="icon ion-alert-circled"></i>' +
            ' <b>Informacion</b>',
          content: msg,
          style: "width: 400px"
        });
        myDialog.show();
      },
      consultarDatosNumeroSolicitud: function(url, num) {
        //GET
        request.get(url + num, {
          handleAs: "json"
        }).then(lang.hitch(this, function(
            response) {
            if (response.cantidadResultados != 0) {
              this.generateConfirmDialog(
                'La solicitud ' + num +
                ' ya tiene registros<br>¿Desea reemplazarlos?',
                0
              );
              this.tipoSolicitud = response.tipoReferencia;
            } else {
              this.generateConfirmDialog(
                'La solicitud no posee registros asociados, se almacenaran en la base de datos',
                1
              );
            }
          }),
          lang.hitch(this, function(error) {
            let excepcion = error.response.text;
            this.generarDialog(excepcion);
          })
        );
      },
      persistirInformacionResultados: function() {

        let urlServicios = this.urlServicioPersistencia;
        let objResultados = {
          "numero_solicitud": this.numeroSolicitudGlobal,
          resultados_solicitudes: []
        };

        console.log("TIPO SOLICITUD...");
        console.log(this.tipoSolicitud);

        if (this.tipoSolicitud == 1354 || this.tipoSolicitud == 1353) {
          this.datosEnviarServicio.data.map(function(item) {
            // console.log(item);
            objResultados.resultados_solicitudes.push({
              "nombre": item.OBJECTID_1,
              "codigo_departamento": item.COD_DEPART,
              "codigo_municipio": item.CODIGO,
              "no_plancha": item.PLANCHA,
              "medida": item.AREA.toFixed(2)
            });
          });
        } else if (this.tipoSolicitud == 1352) {
          this.datosEnviarServicio.data.map(function(item) {
            // console.log(item);
            objResultados.resultados_solicitudes.push({
              "nombre": item.OBJECTID_1,
              "codigo_departamento": item.COD_DEPART,
              "codigo_municipio": item.CODIGO,
              "no_plancha": item.PLANCHA,
              "medida": item.LONGITUD_PERIMETRO.toFixed(2)
            });
          });
        } else {
          this.datosEnviarServicio.data.map(function(item) {
            // console.log(item);
            objResultados.resultados_solicitudes.push({
              "nombre": item.OBJECTID_1,
              "codigo_departamento": item.COD_DEPART,
              "codigo_municipio": item.CODIGO,
              "no_plancha": item.PLANCHA
            });
          });
        }

        this.jsonEnviarServicio = JSON.stringify(objResultados);

        //POST
        request.post(urlServicios, {
          data: this.jsonEnviarServicio,
          headers: {
            "Content-Type": "application/json"
          }
        }).then(lang.hitch(this, function(response) {
            this.generarDialog(
              'Se ha guardado la informacion en la Base de Datos'
            );
          }),
          lang.hitch(this, function(error) {
            let excepcion = error.response.text;
            this.generarDialog(excepcion);
          })
        );
      },
      countChar: function(event) {
        let tamanoActualText = event.explicitOriginalTarget.textLength;

        if (tamanoActualText == 4 || tamanoActualText == 15) {

          let valorActualText = event.explicitOriginalTarget.value;
          let campoSolicitud = dom.byId("numeroSolicitud");
          valorActualText += " " + "-" + " ";
          campoSolicitud.value = valorActualText.toUpperCase();
        }
      }
    });
  });
