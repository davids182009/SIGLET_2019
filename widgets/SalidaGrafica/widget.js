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
 * @module SalidaGrafica
 */

define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!./template.html",
    "dijit/form/FilteringSelect",
    "esri/request",
    "dojo/store/Memory",
    "dojo/_base/lang",
    "dijit/registry",
    "esri/dijit/Print",
    "dojo/dom",
    "esri/tasks/PrintTemplate",
    "esri/tasks/PrintParameters",
    "esri/tasks/PrintTask",
    "dojo/dom-style"
  ],
  function(declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
    template, FilteringSelect, request, Memory, lang, registry, Print, dom,
    PrintTemplate,
    PrintParameters,
    PrintTask,
    domStyle) {

    /**
     * Crea un nuevo SalidaGrafica (Constructor)
     * @class
     * @alias module:SalidaGrafica
     * @property {String} templateString - Contenido del archivo template.html
     * @property {String} baseClass - valor del atributo class del nodo traido en el template
     * @property {String} id - identificador del widget
     *
     */
    return declare("SalidaGrafica", [_WidgetBase, _TemplatedMixin,
      _WidgetsInTemplateMixin], {

      templateString: template,
      baseClass: "widget-SalidaGrafica",
      id: '',
      tipoPapel: null,
      tipoFormato: null,
      objImpresion: null,
      URLPrintService:'http://132.255.20.158:6080/arcgis/rest/services/Print/A4_Horizontal/GPServer/Export%20Web%20Map',
      template:null,
      map:null,
      /**
       * Funcion del ciclo de vida del Widget en Dojo, se dispara cuando
       * todas las propiedades del widget son definidas y el fragmento
       * HTML es creado, pero este no ha sido incorporado en el DOM.
       *
       * @function
       */
      postCreate: function() {
        this.inherited(arguments);
        this.map = registry.byId('EsriMap').map;
        /* this.objImpresion = new Print({
          map: this.map,
          url: this.URLPrintService
        }, this.btnExportMap);
        this.objImpresion.startup(); */
      },
      /**
       * Funcion del ciclo de vida del Widget en Dojo,se dispara despues
       * del postCreate, cuando el nodo ya esta insertado en el DOM.
       *
       * @function
       */
      startup: function() {
        this.inherited(arguments);
        this.template = new PrintTemplate();
        this.template.exportOptions = {
          width : 500,
          height : 500,
          dpi: 150
        };
        this.template.layoutOptions = {
          titleText:'SIG LIMITES Y FRONTERAS',
          authorText:'IGAC LIMITES Y FRONTERAS',
          copyrightText:'SIG LIMITES Y FRONTERAS, INSTITUTO GEOGRAFICO AGUSTIN CODAZZI',
          scalebarUnit:'Kilometers'
        };
        let printRequest = request({
          url: this.URLPrintService,
          content: {
            f: "json"
          },
          handleAs: "json",
          callbackParamName: "callback"
        });

        printRequest.then(lang.hitch(this,
            function(response) {
              //console.log("Success: ", response);
              let options = response.parameters;
              let arregloOpcionesPapel = [];
              let arregloOpcionesFormato = [];

              for (var i = 0; i < options.length; i++) {
                if (options[i].name == "Layout_Template") {
                  let choices = options[i].choiceList;
                  let choiceLength = options[i].choiceList.length;
                  for (var j = 0; j < choiceLength; j++) {
                    arregloOpcionesPapel.push({
                      id: j,
                      name: choices[j]
                    });
                  }
                }
              }

              for (var i = 0; i < options.length; i++) {
                if (options[i].name == "Format") {
                  let choices = options[i].choiceList;
                  let choiceLength = options[i].choiceList.length;
                  for (var j = 0; j < choiceLength; j++) {
                    arregloOpcionesFormato.push({
                      id: j,
                      name: choices[j]
                    });
                  }
                }
              }

              let storePapeles = new Memory({
                data: arregloOpcionesPapel
              });

              let storeFormatos = new Memory({
                data: arregloOpcionesFormato
              });

              this.tipoPapel = new FilteringSelect({
                id: "tipoPapel",
                name: "papel",
                value: "0",
                store: storePapeles,
                searchAttr: "name"
              }, "tipoPapel");
              this.tipoPapel.startup();

              this.tipoFormato = new FilteringSelect({
                id: "tipoFormato",
                name: "formato",
                value: "0",
                store: storeFormatos,
                searchAttr: "name"
              }, "tipoFormato");
              this.tipoFormato.startup();

            }),
          function(error) {
            console.log("Error: ", error.message);
          }
        );

      },
      exportMap: function() {
        domStyle.set(this.mask,'display','block');
        domStyle.set(this.btnArchivoResultado,'display','none');
        let papel = this.tipoPapel.item.name;
        let formato = this.tipoFormato.item.name;        
        this.template.format = formato;
        this.template.layout = papel;
        let params = new PrintParameters();
        params.map = this.map;
        params.template = this.template;
        printTask = new PrintTask(this.URLPrintService);
        printTask.execute(params,lang.hitch(this,function(response) {
            this.btnArchivoResultado.href = response.url;
            domStyle.set(this.btnArchivoResultado,'display','block');
            domStyle.set(this.mask,'display','none');
            /* console.log("The printed document is at " + response.url);
            window.open(response.url); */
        }));
      }
    });
  });
