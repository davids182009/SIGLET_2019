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
    "dijit/form/NumberSpinner"
],
    function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,template,
        FilteringSelect,Memory,on,domClass,lang,NumberTextBox,Form,NumberSpinner
        ){

        /**
         * Crea un nuevo LocateCoordinate (Constructor)
         * @class
         * @alias module:LocateCoordinate     
         * @property {String} templateString - Contenido del archivo template.html
         * @property {String} baseClass - valor del atributo class del nodo traido en el template
         * @property {String} id - identificador del widget
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
                /* this.filterSistema.watch('displayedValue',function(property,oldValue,newValue){
                    alert(property + ':'+newValue);
                }); */
            },
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
            drawCoordinate:function(){
                if(this.filtroSistema.get('value')=='A'){
                    if(this.dijitFormA.validate()){
                        console.log(this.dijitFormA.get("value"));
                    }
                }else{
                    if(this.dijitFormB.validate()){
                        console.log(this.dijitFormB.get("value"));
                    }
                }
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