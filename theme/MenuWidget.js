/**
 * MenuWidget
 *
 * Dojo AMD (Asynchronous Module Definition )
 * Widget que  gestiona la creacion de un menu mediante el que se
 * crea, organiza y destruye otros widget que proporcionan funcionalidad
 * por demanda.
 * El listado de widgets disponibles se carga del archivo config.json
 *
 * @version 1.0
 * @author Juan Carlos Valderrama Gonzalez<dyehuty@gmail.com>
 * @module theme/MenuWidget
 * @augments dojo/_base/declare
 * @augments dijit/_WidgetBase
 * @augments dijit/_TemplatedMixin
 * @augments dijit/_WidgetsInTemplateMixin
 * @augments dojo/request
 * @augments dojo/_base/lang
 * @augments dojo/dom-construct
 * @augments dojo/_base/array
 * @augments dojo/dom-class
 * @augments dojo/dom
 * @augments dojo/topic
 * @augments ./MenuWidget__Btn/MenuWidget__Btn
 * @augments dojo/text!./template.html
 * @augments dojox/layout/Dock
 * @augments dojo/_base/window
 * @augments dojo/store/Memory
 * @augments dijit/registry
 * @augments dojo/dom-style
 * @augments dojo/on
 * @augments xstyle/css!./style.css
 *
 */



