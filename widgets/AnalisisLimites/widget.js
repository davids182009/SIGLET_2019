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
 * @module AnalisisLimites
 */

let contenidoArchivoMun = null;
define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!./template.html",
    "dijit/layout/TabContainer",
    "dijit/layout/ContentPane",
    "dijit/form/Select",
    "dijit/form/NumberTextBox",
    "dijit/form/FilteringSelect",
    "dojo/query",
    "dijit/registry",
    "dojo/store/Memory",
    "dojo/topic",
    "dojo/_base/lang",
    "esri/layers/GraphicsLayer",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/Color",
    "esri/graphic",
    "esri/tasks/IdentifyTask",
    "esri/tasks/IdentifyParameters",
    "dojo/_base/array",
    "./feature/WidgetFeature",
    "esri/tasks/query",
    "esri/layers/FeatureLayer",
    "esri/geometry/Extent",
    "esri/geometry/geometryEngine",
    "dojo/dom-class",
    "esri/tasks/FeatureSet",
    "esri/tasks/Geoprocessor",
    "dojo/request/script",
    "dojo/request",
    "esri/request",
    "esri/layers/LayerSource",
    "widgets/TablaAtributos/widget",
    "widgets/TablaResultadoAnalisisLimite/widget",
    "dojo/dom-style",
    "dijit/Dialog",
    "dojo/promise/all",
    "esri/renderers/SimpleRenderer",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/graphic"
],
  function(declare,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    template,
    TabContainer,
    ContentPane,
    Select,
    NumberTextBox,
    FilteringSelect,
    query,
    registry,
    Memory,
    topic,
    lang,
    GraphicsLayer,
    SimpleFillSymbol,
    SimpleLineSymbol,
    Color,
    Graphic,
    IdentifyTask,
    IdentifyParameters,
    array,
    WidgetFeature,
    Query,
    FeatureLayer,
    Extent,
    geometryEngine,
    domClass,
    FeatureSet,
    Geoprocessor,
    script,
    request,
    esriRequest,
    LayerSource,
    TablaAtributos,
    TablaResultadoAnalisisLimite,
    domStyle,
    Dialog,
    all,
    SimpleRenderer,
    SimpleMarkerSymbol,
    graphic
  ) {

    /**
     * Crea un nuevo AnalisisLimites (Constructor)
     * @class
     * @alias module:AnalisisLimites
     * @property {String} templateString - Contenido del archivo template.html
     * @property {String} baseClass - valor del atributo class del nodo traido en el template
     * @property {String} id - identificador del widget
     *
     */
    return declare("AnalisisLimites", [
      _WidgetBase,
      _TemplatedMixin,
      _WidgetsInTemplateMixin
    ], {
      templateString: template,
      baseClass: "widget-AnalisisLimites",
      id: '',
      map: null,
      EventoIdentify: null,
      layer: null,
      simbologiaPolygon: null,
      simbologiaLinea: null,
      simbologiaPunto: null,
      countFeatures: 0,
      features: [],
      limitFeatures: 4,
      ids: 0,
      WidgetFeatureTarget: '0',
      estaEliminando: false,
      estaAnalizandoLimites: false,
      tablaAtributosMunicipios: null,
      tablaAtributosGrilla: null,
      tablaResultadoAnalisis: null,
      URLGeoProcess: null,
      jobNumber: null,
      GeoProcessThread: 0,
      datosAnalisis: {},
      datosMunicipiosCercanos: {},
      tipoGeometria: null,
      /**
       * Funcion del ciclo de vida del Widget en Dojo, se dispara cuando
       * todas las propiedades del widget son definidas y el fragmento
       * HTML es creado, pero este no ha sido incorporado en el DOM.
       *
       * @function
       */
      postCreate: function() {
        // console.log("WIDGET ANALISIS LIMITES...");
        // console.log(this.configWidget);
        this.inherited(arguments);
        this.URLGeoProcess = this.configWidget.urlServicio;
        //OBTENER CAPAS DE EXPLORADOR DE CAPAS
        this.map = registry.byId('EsriMap').map;
        let layerExplorer = registry.byNode(query('.layerexplorer')[0]);
        let lista = new Array();
        listCapaWidget = layerExplorer.listarCapas();
        // console.log(listCapaWidget);
        for (i = 0; i < listCapaWidget.length; i++) {
          lista[i] = {
            name: '' + listCapaWidget[i].name,
            idWidget: listCapaWidget[i].id
          };
        }
        this.listadoCapas = new Memory({
          idProperty: 'idWidget',
          data: lista
        });
        this.selectCapas.set('store', this.listadoCapas);
        topic.subscribe("identificarWidget", lang.hitch(this, this._actualizarListadoCapas));
        topic.subscribe("identificarWidgetFeature", lang.hitch(this,
          this._setAttributes));
        topic.subscribe("RemoveWidgetFeature", lang.hitch(this, this.removeFeature));
        //CREAR EVENTO Y GRAPHIC LAYER EN EL MAPA
        this.EventoIdentify = this.map.on("click", lang.hitch(this,
          this._identificar));
        this.layer = new GraphicsLayer({
          id: 'widget_analisis_limites'
        });
        this.simbologiaPolygon = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
          new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
            new Color([255, 255, 255]), 2), new Color([255, 10, 10, 1])
        );
        this.simbologiaPunto = new SimpleMarkerSymbol(
          SimpleMarkerSymbol.STYLE_SQUARE, 10,
          new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
            new Color([255, 0, 0]), 1),
          new Color([0, 255, 0, 0.25]));
        this.simbologiaLinea = new SimpleLineSymbol(
          SimpleLineSymbol.STYLE_SOLID,
          new Color([255, 10, 10, 0.85]), 6
        );

        this.map.addLayer(this.layer);
        //CREACION DE VENTANAS DE TABLAS DE RESULTADO ANALISIS
        this.tablaResultadoAnalisis = registry.byId(
          'Widget_TablaResultadoAnalisisLimite');
        console.log("SERVICIOS.....");
        console.log(this.configWidget.urlServicio2);
        console.log(this.configWidget.urlServicio3);
        if (this.tablaResultadoAnalisis == undefined) {
          this.tablaResultadoAnalisis = new TablaResultadoAnalisisLimite();
          this.tablaResultadoAnalisis.urlServicioConsulta = this.configWidget
            .urlServicio2;
          this.tablaResultadoAnalisis.urlServicioPersistencia = this.configWidget
            .urlServicio3;
          // this.tablaResultadoAnalisis.floatingPane.hide();
          // console.log(this.tablaResultadoAnalisis.floatingPane.domNode);
          domClass.add(this.tablaResultadoAnalisis.floatingPane.domNode,
            "tablaResultadosOculta");
        }
        /* this.tablaAtributosMunicipios = registry.byId(
          'Widget_TablaAtributosAnalisisMuni');
        if (this.tablaAtributosMunicipios == undefined)
          this.tablaAtributosMunicipios = new TablaAtributos({
            id: 'Widget_TablaAtributosAnalisisMuni',
            titleFloatingPane: '<b>ANALISIS LIMITES</b> - Resultado Municipios'
          });
        this.tablaAtributosMunicipios.floatingPane.hide();
        this.tablaAtributosGrilla = registry.byId(
          'Widget_TablaAtributosAnalisisGri');
        if (this.tablaAtributosGrilla == undefined)
          this.tablaAtributosGrilla = new TablaAtributos({
            id: 'Widget_TablaAtributosAnalisisGri',
            titleFloatingPane: '<b>ANALISIS LIMITES</b> - Resultado Grilla',
            positionTop: 160,
            positionLeft: 210
          });
        this.tablaAtributosGrilla.floatingPane.hide(); */
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
       * Responde a la publicacion de informacion del widget
       * LayerExplorer - Alimenta store de capas
       *
       * @function
       */
      _actualizarListadoCapas: function(e) {
        if (e.accion === 'CREAR')
          this.listadoCapas.put({
            //id:parseInt(e.id),
            name: e.name,
            idWidget: e.idWidget
          });
        else
          this.listadoCapas.remove(e.idWidget);
      },
      /**
       * Responde a la publicacion de informacion de
       * WidgetFeature - Atributos de la geometria
       *
       * @function
       */
      _setAttributes: function(data) {

        if (data.widgetFeatureId != this.WidgetFeatureTarget) {
          if (this.WidgetFeatureTarget != '0') {
            let oldFeature = registry.byId(this.WidgetFeatureTarget);
            domClass.remove(oldFeature.domNode, 'focus');
          }
          this.WidgetFeatureTarget = data.widgetFeatureId;
          let newFeature = registry.byId(this.WidgetFeatureTarget);
          domClass.add(newFeature.domNode, 'focus');
          this.indetifyCanvas.innerHTML = data.AttributesContent;

        }
      },
      /**
       * Responde para el evento click sobre el mapa, ejecuta la
       * tarea de identificar.
       *
       * @memberOf Identificar
       * @private
       * @instance
       * @callback
       *
       */
      _identificar: function(event) {
        /* console.log('Identificar trabajando..');
        console.log(this); */
        // console.log(this.estaEliminando);
        // console.log(this.estaAnalizandoLimites);
        if (this.estaEliminando || this.estaAnalizandoLimites)
          return false;
        let targetLayer = null;
        let fields = [];

        capaSelecionada = this.selectCapas.get('value');
        if (capaSelecionada.length > 0) {

          targetCapaWidget = registry.byId(this.listadoCapas.get(
            capaSelecionada).idWidget);
          dojo.style(this.btnRemove, "visibility", "visible");

          //OBTENER ALIAS DE CAMPOS
          switch (targetCapaWidget.tipo) {
            case 'A': //ESPACIAL
            case 'B': //TEMATICA
              fields = targetCapaWidget.layer.fields;
              targetLayer = targetCapaWidget.layer;
              break;
            case 'C': //ARCHIVO EXTERNO
              this.tipoGeometria = targetCapaWidget.layer[0].geometryType;
              fields = targetCapaWidget.layer[0].fields;
              targetLayer = targetCapaWidget.layer[0];
              break;
          }
          //console.log(fields);
          json = '{';
          for (var i = 0; i < fields.length; i++) {
            if (typeof fields[i].alias != 'undefined')
              json += '"' + fields[i].name + '":"' + fields[i].alias +
              '",';
            else
              json += '"' + fields[i].name + '":"' + fields[i].name +
              '",';
          }
          json = json.substring(0, (json.length - 1));
          json += '}';
          this.alias = JSON.parse(json);
          // console.log(this.alias);

          switch (targetCapaWidget.tipo) {
            case "A": //CAPA ESPACIAL
              switch (targetCapaWidget.infoCapa.TIPO) {
                case "REST":
                  identifyTask = new IdentifyTask(targetCapaWidget.infoCapa
                    .URL);
                  identifyParams = new IdentifyParameters();
                  identifyParams.tolerance = 100
                  identifyParams.returnGeometry = true;
                  identifyParams.layerIds = [parseInt(targetCapaWidget.infoCapa
                    .NOMBRECAPA)];
                  identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_ALL;
                  identifyParams.width = this.map.width;
                  identifyParams.height = this.map.height;
                  identifyParams.geometry = event.mapPoint;
                  identifyParams.mapExtent = this.map.extent;
                  identifyTask.execute(identifyParams).addCallback(lang
                    .hitch(this, function(response) {
                      array.map(response, lang.hitch(this, function(
                        result) {
                        this.addFeature(result.feature);
                      }));
                    }));
                  break;
              }
              break;
            case "B": //CAPA TEMATICA
            case "C": //CAPA ARCHIVO EXTERNO
              let queryFeatures = new Query();
              queryFeatures.geometry = this.pointToExtent(this.map,
                event.mapPoint, 1);
              //query.geometry = event.mapPoint;
              queryFeatures.outFields = ["*"];
              //this.consultaIdentify = targetCapaWidget.layer.selectFeatures(query,
              // this.consultaIdentify = targetLayer.selectFeatures(
              //   queryFeatures,
              //   FeatureLayer.SELECTION_NEW, lang.hitch(this, function(
              //     response) {


              this.consultaIdentify = targetLayer.queryFeatures(
                queryFeatures,
                lang.hitch(this, function(
                  response) {
                  console.log(response);
                  array.map(response.features, lang.hitch(this,
                    function(
                      result) {

                      let clon = result.clone();
                      this.addFeature(clon);
                    }));
                }));
              break;
          }
        }
      },
      pointToExtent: function(map, point, toleranceInPixel) {
        pixelWidth = map.extent.getWidth() / map.width;
        toleranceInMapCoords = toleranceInPixel * pixelWidth;
        return new Extent(point.x - toleranceInMapCoords,
          point.y - toleranceInMapCoords,
          point.x + toleranceInMapCoords,
          point.y + toleranceInMapCoords,
          map.spatialReference);
      },
      addFeature: function(feature) {
        let simbologia = null;
        if (this.countFeatures == this.limitFeatures)
          return false;
        if (typeof feature.symbol == 'undefined')
          feature = new Graphic(feature);
        let features = registry.findWidgets(this.canvasList);
        for (let j = 0; j < features.length; j++) {
          if (geometryEngine.equals(features[j].graphic.geometry,
              feature.geometry))
            return false;
        }

        if (this.tipoGeometria == "esriGeometryPoint") {
          simbologia = this.simbologiaPunto;
        } else if (this.tipoGeometria == "esriGeometryPolyline") {
          simbologia = this.simbologiaLinea;
        } else {
          simbologia = this.simbologiaPolygon;
        }

        feature.setSymbol(simbologia);
        this.layer.add(feature);
        this.ids++;
        this.countFeatures++;
        let element = new WidgetFeature({
          id: 'Analisis_limite_elemento_' + this.ids,
          graphic: feature,
          position: this.countFeatures
        });
        element.placeAt(this.canvasList, "last");
        //this.features.push(element);
      },
      ActivateRemoveFeature: function(event) {
        let features = [];
        features = query(".widget-WidgetFeature", this.canvasList);
        console.log("NUMERO FEATURES");
        console.log(features);
        if (features.length != 0) {
          if (this.estaEliminando) {
            this.estaEliminando = false;
            domClass.remove(this.btnRemove, 'active');
            for (let q = 0; q < features.length; q++) {
              domClass.remove(features[q], 'target');
            }
          } else {
            this.estaEliminando = true;
            domClass.add(this.btnRemove, 'active');
            for (let q = 0; q < features.length; q++) {
              domClass.add(features[q], 'target');
            }
          }
        } else {
          console.log("DESHABILITAR.....");
        }
      },
      removeFeature: function(idFeature) {
        let feature2remove = registry.byId(idFeature);
        this.layer.remove(feature2remove.graphic);
        feature2remove.destroy();
        let features = registry.findWidgets(this.canvasList);
        let q = 0;

        if (features != 0) {
          for (q = 0; q < features.length; q++) {
            features[q].position = q + 1;
            features[q].domNode.innerHTML = features[q].position;
          }
          this.countFeatures = q;
          if (this.WidgetFeatureTarget == idFeature) {
            this.WidgetFeatureTarget = '0';
          }
        } else {
          this.estaEliminando = false;
          domClass.remove(this.btnRemove, 'active');
          //dojo.style(this.btnRemove, "visibility", "hidden");
        }
      },
      doAnalysisProcess: function() {
        let features = registry.findWidgets(this.canvasList);
        let tamano = features.length;
        let geoprocessor;
        if (tamano != 0) {
          this.estaAnalizandoLimites = true;
          domStyle.set(this.mask, 'display', 'block');
          var featuresGraphics = [];
          var featureSet = new FeatureSet();
          for (var i = 0; i < features.length; i++) {
            featuresGraphics.push(features[i].graphic);
          }

          featureSet.features = featuresGraphics;
          geoprocessor = new Geoprocessor(
            this.URLGeoProcess
          );
          geoprocessor.setOutSpatialReference({
            wkid: 4326
          });

          let params = {
            json_entrada: featureSet
          }
          geoprocessor.submitJob(params, lang.hitch(this, this.procesarResultadoGeoProceso),
            this.estatusProceso);
        } else {
          this.generarDialog(
            'Debe seleccionar al menos una geometría para realizar el análisis.'
          );
        }
      },
      estatusProceso: function(jobInfo) {
        console.log("ESTATUS PROCESO...");
        console.log(jobInfo.jobStatus);
      },
      // procesarResultadoGeoProceso: function(jobInfo) {
      //   let requestURLAnalisis = request(jobInfo.url_analisis, {
      //     handleAs: "json"
      //   }).then(function(data) {
      //     return data;
      //   }, function(err) {
      //     return err;
      //   });
      //   let requestURLCercanos = request(jobInfo.url_cercanos, {
      //     handleAs: "json"
      //   }).then(function(data) {
      //     return data;
      //   }, function(err) {
      //     return err;
      //   });
      //   all([requestURLAnalisis, requestURLCercanos]).then(lang.hitch(
      //     this,
      //     function(result) {
      //       console.log(result);
      //       for (let i = 0; i < result.length; i++) {
      //         if (result[i].fieldAliases.BUFF_DIST == undefined)
      //           this.resultado2Capa(result[i], 'PRIMARIO');
      //         else
      //           this.resultado2Capa(result[i], 'CERCANOS');
      //       }
      //     }));
      // },
      procesarResultadoGeoProceso: function(jobInfo) {
        // console.log("EXITOO");
        this.GeoProcessThread = 0;
        this.checkStatusAnalisis();
        this.jobNumber++;
        this.jobInfo = jobInfo;
        let url = this.URLGeoProcess + "/jobs/";
        let jobId = jobInfo.jobId;
        let tailUrl = "/" + jobInfo.results.json_salida.paramUrl;
        let urlPeticion = url + jobId + tailUrl + "?f=json";
        let urlServidorArchivoJson = null;
        let urlServidorArchivoJson2 = null;
        let contenidoArchivoMun = null;

        script.get(urlPeticion, {
          jsonp: "callback"
        }).then(lang.hitch(this, function(response) {
          //SE ARMA LA PRIMERA URL DE LOS ARCHIVOS JSON DE RESPUESTA
          let valorPuntoComa = response.value.url.split(";");
          urlServidorArchivoJson = valorPuntoComa[0];
          //SE ARMA LA SEGUNDA URL DE LOS ARCHIVOS JSON DE RESPUESTA
          let nombreArchivoJson2 = valorPuntoComa[1];
          let ocurrenciaSlash = urlServidorArchivoJson.lastIndexOf(
            "/");
          let urlServidor2 = urlServidorArchivoJson.substring(
            0,
            ocurrenciaSlash);
          urlServidorArchivoJson2 = urlServidor2 + "/" +
            nombreArchivoJson2;

          // console.log(urlServidorArchivoJson);
          // console.log(urlServidorArchivoJson2);

          // console.log(requestURLAnalisis);
          // console.log(requestURLCercanos);

          // //PETICION ARCHIVO RESULTADO MUNICIPIOS
          var requestURLAnalisis = esriRequest({
            "url": urlServidorArchivoJson,
            "handleAs": "json"
          });
          requestURLAnalisis.then(function(data) {
            return data;
          }, function(err) {
            return err;
          });

          //PETICION ARCHIVO RESULTADO GRILLAS
          var requestURLCercanos = esriRequest({
            "url": urlServidorArchivoJson2,
            "handleAs": "json"
          });
          requestURLCercanos.then(function(data) {
            return data;
          }, function(err) {
            return err;
          });

          all([requestURLAnalisis, requestURLCercanos]).then(lang
            .hitch(
              this,
              function(result) {
                for (let i = 0; i < result.length; i++) {
                  if (result[i].fieldAliases.BUFF_DIST ==
                    undefined) {
                    this.resultado2Capa(result[i], 'PRIMARIO');
                  } else {
                    this.resultado2Capa(result[i], 'CERCANOS');
                  }
                }
              }));

        }));
      },
      resultado2Capa: function(resultados, tipo) {
        this.jobNumber++;
        if (tipo == "CERCANOS") {
          console.log("ES CERCANOS");
          console.log(resultados);
          return false;
          // let symbol = new SimpleFillSymbol();
          // symbol.setColor(new Color([150, 150, 150, 1]));
          //
          // let featureCollection = {
          //   layerDefinition: {
          //     geometryType: resultados.geometryType,
          //     spatialReference: resultados.spatialReference,
          //     objectIdField: this.getObjectIdField(resultados.fields),
          //     fields: resultados.fields,
          //     drawingInfo: {
          //       renderer: {
          //         type: "simple",
          //         symbol: symbol
          //       }
          //     },
          //     name: 'Analisis ' + this.jobNumber + ' - ' + tipo
          //   },
          //   featureSet: {
          //     features: resultados.features,
          //     geometryType: resultados.geometryType,
          //     spatialReference: resultados.spatialReference
          //   }
          // };
          //
          // let capaResultado = new FeatureLayer(featureCollection, {
          //   id: this._generateRandomId()
          // });

          // console.log(capaResultado);

        } else {
          console.log("ES PRIMARIO");
          console.log(resultados);
          let symbol = new SimpleFillSymbol();
          symbol.setColor(new Color([150, 150, 150, 1]));
          let featureCollection = {
            layerDefinition: {
              geometryType: resultados.geometryType,
              spatialReference: resultados.spatialReference,
              objectIdField: this.getObjectIdField(resultados.fields),
              fields: resultados.fields,
              drawingInfo: {
                renderer: {
                  type: "simple",
                  symbol: symbol
                }
              },
              name: 'Analisis ' + this.jobNumber + ' - ' + tipo
            },
            featureSet: {
              features: resultados.features,
              geometryType: resultados.geometryType,
              spatialReference: resultados.spatialReference
            }
          };

          let capaResultado = new FeatureLayer(featureCollection, {
            id: this._generateRandomId()
          });
          // this.map.addLayer(capaResultado);
          let job = {
            name: 'Analisis ' + this.jobNumber + ' - ' + tipo,
            subTipo: 'AnalisisLimites_' + tipo
          }
          this.cargarEnLayerExplorer(capaResultado, job);
        }

        // console.log(capaResultado);
        // let job = {
        //   name: 'Analisis ' + this.jobNumber + ' - ' + tipo,
        //   subTipo: 'AnalisisLimites_' + tipo
        // }
        // this.cargarEnLayerExplorer(capaResultado, job);
      },
      cargarEnLayerExplorer: function(layer, job) {
        let capaWidget = null;
        let result = {};
        result.fields = layer.fields;
        result.features = layer.graphics;
        let contenedorCapasWidget = registry.byNode(query(
          '.layerexplorer')[0]);
        capaWidget = contenedorCapasWidget.addResultadoGeoProceso(layer,
          job);
        this.tablaResultadoAnalisis.setDataFeatures(result, capaWidget);
        domStyle.set(this.mask, 'display', 'none');
        this.mostrarTablasAtributos();
        //console.log(layer);
        //console.log(capaWidget);
        /* switch (job.subTipo) {
          case 'AnalisisLimites_MUNICIPIO':
            console.log('TABLA DE ATRIBUTOS MUNICIPIO');
            this.tablaAtributosMunicipios.setDataFeatures(result,
              capaWidget);
            break;
          case 'AnalisisLimites_GRILLA':
            console.log('TABLA DE ATRIBUTOS GRILLA');
            this.tablaAtributosGrilla.setDataFeatures(result,
              capaWidget);
            break;
        } */
        this.GeoProcessThread++;
      },
      _generateRandomId: function() {
        var t = null;
        if (typeof Date.now === "function") {
          t = Date.now();
        } else {
          t = (new Date()).getTime();
        }
        var r = ("" + Math.random()).replace("0.", "r");
        return (t + "" + r).replace(/-/g, "");
      },
      getObjectIdField: function(fields) {
        for (let i = 0; i < fields.length; i++) {
          if (fields[i].type == 'esriFieldTypeOID')
            return fields[i].name;
        }
      },
      checkStatusAnalisis: function() {
        if (this.GeoProcessThread != 2) {
          setTimeout(lang.hitch(this, this.checkStatusAnalisis), 2000);
        } else {
          domStyle.set(this.mask, 'display', 'none');
          this.estaAnalizandoLimites = false;
        }
      },
      falloResultado2Capa: function(error) {
        console.log(error);
      },
      generarDialog: function(msg) {
        myDialog = new Dialog({
          title: '<i style="font-size:1.3em" class="icon ion-alert-circled"></i>' +
            ' <b>ANALISIS DE LIMITES</b>',
          content: msg,
          style: "width: 300px"
        });
        myDialog.show();
      },
      mostrarTablasAtributos: function() {
        this.tablaResultadoAnalisis.floatingPane.show();
        this.tablaResultadoAnalisis.floatingPane.bringToTop();
        domClass.replace(this.tablaResultadoAnalisis.floatingPane.domNode,
          "tablaResultadosVisible", "tablaResultadosOculta");
      }
    });
  });
