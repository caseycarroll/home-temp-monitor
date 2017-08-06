class ClimateGraph extends HTMLElement {

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
        this._calculateGeometries()
        this._setupGraph()
        this._fetchClimateJSONData()
    }

    _setupGraph() {
        var svgGraph = document.createElementNS("http://www.w3.org/2000/svg", 'svg')
        svgGraph.setAttribute('width', `${this.graph.width}`)
        svgGraph.setAttribute('height', `${this.graph.height}`)

        var gridLineX = document.createElementNS("http://www.w3.org/2000/svg", 'line')
        gridLineX.setAttribute('x1', '32')
        gridLineX.setAttribute('y1', `${this.graph.gridLineY}`)
        gridLineX.setAttribute('x2', `${this.graph.gridLineX}`)
        gridLineX.setAttribute('y2', `${this.graph.gridLineY}`)
        gridLineX.style.stroke = "black"
        svgGraph.appendChild(gridLineX)

        var gridLineY = document.createElementNS("http://www.w3.org/2000/svg", 'line')
        gridLineY.setAttribute('x1', '32')
        gridLineY.setAttribute('y1', '32')
        gridLineY.setAttribute('x2', `32`)
        gridLineY.setAttribute('y2', `${this.graph.gridLineY}`)
        gridLineY.style.stroke = "black"
        svgGraph.appendChild(gridLineY)
        
        this.shadow.appendChild(svgGraph)
    }

    _calculateGeometries() {
        var componentRect = this.getBoundingClientRect()

        this.graph = {
            width: componentRect.width,
            height: componentRect.height,
            gridLineX: (componentRect.width - 32),
            gridLineY: (componentRect.height - 32),
            barSize: (componentRect.width - 72) / 48,
            barFoundationPos: componentRect.height - 32
        }
    }

    _fetchClimateJSONData() {
        let url = "http://192.168.1.8:8080/climatereadings"
        fetch(url).then( response => {
            if (response.status == 200) {
                return response.json()
            } else {
                return Promise.reject(new Error(response.statusText))
            }
        })
        .then(jsonResponse => {
            console.log(jsonResponse)
            this._appendBarsToGraph(jsonResponse)
        })
        .catch(error => {
            console.log(error)
        })
    }

    _appendBarsToGraph(json) {
        var graph = this.shadow.querySelector('svg')
        console.log(this.type)

        for (var key in json.Readings) {
            if (json.Readings.hasOwnProperty(key)) {
                let element = json.Readings[key]
                let bar = document.createElementNS("http://www.w3.org/2000/svg", 'rect')
                
                if (this.type === "temp") {
                    var heightValPercent = (element.temp / 100 - (1 - element.temp / 100))
                    bar.style.fill = "pink"
                } else if (this.type === "humidity") {
                    var heightValPercent = (element.humidity / 100)
                    bar.style.fill = "cyan"
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
                bar.setAttribute('y', `${heightBuffer * (this.graph.barFoundationPos - 32) + 31}`)
                
                graph.appendChild(bar)
            }
        }
    }

}

customElements.define('climate-graph', ClimateGraph)