import css from "css";
import style from "./moveable.css"; // read plain content from css file

export default class moveable {
    constructor(targetElement, options) {
        // store all event handlers the user set
        this.handlers = {};
        // store the target moveable element
        this.targetElement = targetElement;
        // store the options the user set
        this.options = options;

        /* draggable part */
        // flag if the element is dragging
        this.dragging = false;
        // store some drag status value
        this.dragSore = {};
        this.dragInitiate();

        /* resizable part */
        // store some resize status value
        this.resizeStore = {};
        // flag if the element is resizing
        this.resizing = false;
        // store the threshold value for resizable function
        this.resizeThreshold = this.options.threshold || 10;
        // store the activated resizable direction of the target element
        // all valid directions: [s, se, e, ne, n, nw, w, sw]
        this.directions = {};
        this.resizeInitiate();
    }

    /**
     * do some initial thing for draggable function
     * 1. generate drag start and drag event handlers by wrapping this.dragStart and this.drag
     * 2. add mouse down event listener to the target draggable element
     */
    dragInitiate() {
        if (this.options.draggable) {
            this.dragEnd();
            // wrap a drag start event handler
            this.dragStartHandler = function(e) {
                this.dragStart(e);
            }.bind(this);
            // wrap a drag(dragging) event handler
            this.dragHandler = function(e) {
                this.drag(e);
            }.bind(this);
            this.targetElement.addEventListener("mousedown", this.dragStartHandler);
        }
    }

    /**
     * the drag start event handler(mouse down event handler)
     * store some status value of drag start event
     * @param {event} e the mouse down event
     */
    dragStart(e) {
        this.dragging = true;
        // store the start css translate value. [x,y]
        this.dragSore.startTranslate = [];
        // store the start mouse absolute position. [x,y]
        this.dragSore.startMouse = [e.pageX, e.pageY];
        // store the start element absolute position. [x,y]
        this.dragSore.startElement = [
            this.targetElement.getBoundingClientRect().left + document.documentElement.scrollLeft,
            this.targetElement.getBoundingClientRect().top + document.documentElement.scrollTop
        ];

        this.handlers.dragStart &&
            this.handlers.dragStart({
                inputEvent: e,
                set: position => {
                    this.dragSore.startTranslate = position;
                    this.targetElement.style.transform = `translate(${position[0]}px,${position[1]}px)`;
                },
                stop: () => {
                    this.dragging = false;
                },
                clientX: e.clientX,
                clientY: e.clientY,
                pageX: e.pageX,
                pageY: e.pageY
            });
        if (this.dragging) document.documentElement.addEventListener("mousemove", this.dragHandler);
    }

    /**
     * the drag(dragging) event handler(mouse move event handler)
     * calculate the current translate value
     * call the drag event handler given by users
     * @param {event} e the mouse move event
     */
    drag(e) {
        // calculate the current translate value
        let translate = [
            e.pageX - this.dragSore.startMouse[0] + this.dragSore.startTranslate[0],
            e.pageY - this.dragSore.startMouse[1] + this.dragSore.startTranslate[1]
        ];
        this.handlers.drag &&
            this.handlers.drag({
                inputEvent: e,
                target: this.targetElement,
                transform: `translate(${translate[0]}px,${translate[1]}px)`,
                translate: translate
            });
    }

    /**
     * add mouse up event listener
     * remove dragging event
     */
    dragEnd() {
        document.documentElement.addEventListener("mouseup", () => {
            if (this.dragging) {
                this.dragging = false;
                document.documentElement.removeEventListener("mousemove", this.dragHandler);
                if (this.handlers.dragEnd) this.handlers.dragEnd();
            }
        });
    }

