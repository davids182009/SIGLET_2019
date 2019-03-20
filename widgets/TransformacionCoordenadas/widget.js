/**
 * Dojo AMD (Asynchronous Module Definition )
 * Widget que representa la funcionalidad para agregar URL o archivos externos al mapa
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
    "dojo/dom",
],
  function(declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
    template,
    FilteringSelect, Memory, on, domClass, lang, NumberTextBox, Form,
    NumberSpinner, dom
  ) {

    /**
     * Crea un nuevo LocateCoordinate (Constructor)
     * @class
     * @alias module:LocateCoordinate
     * @property {String} templateString - Contenido del archivo template.html
     * @property {String} baseClass - valor del atributo class del nodo traido en el template
     * @property {String} id - identificador del widget
     *
     */
    return declare("LocateCoordinate", [_WidgetBase, _TemplatedMixin,
      _WidgetsInTemplateMixin], {

      templateString: template,
      baseClass: "widget-LocateCoordinate",
      id: '',
      filtroSistema: null,
      formularioSistemaA: null,
      formularioSistemaB: null,
      dijitFormA: null,
      dijitFormB: null,
      /**
       * Funcion del ciclo de vida del Widget en Dojo, se dispara cuando
       * todas las propiedades del widget son definidas y el fragmento
       * HTML es creado, pero este no ha sido incorporado en el DOM.
       *
       * @function
       */
      postCreate: function() {
        this.inherited(arguments);

      },
      /**
       * Funcion del ciclo de vida del Widget en Dojo,se dispara despues
       * del postCreate, cuando el nodo ya esta insertado en el DOM.
       *
       * @function
       */
      startup: function() {
        this.inherited(arguments);
        let sistemasReferencia = new Memory({
          data: [
            {
              name: "EPSG:3116",
              id: 'A'
            },
            {
              name: "EPSG:4686",
              id: 'B'
            }
                    ]
        });
        this.filtroSistema = new FilteringSelect({
          id: 'coordinate_sistemaTrans',
          name: 'coordinate_sistemaTrans',
          value: 'A',
          store: sistemasReferencia,
          searchAttr: 'name'
        }, "coordinate_sistemaTrans");
        this.filtroSistema.startup();
        on(this.filtroSistema, 'change', lang.hitch(this, this.changeForm));
        /* this.filterSistema.watch('displayedValue',function(property,oldValue,newValue){
            alert(property + ':'+newValue);
        }); */
      },
      changeForm: function(event) {
        console.log(event);
        if (event == 'A') {
          domClass.add(this.formularioSistemaB, "hide");
          domClass.remove(this.formularioSistemaA, "hide");
        } else {
          domClass.add(this.formularioSistemaA, "hide");
          domClass.remove(this.formularioSistemaB, "hide");
        }
      },
      convertirCoordenada: function() {
        if (this.filtroSistema.get('value') == 'A') {
          if (this.dijitFormA.validate()) {
            console.log(this.dijitFormA.get("value"));
            let objForm = this.dijitFormA.get("value");
            console.log(objForm.X);
            console.log(objForm.Y);
            //////////////////////
            let fuente = new Proj4js.Proj('EPSG:3116');
            let destino = new Proj4js.Proj('EPSG:4686');
            let punto = new Proj4js.Point(objForm.X, objForm.Y);
            let proyectado = Proj4js.transform(fuente, destino, punto);

            this.lblConverTitulo.innerHTML =
              "<b>EPSG 4686:</b> </br>";
            this.lblConverLat.innerHTML = "Latitud:" + " " + this.degToDMS(
              proyectado.y, 'LAT' + "</br>");
            this.lblConverLon.innerHTML = "Longitud:" + " " + this.degToDMS(
              proyectado.x, 'LON' + "</br>");

            // console.log(label);
            // this.x_a.innerHTML = this.degToDMS(punto.y,'LAT');
            // this.y_a.innerHTML = this.degToDMS(punto.x,'LON');
            // destino = new Proj4js.Proj('EPSG:3116');
            // let puntoPlanas = new Proj4js.Point( mp.x, mp.y);
            // Proj4js.transform(fuente, destino, puntoPlanas);
            // this.x_b.innerHTML = puntoPlanas.x.toFixed(2);
            // this.y_b.innerHTML = puntoPlanas.y.toFixed(2);
            //////////////////////
          }
        } else {
          if (this.dijitFormB.validate()) {
            console.log(this.dijitFormB.get("value"));

            let objForm = this.dijitFormB.get("value");
            let fuente = new Proj4js.Proj('EPSG:4686');
            let destino = new Proj4js.Proj('EPSG:3116');
            let latDec = this.convertDMSToDD(objForm.latGradosTrans,
              objForm
              .latMinutosTrans, objForm.latSegundosTrans, objForm.latitudOrigenTrans
            );
            let lonDec = this.convertDMSToDD(objForm.lonGradosTrans,
              objForm
              .lonMinutosTrans, objForm.lonSegundosTrans, objForm.longitudOrigenTrans
            );
            let punto = new Proj4js.Point(lonDec, latDec);
            let proyectado = Proj4js.transform(fuente, destino, punto);

            this.lblConverTitulo.innerHTML =
              "<b>EPSG 3116:</b> </br>";
            this.lblConverLat.innerHTML = "X:" + " " + proyectado.y.toFixed(
              2);
            this.lblConverLon.innerHTML = "Y:" + " " + proyectado.x.toFixed(
              2);
          }
        }
      },
      /**
       * Codigo a ejecutar antes de destruir el widget
       *
       * @function
       */
      onDestroy: function() {

      },
      degToDMS: function(decDeg, decDir) {
        /** @type {number} */
        var d = Math.abs(decDeg);
        /** @type {number} */
        var deg = Math.floor(d);
        d = d - deg;
        /** @type {number} */
        var min = Math.floor(d * 60);
        /** @type {number} */
        var sec = Math.floor((d - min / 60) * 60 * 60);
        if (sec === 60) { // can happen due to rounding above
          min++;
          sec = 0;
        }
        if (min === 60) { // can happen due to rounding above
          deg++;
          min = 0;
        }
        /** @type {string} */
        var min_string = min < 10 ? "0" + min : min;
        /** @type {string} */
        var sec_string = sec < 10 ? "0" + sec : sec;
        /** @type {string} */
        var dir = (decDir === 'LAT') ? (decDeg < 0 ? "S" : "N") : (
          decDeg < 0 ? "W" : "E");

        return (decDir === 'LAT') ?
          deg + "&deg;" + min_string + "&prime;" + sec_string +
          "&Prime;" + dir :
          deg + "&deg;" + min_string + "&prime;" + sec_string +
          "&Prime;" + dir;
      },
      convertDMSToDD: function(degrees, minutes, seconds, direction) {
        var dd = degrees + minutes / 60 + seconds / (60 * 60);

        if (direction == "S" || direction == "W") {
          dd = dd * -1;
        } // Don't do anything for N or E

        return dd;
      }
    });

  });



/******
latGrados: 4
latMinutos: 5
latSegundos: 59
latitudOrigen: "N"
lonGrados: 4
lonMinutos: 2
lonSegundos: 30
longitudOrigen: "E"
******/


/*****
*function ParseDMS(input) {
    var parts = input.split(/[^\d\w]+/);
    var lat = ConvertDMSToDD(parts[0], parts[1], parts[2], parts[3]);
    var lng = ConvertDMSToDD(parts[4], parts[5], parts[6], parts[7]);
}

The following will convert your DMS to DD

function ConvertDMSToDD(degrees, minutes, seconds, direction) {
    var dd = degrees + minutes/60 + seconds/(60*60);

    if (direction == "S" || direction == "W") {
        dd = dd * -1;
    } // Don't do anything for N or E
    return dd;
}

So your input would produce the following:

36°57'9" N  = 36.9525000
110°4'21" W = -110.0725000
*
*
*
*
*/
