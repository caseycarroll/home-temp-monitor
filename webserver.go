package main

import (
	"database/sql"
	"encoding/json"
	"html/template"

	"fmt"

	"net/http"

	"path/filepath"

	_ "github.com/go-sql-driver/mysql"
)

type ClimateReading struct {
	Temp     float32 `json:"temp"`
	Humidity float32 `json:"humidity"`
	Time     int     `json: "time"`
	Mood     string  `json: "mood"`
}

type AllData struct {
	Readings      []ClimateReading
	LatestReading ClimateReading
}

var (
	dataList AllData
	mysqlDB  *sql.DB
)

const GraphSize = 400

func initMySQL() {
	//open mysql server
	var errDB error
	mysqlDB, errDB = sql.Open("mysql", "root:batmansql@/house_climate")
	checkError(errDB)
}

func refreshList() {
	var entry ClimateReading
	//initialize data list properly
	dataList = AllData{Readings: make([]ClimateReading, 0)}
	//query database for all temp and humidity stores
	results, err := mysqlDB.Query("SELECT Humidity, Temp, Time FROM climateData")

	//iterate through results and store into dataList
	for results.Next() {

		err = results.Scan(&entry.Humidity, &entry.Temp, &entry.Time)
		checkError(err)
		//determine which emoji to display
		determineMood(&entry)
		dataList.Readings = append(dataList.Readings, entry)
	}

	//last read entry is the latest climate reading
	dataList.LatestReading = entry
}

//determines which emoji should be displayed to represent how monad might feel
func determineMood(currConditions *ClimateReading) {
	if currConditions.Temp > 83 {
		currConditions.Mood = "😿"
	}
	if currConditions.Temp > 76 && currConditions.Temp < 83 {
		currConditions.Mood = "😾"
	}
	if currConditions.Temp > 65 && currConditions.Temp < 76 {
		currConditions.Mood = "😻"
	}

	if currConditions.Humidity > 60 && currConditions.Humidity < 70 {
		currConditions.Mood = "😾"
	}
	if currConditions.Humidity > 70 {
		currConditions.Mood = "😿"
	}
}

func serveTemplate(w http.ResponseWriter, r *http.Request) {
	if len(r.URL.Path) > 1 {
		return
	}
	//update list of climate Readings
	refreshList()
	//serve template and pass climate Readings to it
	fp := filepath.Join("templates", "climateDashboard.html")
	tmpl, err := template.ParseFiles(fp)
	checkError(err)
	tmpl.Execute(w, dataList)
}

func sendClimateJSON(w http.ResponseWriter, r *http.Request) {
	refreshList()
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	json.NewEncoder(w).Encode(dataList)
}

func main() {
	initMySQL()
	defer mysqlDB.Close()

	fs := http.FileServer(http.Dir("static"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))
	http.HandleFunc("/climatereadings", sendClimateJSON)
	http.HandleFunc("/", serveTemplate)
	fmt.Println("serving at :8080")
	http.ListenAndServe(":8080", nil)
}

func checkError(err error) {
	if err != nil {
		panic(err)
	}
}