define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/request',
    'dojo/_base/lang',
    'dojo/dom-construct',
    'dojo/_base/array',
    'dojo/dom-class',
    'dojo/dom',
    "dojo/topic",
    './MenuWidget__Btn/MenuWidget__Btn',
    'dojo/text!./template.html',
    'dojox/layout/Dock',
    "dojox/layout/FloatingPane",
    "dojo/dnd/move",
    "dojo/_base/html",
    'dojo/_base/window',
    'dojo/store/Memory',
    "dijit/registry",
    "dojo/dom-style",
    "dojo/on",
    'xstyle/css!./style.css'

], function(declare, _WidgetBase, _TemplatedMixin,
  _WidgetsInTemplateMixin, request, lang,
  domConstruct, array, domClass, dom, Topic,
  MenuWidget__Btn, template, Dock, FloatingPane,
  Move, html, win,
  Memory, registry, domStyle, on) {

  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
    /**
     * @property {string} baseClass - Valor del atributo class que se aplicara al nodo principal en el template
     * @instance
     */
    baseClass: 'MenuWidget',
    /**
     * @property {string} template - Cadena de texto que representa un template HTML cargado del archivo template.html
     * @instance
     */
    templateString: template,
    /**
     * @property {string} id - Identificador del widget
     * @instance
     */
    id: 'MenuWidgetOficina205',
    /**
     * @property {Object} config - Almacena el json del archivo "config.json"
     * @instance
     */
    config: null,
    /**
     * @property {Object} storeWidgets - Objeto tipo dojo/store/Memory que almacena el listado de widgets disponibles para abrir
     * @instance
     */
    storeWidgets: null,
    /**
     * @property {boolean} visibilidadBtn - Bandera que indica si el menu de botones esta visible (desplegado)
     * @instance
     */
    visibilidadBtn: false,
    /**
     * @property {boolean} visibilidadContent - Bandera que indica si el contenedor de widgets desplegados esta visible (desplegado)
     * @instance
     */
    visibilidadContent: false,
    /**
     * @property {boolean} visibilidadListWidget - Bandera que indica si el contenedor agrupador de widgets esta visible
     * @instance
     */
    visibilidadListWidget: false,
    /**
     * @property {Number} widgetTarget - Identificador el widget que esta desplegado y visible en el contenedor de Widgets (Uno a la vez)
     * @instance
     */
    widgetTarget: 0,
    /**
     * @property {array} openedWidgets - Lista de widgets que han sido abiertos
     * @instance
     */
    openedWidgets: [],
    /**
     * Funcion del ciclo de vida del Widget en Dojo, se dispara cuando
     * todas las propiedades del widget son definidas y el fragmento
     * HTML es creado, pero este no ha sido incorporado en el DOM.
     * @memberof module:theme/MenuWidget#
     *
     */
    postCreate: function() {
      this.inherited(arguments);
      //SE CARGA JSON DE CONFIGURACIÓN Y CONSTRUYE MENU
      this._loadWidgetInventory();
    },
    /**
     * Función que carga archivo config.json del cual se extrae el
     * listado de widgets para renderizar, construir el menu y
     * comportamiento reactive
     * @memberof module:theme/MenuWidget#
     *
     */
    _loadWidgetInventory: function() {
      request.post("theme/config.json", {
        handleAs: 'json'
      }).then(lang.hitch(this,
        function(widgetsData) {
          this.config = widgetsData;
          Topic.publish("configMapa", widgetsData.map);
          //CALCULAR ANCHO BOX DE BOTONES
          let listaWidgetSingle = this.config.widgetSingle;
          let listaWidgetGroup = this.config.widgetGroup;
          let ConfiglistaWidget = this.config.widgets;
          let widthBox = 41;
          widthBox = widthBox * (1 + ConfiglistaWidget.length);
          domStyle.set(this.box_btns, 'width', widthBox + 'px');
          //RECORRIDO DE WIDGETS INDIVIDUALES
          let listaWidgets = [];
          array.forEach(ConfiglistaWidget, function(item) {
            if (item.type == 'single') {
              new MenuWidget__Btn({
                id: 'MenuWidget_Btn_' + item.id,
                name: item.name,
                typeClass: 'boxMenu_options_btn boxMenu_options_btn_A',
                icon: item.uri + '/images/' + item.icon,
                tipo: 'A',
                config: item
              }).placeAt(this.list_btn, 'last');
              item['opened'] = false;
              listaWidgets.push(item);
            } else { //Group
              new MenuWidget__Btn({
                name: item.name,
                typeClass: 'boxMenu_options_btn boxMenu_options_btn_A',
                icon: 'theme/images/' + item.icon,
                childWidgets: item.widgets,
                tipo: 'B'
              }).placeAt(this.list_btn, 'last');
              let widgetsOnGroup = item.widgets;
              for (let i = 0; i < widgetsOnGroup.length; i++) {
                widgetsOnGroup[i]['opened'] = false;
                listaWidgets.push(widgetsOnGroup[i]);
              }
            }
          }, this);
          //CONSTRUCCION DE STORE CON INFORMACIÓN DE LOS WIDGETS DISPONIBLES
          this.storeWidgets = new Memory({
            data: listaWidgets
          });
          //ABRIR WIDGETS POR DEFECTO
          array.forEach(this.storeWidgets.query({
            openOnLoad: true
          }), function(item) {
            this._openWidget(item.id);
          }, this);
        }));
    },
    /**
     * Cierra contenedor que agrupa widgets
     * @memberof module:theme/MenuWidget#
     * @param {object} event - Objeto evento click
     */
    CloseListWidget: function(event) {
      domClass.add(this.box_content_menu, 'hide_left');
      this.visibilidadListWidget = false;
    },
    /**
     * Abre contenedor que agrupa widgets
     * @memberof module:theme/MenuWidget#
     *
     */
    openListWidget: function() {
      domClass.remove(this.box_content_menu, 'hide_left');
      this.visibilidadListWidget = true;
      if (this.visibilidadContent)
        this.hideContent(null);
    },
    /**
     * Construye lista de widgets de una arupación
     * @memberof module:theme/MenuWidget#
     * @param {array} list - Listado de objetos con parametros de widgets
     * @param {String} namne - Nombre del grupo
     */
    poblarListWidget: function(list, name) {
      let widgetPrevios = registry.findWidgets(this.Menu_deploy);
      for (let i = 0; i < widgetPrevios.length; i++) {
        widgetPrevios[i].destroy();
      }
      this.Menu_deploy.innerHTML = '';
      //VALIDAR QUE AREA DE VISUALIZACION ESTE DISPONIBLE
      if (!this.visibilidadListWidget)
        this.openListWidget();
      this.box_content_menu_title.innerHTML = name;
      //CREAR LOS BOTONES HIJO
      array.forEach(list, function(item) {
        new MenuWidget__Btn({
          id: 'MenuWidget_Btn_' + item.id,
          name: item.name,
          typeClass: 'boxMenu_options_btn--list',
          icon: item.uri + '/images/' + item.icon,
          childWidgets: item.widgets,
          tipo: 'C',
          config: item
        }).placeAt(this.Menu_deploy, 'last');
      }, this);
    },
    /**
     * Muestra o oculta menu
     * @memberof module:theme/MenuWidget#
     * @param {object} event - Objeto del evento click
     */
    cambiarVisibilidadBtn: function(event) {
      if (this.visibilidadBtn) { //LOS BOTONES SON VISIBLES
        this.visibilidadBtn = false;
        domClass.add(this.list_btn, 'hide_top');
        domClass.replace(this.btn_menu, 'btn_options_close_animated',
          'btn_options_close');
        setTimeout(function(nodo) {
          domClass.replace(nodo, 'btn_options_open',
            'btn_options_close_animated');
        }, 400, this.btn_menu);
      } else { //LOS BOTONES NO ESTAN VISIBLES
        this.visibilidadBtn = true;
        domClass.remove(this.list_btn, 'hide_top');
        domClass.replace(this.btn_menu, 'btn_options_open_animated',
          'btn_options_open');
        setTimeout(function(nodo) {
          domClass.replace(nodo, 'btn_options_close',
            'btn_options_open_animated');
        }, 400, this.btn_menu);
      }
    },
    /**
     * Muestra o oculta menu
     * @memberof module:theme/MenuWidget#
     * @param {object} event - Objeto del evento click
     */
    _openWidget: function(id) {
      let MenuWidget = this;
      var configWidget_Btn = this.storeWidgets.get(id);
      if (!configWidget_Btn.opened) {
        configWidget_Btn.opened = true;
        switch (configWidget_Btn.display) {
          case 'leftColumn':
            //CREAR ICONO LATERAL QUE INDICA QUE ESTA ABIERTO
            MenuWidget.addIconWidget(configWidget_Btn);
            if (!MenuWidget.visibilidadContent)
              MenuWidget.openContent();
            //CREAR NODO EN DOM QUE CONTIENE WIDGET
            let nodeCustomWidget = domConstruct.toDom(
              '<div id="widget_box_' + configWidget_Btn.id +
              '" class="widget_content"></div>');
            nodeCustomWidget.innerHTML =
              '<img src="images/loading-1.gif" class="loading_Widget">'
            domConstruct.place(nodeCustomWidget, MenuWidget.widget_deploy,
              'last');
            require([
                  configWidget_Btn.uri + '/widget',
                  'xstyle/css!./' + configWidget_Btn.uri + '/css/style.css'
              ], function(customWidget) {
              //CREAR WIDGET E INSERTAR A NODO CONTENEDOR
              let cw = new customWidget({
                id: 'customWidget_' + configWidget_Btn.id,
                configWidget: configWidget_Btn
              });
              nodeCustomWidget.innerHTML = '';
              cw.placeAt(nodeCustomWidget, 'last');
              cw.startup();
              console.log('[CREATE] - widget ' + configWidget_Btn
                .id + ' fue creado');
            });
            break;
          case 'floatingWindow':
            require([
              configWidget_Btn.uri + '/widget',
              'xstyle/css!./' + configWidget_Btn.uri + '/css/style.css'
            ], function(customWidget) {
              //CREAR WIDGET E INSERTAR A NODO CONTENEDOR
              let cw = new customWidget({
                id: 'customWidget_' + configWidget_Btn.id,
                configWidget: configWidget_Btn
              });
              let widgetDock = registry.byId('dock');
              if (widgetDock == undefined)
                widgetDock = new Dock({
                  id: 'dock',
                  style: 'position:absolute; bottom:0; right:0; height:0px; width:0px; display:none; z-index:0;' //tuck the dock into the the bottom-right corner of the app
                }, domConstruct.create('div', null, win.body()));
              let fixFloatingPane = declare(FloatingPane, {
                postCreate: function() {
                  this.inherited(arguments);
                  this.moveable = Move.constrainedMoveable(
                      this.domNode, {
                        handle: this.focusNode,
                        constraints: function() {
                          var coordsBody = html.coords(
                            dojo.body());
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
                      }),
                    this.configWidget = configWidget_Btn,
                    this.close = function() {
                      console.log('Cerrando!!');
                      let mw = registry.byId(
                        'MenuWidgetOficina205');
                      if (mw.widgetTarget == this.configWidget
                        .id)
                        mw.widgetTarget = 0;
                      mw.destroyWidget(this.configWidget.id);
                      this.destroy();
                    }
                }
              });
              let positionTop = 100;
              let positionLeft = 300;
              if (configWidget_Btn.top != undefined)
                positionLeft = configWidget_Btn.top;
              if (configWidget_Btn.left != undefined)
                positionLeft = configWidget_Btn.left;
              let floatingPane = new fixFloatingPane({
                id: configWidget_Btn.id + '_FP_general',
                title: configWidget_Btn.name,
                minSize: 300,
                class: 'FP_general',
                //href: 'html/options.html',
                //preload: true, //if you want to load content on app load set preload to true
                resizable: true, //allow resizing
                closable: true, //we never want to close a floating pane - this method destroys the dijit
                dockable: false, // yes we want to dock it
                dockTo: widgetDock, //if you create the floating pane outside of the same function as the dock, you'll need to set as dijit.byId('dock')
                style: 'position:absolute;top:' + positionTop +
                  'px;left:' + positionLeft +
                  'px;width:500px;height:300px;z-index:999 !important',
                content: cw
                  //you must set position:absolute; and provide a top and left value (right and bottom DO NOT WORK and will cause the floating pane to appear in strange places depending on browser, for example 125684 pixels right)
                  //Why top and left? The position of a floating pane is a relationship between the top-left corner of dojo.window and the top-left corner of the dijit
                  //you must also set a height and width
                  //z-index is mainly irrelavant as the dijit will control its own z-index, but I always set it to 999 !important to avoid the occasional and mysterious problem of the title and content panes of the floating pane appearing at different z-indexes
              }, domConstruct.create('div', null, win.body()));
              floatingPane.startup();
              cw.startup();
              console.log('[CREATE] - widget ' + configWidget_Btn
                .id + ' fue creado');
            });
            break;
        }
      } else {
        console.warn('[WARN] - El Widget con id:' + this.id +
          ' ya ha sido creado');
        switch (configWidget_Btn.display) {
          case 'leftColumn':
            MenuWidget.openContent();
            MenuWidget.changeWidget(configWidget_Btn);
            break;
          case 'floatingWindow':
            alert('Floating Window! Again');
            break;
        }


      }
    },
    /**
     * Oculta contenedor de widgets desplegados
     * @memberof module:theme/MenuWidget#
     * @param {object} event - Objeto del evento clic
     */
    hideContent: function(event) {
      domClass.add(this.box_content_widget, 'hide_left');
      this.visibilidadContent = false;
    },
    /**
     * Muestra contenedor de widgets desplegados
     * @memberof module:theme/MenuWidget#
     */
    openContent: function() {
      if (!this.visibilidadContent) {
        domClass.remove(this.box_content_widget, 'hide_left');
        this.visibilidadContent = true;
        if (this.visibilidadListWidget)
          this.CloseListWidget(null);
      }
    },
    /**
     * Responde a cierre de widget con display = leftColumn
     * @memberof module:theme/MenuWidget#
     * @param {object} event - Objeto del evento clic
     */
    closeWidget: function(event) {
      this.destroyWidget(this.widgetTarget);
      this.widgetTarget = 0;
      this.hideContent(null);
    },
    /**
     * Destruye icono, contenedor y widget que este actualmente visible
     * @memberof module:theme/MenuWidget#
     * @param {object} event - Objeto del evento clic
     */
    destroyWidget: function(idWidget) {
      let iconWidget = dom.byId('widget_icon_' + idWidget);
      let widget = registry.byId('customWidget_' + idWidget);
      let indexOpenedWidgets = -1;
      var configWidget = this.storeWidgets.get(idWidget);
      //Eliminar de variables de control global Widget
      indexOpenedWidgets = this.openedWidgets.indexOf(idWidget);
      if (indexOpenedWidgets > -1)
        this.openedWidgets.splice(indexOpenedWidgets, 1);
      configWidget.opened = false;
      //Animación y destruccion
      switch (configWidget.display) {
        case 'leftColumn':
          on(iconWidget, 'animationend', function(event) {
            console.log('widget Destruido');
            if (typeof widget.onDestroy === "function")
              widget.onDestroy();
            widget.destroy();
            domConstruct.destroy('widget_icon_' + idWidget);
            if (configWidget.display == 'leftColumn')
              domConstruct.destroy('widget_box_' + idWidget);
          });
          domClass.add(iconWidget, 'destroying');
          break;
        case 'floatingWindow':
          console.log('widget Destruido');
          widget.destroy();
          break;
      }

    },
    /**
     * Crea un icono en dock lateral que indica que el widget ha sido desplegado
     * mediante este se puede acceder al widget en caso que este oculto
     * @memberof module:theme/MenuWidget#
     * @param {object} item - Objeto con parametros de un widget
     */
    addIconWidget: function(item) {
      if (this.widgetTarget != 0) {
        let targetActual = dom.byId('widget_icon_' + this.widgetTarget);
        domClass.remove(targetActual, 'selected');
      }
      let iconoLateral = domConstruct.toDom(
        '<li class="selected" id="widget_icon_' + item.id +
        '" title="' + item.name + '" ><img src="' + item.uri +
        '/images/' + item.icon + '"></li>');
      domConstruct.place(iconoLateral, this.dock_widgets, 'last');
      this.openedWidgets.push(item.id);
      switch (item.display) {
        case 'leftColumn':
          on(iconoLateral, 'click', lang.hitch(this, this.handleChangeWidget(
            item)));
          this.changeWidget(item);
          break;
        case 'floatingWindow':

          break;
      }

    },
    /**
     * Maneja el evento click del dock lateral para visualizar un widget desplegado
     * @memberof module:theme/MenuWidget#
     * @param {object} item - Objeto con parametros de un widget
     */
    handleChangeWidget: function(item) {
      return function(event) {
        this.openContent();
        this.changeWidget(item);
      }
    },
    /**
     * Hace visible el widget indicado en el objeto de entrada item
     * @memberof module:theme/MenuWidget#
     * @param {object} item - Objeto con parametros de un widget
     */
    changeWidget: function(item) {
      let id = item.id;
      let focusWidget = null;
      if (id != this.widgetTarget) {
        if (this.widgetTarget == 0) //FIRST TIME
          this.widgetTarget = id;
        let pos = -1;
        for (let i = 0; i < this.openedWidgets.length; i++) {
          if (this.openedWidgets[i] == id) {
            pos = i;
            break;
          }
        }
        focusWidget = this.storeWidgets.get(id);
        if (focusWidget.closable != undefined && !focusWidget.closable)
          domStyle.set(this.closeIconWidget, 'display', 'none');
        else
          domStyle.set(this.closeIconWidget, 'display', 'block');

        let targetActual = dom.byId('widget_icon_' + this.widgetTarget);
        domClass.remove(targetActual, 'selected');
        let height = domStyle.get(widget_deploy, 'height');
        pos = -height * pos;
        domStyle.set(this.widget_louver, 'margin-top', '' + pos +
          'px');
        this.widgetTarget = id;
        let targetNuevo = dom.byId('widget_icon_' + id);
        domClass.add(targetNuevo, 'selected');
        this.widget_title.innerHTML = item.name;
        this.widget_title.title = item.name;
      }
    }
  });
});
