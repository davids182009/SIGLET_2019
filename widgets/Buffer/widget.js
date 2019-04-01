/**
 * Dojo AMD (Asynchronous Module Definition )
 * Widget que representa la funcionalidad para agregar URL o archivos externos al mapa
 * @version 1.0
 * @author
 * History
 *
 */

/**
 * Descripción Widget
 * @module NombreWidget
 */

define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!./template.html",
    "dijit/form/FilteringSelect",
    "dijit/registry",
    "dojo/query",
    "dojo/store/Memory",
    "dojo/Deferred",
    'dojo/_base/lang',
    "dojo/topic",
    "dojo/on",
    "dojo/dom",
    "dijit/Dialog",
    "esri/tasks/GeometryService",
    "esri/tasks/BufferParameters",
    "esri/map",
    "esri/geometry/normalizeUtils",
    "dojox/timing",
    "esri/symbols/SimpleFillSymbol",
    "esri/graphic",
    "esri/symbols/SimpleLineSymbol",
    "esri/Color",
    "esri/layers/FeatureLayer",
    "dojo/dom-style"
  ],
  function(declare,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    template,
    FilteringSelect,
    registry,
    query,
    Memory,
    Deferred,
    lang,
    topic,
    on,
    dom,
    Dialog,
    GeometryService,
    BufferParameters,
    map,
    normalizeUtils,
    timing,
    SimpleFillSymbol,
    Graphic,
    SimpleLineSymbol,
    Color,
    FeatureLayer,
    domStyle
  ) {

    /**
     * Crea un nuevo NombreWidget (Constructor)
     * @class
     * @alias module:NombreWidget
     * @property {String} templateString - Contenido del archivo template.html
     * @property {String} baseClass - valor del atributo class del nodo traido en el template
     * @property {String} id - identificador del widget
     *
     */
    return declare("Buffer", [_WidgetBase, _TemplatedMixin,
      _WidgetsInTemplateMixin], {

      templateString: template,
      baseClass: "widget-Buffer",
      id: '',
      listadoCapas: [],
      layerExplorer: null,
      objFields: null,
      objgeomType: null,
      nombreSalidaBuffer: null,

      /**
       * Funcion del ciclo de vida del Widget en Dojo, se dispara cuando
       * todas las propiedades del widget son definidas y el fragmento
       * HTML es creado, pero este no ha sido incorporado en el DOM.
       *
       * @function
       */
      postCreate: function() {
        this.inherited(arguments);
        this.layerExplorer = registry.byNode(query('.layerexplorer')[0]);
        this.verificarCapas().then(lang.hitch(this, function(r) {
          if (r.length !== 0) {
            this.listadoCapas = new Memory({
              data: r
            });
          } else {
            this.listadoCapas = new Memory({
              data: []
            });
          }
        }));
      },
      /**
       * Funcion del ciclo de vida del Widget en Dojo,se dispara despues
       * del postCreate, cuando el nodo ya esta insertado en el DOM.
       *
       * @function
       */
      startup: function() {
        this.inherited(arguments);
        this.configurarBtns();
        topic.subscribe("identificarWidget", lang.hitch(this, this._actualizarListadoCapas));
      },
      /**
       * Codigo a ejecutar antes de destruir el widget
       *
       * @function
       */
      onDestroy: function() {

      },
      configurarBtns: function() {

        let calBuffer = new FilteringSelect({
          name: "selectLayer",
          id: "calBuffer",
          style: "width: 100%;",
          store: this.listadoCapas,
          searchAttr: "name"
        }, "divBasico").startup();

        on(dom.byId("btnBuffer"), "click", dojo.hitch(this,
          function(evt) {
            let idCapa = this.listadoCapas.query({
              id: registry.byId("calBuffer").get('value')
            });
            let capaSeleccionada = registry.byId("calBuffer").get(
              'value');
            let cantidadMedidabuffer = registry.byId(
              "cantidadBuffer").get(
              'value');
            let nombreCapaTemporal = registry.byId(
              "nombreBuffer").get(
              'value');
            let unidadMedidaBuffer = registry.byId(
              "calAtrrBuffer").get(
              'value');
            let mensajeValidacion = "Debe proporcionar:";

            if (capaSeleccionada == '' || capaSeleccionada ==
              undefined) {
              mensajeValidacion += " Una capa de la lista,";
            }
            if (cantidadMedidabuffer == '' || cantidadMedidabuffer ==
              undefined) {
              mensajeValidacion += " Un valor para la distancia,";
            }
            if (nombreCapaTemporal == '' || nombreCapaTemporal ==
              undefined) {
              mensajeValidacion +=
                " Un nombre de salida para el resultado del proceso,";
            }
            if (mensajeValidacion != "Debe proporcionar:") {
              let mensaje = mensajeValidacion.slice(0, -1);
              this.generarDialog(mensaje);
            } else {
              this.nombreSalidaBuffer = nombreCapaTemporal;
              this.generarBuffer(idCapa, unidadMedidaBuffer,
                cantidadMedidabuffer);
            }
          }
        ));
      },
      verificarCapas: function() {
        let deferred = new Deferred();
        layerCapa = this.layerExplorer.listarCapas();
        let lista = [];
        for (i = 0; i < layerCapa.length; i++) {
          lista[i] = {
            id: layerCapa[i].id,
            name: '' + layerCapa[i].name,
          };
        }
        deferred.resolve(lista);
        return deferred.promise;
      },
      _actualizarListadoCapas: function(e) {
        layerCapa = this.layerExplorer.listarCapas();
        if (!e.name.startsWith("Buffer")) {
          if (e.accion === 'CREAR') {

            this.listadoCapas.put({
              id: e.idWidget,
              name: e.name
            });

          } else {
            this.listadoCapas.remove(e.idWidget);
          }
          registry.byId("calBuffer").set("store", this.listadoCapas);
        }
      },
      generarDialog: function(msg) {
        myDialog = new Dialog({
          title: '<i style="font-size:1.3em" class="icon ion-alert-circled"></i>' +
            ' <b>BUFFER</b>',
          content: msg,
          style: "width: 300px"
        });
        myDialog.show();
      },
      generarBuffer: function(idCapa, unidadMedidaBuffer,
        cantidadMedidabuffer) {

        domStyle.set(this.mask, 'display', 'block');
        let layerCapa = this.layerExplorer.listarCapas();
        let capaBuffer = idCapa[0].id;
        let capaFeature = [];

        layerCapa.forEach(function(element) {
          if (element.id == capaBuffer) {
            //validar el tipo de capa seleccionada
            if (element.tipo == 'A' || element.tipo == 'B' ||
              element.tipo == 'E') {
              capaFeature = element.layer;
            } else {
              if (element.subTipo != "KML") {
                capaFeature = element.layer[0];
              } else if (element.subTipo != "shapefile") {
                capaFeature = element.layer[0];
              } else if (element.subTipo != "CSV") {
                capaFeature = element.layer[0];
              } else {
                capaFeature = element.layer[0];
              }
            }
          }
        });

        var gserver = new GeometryService(
          // "http://sigotws.igac.gov.co:6080/arcgis/rest/services/Utilities/Geometry/GeometryServer"
          "http://172.17.3.142:6080/arcgis/rest/services/Utilities/Geometry/GeometryServer"
        );
        this.objFields = capaFeature.fields;
        this.objgeomType = "esriGeometryPolygon";
        let errores = false;
        let arrAtributos = []; //variable que contiene atributos
        let geometrias = []; //variable que contiene atributos
        let arrBuffer = []; //variable que contiene atributos

        capaFeature.graphics.forEach(function(objeto) {
          geometrias.push(objeto.geometry);
          arrAtributos.push(objeto.attributes);
        });

        geometrias.forEach(function(obj, valor) {
          let params = new BufferParameters();
          params.distances = [cantidadMedidabuffer];
          params.outSpatialReference = map.spatialReference;
          params.unit = GeometryService[unidadMedidaBuffer];

          normalizeUtils.normalizeCentralMeridian([obj]).then(dojo.hitch(
            this,
            function(normalizedGeometries) {
              let normalizedGeometry = normalizedGeometries[0];

              if (normalizedGeometry.type === "polygon") {
                //if geometry is a polygon then simplify polygon.  This will make the user drawn polygon topologically correct.
                gserver.simplify([normalizedGeometry], function(
                  geometries) {
                  params.geometries = geometries;
                  gserver.buffer(params, dojo.hitch(this,
                    function(geometry) {
                      arrBuffer[valor] = geometry[0];
                    }), dojo.hitch(this, function(error) {
                    errores = true;
                  }));
                });
              } else {
                params.geometries = [normalizedGeometry];
                gserver.buffer(params, dojo.hitch(this,
                  function(geometry) {
                    arrBuffer[i] = geometry[0];
                    console.log(geometry);
                  }), dojo.hitch(this, function(error) {
                  errores = true;
                }));
              }
            }));
        });

        let t = new timing.Timer(5000);
        t.onTick = dojo.hitch(this, function(i) {
          if (errores) {
            let msg =
              'No se puede generar el area de influencía de la capa seleccionada.';
            this.generarDialog(msg);
            console.log(
              "No se puede generar el area de influencía de la capa seleccionada."
            );
            t.stop();
          } else {
            if (parseInt(geometrias.length) === parseInt(arrBuffer.length)) {
              console.log("termino...");
              t.stop();
              this.generarCapaBuffer(arrBuffer, arrAtributos);
            }
          }
        });
        t.start();

        ////////

      },
      generarCapaBuffer: function(arrBuffer, arrAtributos) {

        let bufferFinal = [];
        let symbology = new SimpleFillSymbol(
          SimpleFillSymbol.STYLE_SOLID,
          new SimpleLineSymbol(
            SimpleLineSymbol.STYLE_SOLID,
            new Color([255, 0, 0, 0.65]), 2
          ),
          new Color([255, 0, 0, 0.35])
        );

        arrBuffer.forEach(function(obj, valor) {
          let graphic = new Graphic(obj, symbology, arrAtributos[
            valor]);
          bufferFinal[valor] = graphic;
        });

        let layerDefinition = {
          geometryType: this.objgeomType,
          spatialReference: map.spatialReference,
          fields: this.objFields,
          name: 'Buffer_' + this.nombreSalidaBuffer,
          drawingInfo: {
            renderer: {
              type: "simple",
              symbol: symbology
            }
          }
        }

        let featureCollection = {
          layerDefinition: layerDefinition,
          featureSet: {
            features: bufferFinal,
            geometryType: this.objgeomType,
            spatialReference: map.spatialReference
          }
        };

        let featureLayer = new FeatureLayer(featureCollection);
        let objTipo = [];
        objTipo.subTipo = 'Buffer';
        objTipo.name = 'Buffer_' + this.nombreSalidaBuffer;
        let layerExplorer = registry.byNode(query('.layerexplorer')[0]);
        layerExplorer.addResultadoGeoProceso(featureLayer, objTipo);
        domStyle.set(this.mask, 'display', 'none');
      }
    });
  });
