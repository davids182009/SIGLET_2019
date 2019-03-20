/**
 * Prueba para DAVID
* Dojo AMD (Asynchronous Module Definition ) 
* Widget que representa la funcionalidad para agregar URL o archivos externos al mapa
* @version 1.0
* @author Juan Carlos Valderrama Gonzalez<dyehuty@gmail.com>
* History
* 
*/

/**
 * Descripción Widget
 * @module LocateCoordinate 
 */

define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",    
    "dojo/text!./template.html",
    "dijit/form/FilteringSelect",
    "dojo/store/Memory",
    "dojo/on",
    "dojo/dom-class",
    "dojo/_base/lang",
    "dijit/form/NumberTextBox",
    "dijit/form/Form",
    "dijit/form/NumberSpinner",
    "esri/geometry/Point",
    "esri/graphic",
    "esri/symbols/Symbol",
    "dijit/registry",
    "esri/symbols/PictureMarkerSymbol",
    "libs/proj4js/lib/proj4js-combined"
],
    function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,template,
        FilteringSelect,Memory,on,domClass,lang,NumberTextBox,Form,NumberSpinner,Point,
        Graphic,Symbol,registry,PictureMarkerSymbol
        ){

        /**
         * Crea un nuevo LocateCoordinate (Constructor)
         * @class
         * @alias module:LocateCoordinate     
         * @property {String} templateString - Contenido del archivo template.html
         * @property {String} baseClass - valor del atributo class del nodo traido en el template
         * @property {String} id - identificador del widget
         * @property {String} filtroSistema - select en el DOM que lista sistemas de coordenadas (3116 y 4686)
         * @property {String} formularioSistemaA - elemento en el DOM que contiene formulario para un sistema de coordenadas 3116
         * @property {String} formularioSistemaB - elemento en el DOM que contiene formulario para un sistema de coordenadas 4686
         * @property {String} dijitFormA - Formulario en DOM para EPGS: 3116
         * @property {String} dijitFormB - Formulario en DOM para EPGS: 4686
         * @property {String} map - Objeto mapa de ESRI
         * @property {String} symbol - Objeto de ESRI que define la simbologia para aplicar a un objeto punto
         * 
         */
        return declare("LocateCoordinate", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

            templateString: template,
            baseClass: "widget-LocateCoordinate",
            id: '',
            filtroSistema:null,    
            formularioSistemaA:null,
            formularioSistemaB:null,
            dijitFormA:null,
            dijitFormB:null,
            map:null,
            symbol:null,
            /**
             * Funcion del ciclo de vida del Widget en Dojo, se dispara cuando
             * todas las propiedades del widget son definidas y el fragmento
             * HTML es creado, pero este no ha sido incorporado en el DOM.
             * 
             * @function         
             */
            postCreate: function () {
                this.inherited(arguments);
                
            },
            /**
            * Funcion del ciclo de vida del Widget en Dojo,se dispara despues
            * del postCreate, cuando el nodo ya esta insertado en el DOM.  
            * 
            * @function
            */
            startup: function () {
                this.inherited(arguments);
                let sistemasReferencia = new Memory({
                    data:[
                        {name:"EPSG:3116",id:'A'},
                        {name:"EPSG:4686",id:'B'}
                    ]
                });
                this.filtroSistema = new FilteringSelect({
                    id:'coordinate_sistema',
                    name:'coordinate_sistema',
                    value:'A',
                    store: sistemasReferencia,
                    searchAttr:'name'
                },"coordinate_sistema");
                this.filtroSistema.startup();
                on(this.filtroSistema,'change',lang.hitch(this,this.changeForm));            
                this.map = registry.byId('EsriMap').map;
                this.symbol = new PictureMarkerSymbol({"angle":0,"xoffset":2,"yoffset":8,"type":"esriPMS","url":"http://static.arcgis.com/images/Symbols/Basic/BlueShinyPin.png","imageData":"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","contentType":"image/png","width":24,"height":24});
            },
            /**
            * Responde al evento sobre cambios en objeto select con sistemas de coordenadas,
            * dependiendo el sistema muestra un formulario.
            * 
            * @function
            */
            changeForm:function(event){
                console.log(event);
                if(event =='A'){
                    domClass.add(this.formularioSistemaB,"hide");
                    domClass.remove(this.formularioSistemaA,"hide");
                }else{
                    domClass.add(this.formularioSistemaA,"hide");
                    domClass.remove(this.formularioSistemaB,"hide");
                }
            },
            /**
            * Extrae valores del formulario y dependiendo del sistema tranforma a 
            * coordenadas geograficas decimal para dibujar el punto en el mapa 
            * 
            * @function
            */
            drawCoordinate:function(){
                let coordinates = null;
                let esriPoint = null;
                if(this.filtroSistema.get('value')=='A'){//EPSG:3116
                    if(this.dijitFormA.validate()){
                        coordinates = this.dijitFormA.get("value");
                        let fuente = new Proj4js.Proj('EPSG:3116');
                        let destino = new Proj4js.Proj('EPSG:4686');
                        let punto = new Proj4js.Point( coordinates.X, coordinates.Y);
                        let newPoint = Proj4js.transform(fuente, destino, punto);
                        esriPoint = new Point(newPoint.x,newPoint.y);
                    }
                }else{
                    if(this.dijitFormB.validate()){//EPSG:4686
                        coordinates = this.dijitFormB.get("value");
                        let decCoordinates = this.dms2dec(coordinates);
                        esriPoint = new Point(decCoordinates.longitude,decCoordinates.latitude);
                    }
                }
                this.map.graphics.add(new Graphic(esriPoint,this.symbol));
            }, 
            /**
            * Transforma coordenadas geograficas de Grados, minutos y segundos a 
            * notacion decimal
            * 
            * @function
            */  
            dms2dec:function(coordinates){
                let decCoordinates = {
                    latitude:0,
                    longitude:0
                };
                decCoordinates.latitude = coordinates.latGrados + (coordinates.latMinutos / 60) + (coordinates.latSegundos / 3600);
                decCoordinates.longitude =  coordinates.lonGrados + (coordinates.lonMinutos / 60) + (coordinates.lonSegundos / 3600);
                if(coordinates.latitudOrigen =="S")
                    decCoordinates.latitude=decCoordinates.latitude * -1;
                if(coordinates.longitudOrigen == "W")
                    decCoordinates.longitude = decCoordinates.longitude * -1;
                return decCoordinates;
            }, 
            /**
            * Limpia el layer graphic del objeto mapa
            * 
            * @function
            */   
            clearCoordinate:function(event){
                this.map.graphics.clear();
            },
            /**
            * Codigo a ejecutar antes de destruir el widget  
            * 
            * @function
            */
            onDestroy:function(){
                
            }             
        });
    });