    /**
     * do some initial thing for resizable function:
     * 1. generate resize start and resize event handlers by wrapping this.resizeStart and this.resize
     * 2. add resizable div elements to the target element
     * 3. add mouse down event listener to the resizable div element
     */
    resizeInitiate() {
        if (this.options.resizable) {
            this.resizeEnd();
            // wrap a resize start event handler
            this.resizeStartHandler = function(e) {
                this.resizeStart(e);
            }.bind(this);
            // wrap a resize(resizing) event handler
            this.resizeHandler = function(e) {
                this.resize(e);
            }.bind(this);

            // parse the direction parameter given by users
            this.parseDirection();

            let cssObject = cssPreProcess(style);
            /* create a container for resizable div elements */
            let divContainer = document.createElement("div");
            let divContainerID = "resizable-container";
            divContainer.id = divContainerID;
            divContainer.style.cssText = cssObject.stringifyItems(cssObject[`#${divContainerID}`]);
            this.targetElement.appendChild(divContainer);
            /* create resizable div elements according to direction settings */
            for (let direction in this.directions) {
                // css setting of the specific div
                let divCss = cssObject[`#resizable-${direction}`];
                let thresholdCSSValue = `${this.resizeThreshold}px`;
                /* change css setting according to direction */
                switch (direction) {
                    case "s":
                        divCss.height = thresholdCSSValue;
                        break;
                    case "se":
                        divCss.width = thresholdCSSValue;
                        divCss.height = thresholdCSSValue;
                        break;
                    case "e":
                        divCss.width = thresholdCSSValue;
                        break;
                    case "ne":
                        divCss.width = thresholdCSSValue;
                        divCss.height = thresholdCSSValue;
                        break;
                    case "n":
                        divCss.height = thresholdCSSValue;
                        break;
                    case "nw":
                        divCss.width = thresholdCSSValue;
                        divCss.height = thresholdCSSValue;
                        break;
                    case "w":
                        divCss.width = thresholdCSSValue;
                        break;
                    case "sw":
                        divCss.width = thresholdCSSValue;
                        divCss.height = thresholdCSSValue;
                        break;
                }
                /* create resizable div elements and append to the container */
                let div = document.createElement("div");
                div.id = `resizable-${direction}`;
                div.style.cssText = cssObject.stringifyItems(divCss);
                divContainer.appendChild(div);
                divContainer.addEventListener("mousedown", this.resizeStartHandler);
                // store the div resizable element
                this.directions[direction] = div;
            }
        }
    }

    /**
     * parse the direction option in this.options to an array
     * all valid directions: [s, se, e, ne, n, nw, w, sw]
     * support array(e.g.: [s,se]), string(e.g.: "s,se") and object(e.g.: {s:null,se:null}) these types of parameter
     */
    parseDirection() {
        this.directions = {};
        switch (getVarType(this.options.directions)) {
            case "Array":
                for (let d of this.options.directions) this.directions[d] = null;
                break;
            case "string": {
                let arr = this.options.directions.match(/([swne]+)/g);
                for (let i in arr) this.directions[arr[i]] = null;
                break;
            }
            case "Object": {
                this.directions = this.options.directions;
                break;
            }
            case "undefined":
                this.directions = {
                    s: null,
                    se: null,
                    e: null,
                    ne: null,
                    n: null,
                    nw: null,
                    w: null,
                    sw: null
                };
        }
    }

    /**
     * the resize start event handler(mouse down event handler)
     * store some status value of resize start event
     * @param {event} e the mouse down event
     */
    resizeStart(e) {
        this.resizing = true;
        // store the start css translate value. [x,y]
        // this.resizeStore.startTranslate
        // store the start mouse absolute position. [x,y]
        this.resizeStore.startMouse = [e.pageX, e.pageY];
        // store the start element absolute position. [x,y]
        this.resizeStore.startElement = [
            this.targetElement.getBoundingClientRect().left + document.documentElement.scrollLeft,
            this.targetElement.getBoundingClientRect().top + document.documentElement.scrollTop
        ];
        // store the activated resizable div elements
        this.resizeStore.target = e.target;

        /* call the drag start handler written by the user */
        this.handlers.resizeStart &&
            this.handlers.resizeStart({
                // set the start position
                set: position => {
                    this.resizeStore.startTranslate = position;
                    this.targetElement.style.transform = `translate(${position[0]}px,${position[1]}px)`;
                },
                // stop the following drag and dragEnd events
                stop: () => {
                    this.resizing = false;
                },
                clientX: e.clientX,
                clientY: e.clientY,
                pageX: e.pageX,
                pageY: e.pageY
            });
        if (this.resizing)
            document.documentElement.addEventListener("mousemove", this.resizeHandler);
    }

    resize() {
        // TODO
    }

    resizeEnd() {
        // TODO
    }

    /**
     * add an event handler to the movable object
     * @param {String} eventType the name of event type. enum:{dragStart,drag,dragEnd,resizeStart,resize,resizeEnd}
     * @param {function} handler the handler function of the corresponding event type
     */
    on(eventType, handler) {
        this.handlers[eventType] = handler;
        return this;
    }

