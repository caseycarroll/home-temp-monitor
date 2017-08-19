class ClimateGraph extends HTMLElement {

    /**
     * 'type' is set in html to determine whether the graph should 
     * display temperature data or humidity data.
     */
    static get observedAttributes() {return ['type']}

    attributeChangedCallback(attr, oldValue, newValue) {
        this.type = newValue
    }

    constructor() {
        super()
        //set up shadow root
        this.shadow = this.attachShadow({mode: 'open'})
        console.log("o hai i'm alive!")
    }

    connectedCallback() {
        if (this._calculateGeometries()) { //is successful
            console.log("created event listener")
            this.addEventListener('fetch-complete', this._appendBarsToGraph)
            this._setupGraph()
        }
    }

    /**
     * Creates an SVG element with a Y and X axis to mimic a graph
     */
    _setupGraph() {
        //create parent SVG element
        var svgGraph = document.createElementNS("http://www.w3.org/2000/svg", 'svg')
        svgGraph.setAttribute('width', `${this.graph.width}`)
        svgGraph.setAttribute('height', `${this.graph.height}`)

        //create X axis
        var gridLineX = document.createElementNS("http://www.w3.org/2000/svg", 'line')
        gridLineX.setAttribute('x1', '32')
        gridLineX.setAttribute('y1', `${this.graph.gridLineY}`)
        gridLineX.setAttribute('x2', `${this.graph.gridLineX}`)
        gridLineX.setAttribute('y2', `${this.graph.gridLineY}`)
        gridLineX.style.stroke = "black"
        svgGraph.appendChild(gridLineX)

        //create Y axis
        var gridLineY = document.createElementNS("http://www.w3.org/2000/svg", 'line')
        gridLineY.setAttribute('x1', '32')
        gridLineY.setAttribute('y1', '32')
        gridLineY.setAttribute('x2', `32`)
        gridLineY.setAttribute('y2', `${this.graph.gridLineY}`)
        gridLineY.style.stroke = "black"
        svgGraph.appendChild(gridLineY)

        //add Y axis labels
        for(let i = 0; i < 11; i++) {
            let labelLine = document.createElementNS("http://www.w3.org/2000/svg", 'line')
            let labelText = document.createElementNS("http://www.w3.org/2000/svg", "text")
            if(this.type === "temp") {
                labelText.innerHTML = (i * 5 + 50).toString()
            } else { //humidity
                labelText.innerHTML = (i * 10).toString()
            }
            let linePosY = this.graph.gridLineY - ((this.graph.gridLineY - 32) * (i / 10))
            labelText.setAttribute('x', '28')
            labelText.setAttribute('y', `${linePosY}`)
            labelText.style.textAnchor = "end"
            labelText.style.fontSize = "10px"
            labelText.style.opacity = "0.75"
            labelLine.setAttribute('x1', '32')
            labelLine.setAttribute('y1', `${linePosY}`)
            labelLine.setAttribute('x2', `${this.graph.gridLineX}`)
            labelLine.setAttribute('y2', `${linePosY}`)
            labelLine.style.stroke = "gray"
            svgGraph.appendChild(labelText)
            svgGraph.appendChild(labelLine)
        }

        this.shadow.appendChild(svgGraph)
    }

    /**
     * Gets the size of the custom component and defines geometries for various 
     * parts of the graph. 
     * Allows for easier access of measurements across the web component
     */
    _calculateGeometries() {
        var componentRect = this.getBoundingClientRect()
        if ( componentRect.width == 0 || componentRect.height == 0) {
            console.log('Component not properly sized')
            return false
        }
        this.graph = {
            width: componentRect.width,
            height: componentRect.height,
            gridLineX: (componentRect.width - 32),
            gridLineY: (componentRect.height - 32),
            barSize: (componentRect.width - 64) / 49,
            barFoundationPos: componentRect.height - 32
        }
        return true
    }

    /**
     * Creates svg rect objects that reflect the measurements returned by the API call 
     * and appends them to the svg graph.
     * @param {*the json object returned by fetch in _fetchClimateJSONData()} json 
     */
    _appendBarsToGraph(e) {
        var json = e.detail
        var graph = this.shadow.querySelector('svg')

        for (var key in json.Readings) {
            if (json.Readings.hasOwnProperty(key)) {
                let element = json.Readings[key]
                let bar = document.createElementNS("http://www.w3.org/2000/svg", 'rect')
                
                if (this.type === "temp") {
                    //temp graph will be from 50 degrees to 100, so we need to do some extra adjustments
                    var heightValPercent = (element.temp / 100 - (1 - (element.temp / 100)))
                    bar.style.fill = "rgba(255, 183, 196, 0.68)"
                    //bar.style.stroke = "rgba(255, 183, 196, 0.68)"
                } else if (this.type === "humidity") {
                    var heightValPercent = (element.humidity / 100)
                    bar.style.fill = "rgba(54, 255, 233, 0.63)"
                    //bar.style.stroke = "rgba(54, 255, 233, 0.63)"
                } else {
                    console.log("error: could not read type attribute")
                    return
                }

                //create a buffer so that bars can appear rightside up
                let heightBuffer = 1 - heightValPercent
                let barHeight = (this.graph.barFoundationPos - 32) * heightValPercent
                
                bar.setAttribute('width', `${this.graph.barSize}`)
                bar.setAttribute('height', `${barHeight}`)

                bar.setAttribute('x', `${this.graph.barSize * key + 33}`)
                bar.setAttribute('y', `${heightBuffer * (this.graph.barFoundationPos - 32) + 32}`)
                
                graph.appendChild(bar)
            }
        }
    }

}

customElements.define('climate-graph', ClimateGraph)