    /**
     * make the target movable element to do the request movement
     * @param {String} moveableType "draggable": do drag movement. "resizable": do resize movement
     * @param {Object} moveableParameter the specific moveable parameters
     * @returns {boolean} if the request has been executed successfully
     */
    request(moveableType, moveableParameter) {
        switch (moveableType) {
            case "draggable":
                return this.dragRequest(moveableParameter);
            case "resizable":
                return this.resizeRequest(moveableParameter);
            default:
                return false;
        }
    }

    /**
     *	drag the target draggable element to the request position
     * @param {Object} draggableParameter {x:absolute x value,y:absolute y value,deltaX: delta x value, deltaY: delta y value}
     * @returns {boolean} if the drag request has been executed successfully
     */
    dragRequest(draggableParameter) {
        if (!this.options.draggable || !draggableParameter) return false;
        /* calculate the translate value according to parameters */
        let translate;
        if (draggableParameter.x !== undefined && draggableParameter.y !== undefined)
            translate = [draggableParameter.x, draggableParameter.y];
        else if (
            draggableParameter.deltaX !== undefined &&
            draggableParameter.deltaY !== undefined
        ) {
            translate = [
                this.dragSore.startTranslate[0] + draggableParameter.deltaX,
                this.dragSore.startTranslate[1] + draggableParameter.deltaY
            ];
        } else return false;

        /* drag start */
        this.dragging = true;
        // store the start css translate value. [x,y]
        this.dragSore.startTranslate = [];

        this.handlers.dragStart &&
            this.handlers.dragStart({
                set: position => {
                    this.dragSore.startTranslate = position;
                },
                stop: () => {
                    this.dragging = false;
                }
            });

        /* dragging event */
        this.handlers.drag &&
            this.handlers.drag({
                target: this.targetElement,
                transform: `translate(${translate[0]}px,${translate[1]}px)`,
                translate: translate
            });

        /* dragging end */
        this.dragging = false;
        this.handlers.dragEnd && this.handlers.dragEnd();
        return true;
    }

    /**
     * resize the target resizable element to the request size
     * @param {Object} resizeParameter {width: resize to the ${width} value, height: resize to the ${height} value}
     * @returns {boolean} if the resize request has been executed successfully
     */
    resizeRequest(resizeParameter) {
        /* judge resizable condition */
        if (
            !this.options.resizable ||
            !resizeParameter ||
            resizeParameter.width === undefined ||
            resizeParameter.height === undefined
        )
            return false;
        /* start resize */
        // store the start css translate value. [x,y]
        this.resizeStore.startTranslate = [];
        this.handlers.resizeStart &&
            this.handlers.resizeStart({
                set: position => {
                    this.resizeStore.startTranslate = position;
                }
            });

        /* resize the element */
        this.handlers.resize &&
            this.handlers.resize({
                target: this.targetElement,
                width: resizeParameter.width,
                height: resizeParameter.height,
                translate: this.resizeStore.startTranslate
            });
        /* resize end */
        this.handlers.resizeEnd && this.handlers.resizeEnd();
        return true;
    }
}

/**
 * pre precess a css string to an object
 * @param {String} style css style string
 * @returns {Object} {selectorName:{property:value},...,stringifyItems:function,toString:function}
 */
function cssPreProcess(style) {
    let ast = css.parse(style);
    let result = {};
    for (let rule of ast.stylesheet.rules) {
        let item = {};
        let selector = rule.selectors[0];
        for (let declaration of rule.declarations) {
            item[declaration.property] = declaration.value;
        }
        result[selector] = item;
    }
    /**
     * stringify css entries of property and value
     * @param {Object} items {cssProperty: value}
     */
    result.stringifyItems = function(items) {
        let text = "";
        for (let key in items) {
            text += `${key}: ${items[key]};\n`;
        }
        return text;
    };
    result.toString = function() {
        let text = "";
        for (let selector in this) {
            if (typeof this[selector] !== "function")
                text += `${selector}{\n${this.stringifyItems(this[selector])}}\n`;
        }
        return text;
    };
    return result;
}

function getVarType(val) {
    let type = typeof val;
    // object need to be judged by Object.prototype.toString.call
    if (type === "object") {
        let typeStr = Object.prototype.toString.call(val);
        // parse [object String]
        typeStr = typeStr.split(" ")[1];
        type = typeStr.substring(0, typeStr.length - 1);
    }
    return type;
}