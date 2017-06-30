package main

import (
	"database/sql"
	"html/template"

	"fmt"

	"net/http"

	"path/filepath"

	_ "github.com/go-sql-driver/mysql"
)

type ClimateReading struct {
	Temp     float32
	Humidity float32
	Time     int
	Mood     string
}

type AllData struct {
	Readings         []ClimateReading
	LatestReading    ClimateReading
	xAxisLabels      []int
	yAxislabels      []float32
	graphPointValues []int
}

var (
	dataList AllData
	mysqlDB  *sql.DB
)

func initMySQL() {
	//open mysql server
	var errDB error
	mysqlDB, errDB = sql.Open("mysql", "root:batmansql@/house_climate")
	checkError(errDB)
}

func refreshList() {
	var entry ClimateReading
	//initialize data list properly
	dataList = AllData{Readings: make([]ClimateReading, 0, []int, []float32, []int)}

	humidityRows, err := mysqlDB.Query("SELECT Humidity, Temp, Time FROM climateData")

	fmt.Printf("Sending the following: ")
	for humidityRows.Next() {

		err = humidityRows.Scan(&entry.Humidity, &entry.Temp, &entry.Time)
		checkError(err)

		// fmt.Printf("humidity: %f \t temp: %f \t time: %d \n", entry.Humidity, entry.Temp, entry.Time)
		dataList.Readings = append(dataList.Readings, entry)
	}

	dataList.LatestReading = entry
	determineMood(entry)
}

func determineMood(currConditions ClimateReading) {
	if currConditions.Temp > 83 {
		dataList.LatestReading.Mood = "😿"
	}
	if currConditions.Temp > 76 && currConditions.Temp < 83 {
		dataList.LatestReading.Mood = "😾"
	}
	if currConditions.Temp > 65 && currConditions.Temp < 76 {
		dataList.LatestReading.Mood = "😻"
	}

	if currConditions.Humidity > 60 && currConditions.Humidity < 70 {
		dataList.LatestReading.Mood = "😾"
	}
	if currConditions.Humidity > 70 {
		dataList.LatestReading.Mood = "😿"
	}

	fmt.Println(dataList.LatestReading.Mood)
}

func serveTemplate(w http.ResponseWriter, r *http.Request) {
	fmt.Println("testing")
	if len(r.URL.Path) > 1 {
		return
	}
	//update list of climate Readings
	refreshList()
	//serve template and pass climate Readings to it
	fp := filepath.Join("templates", "climateDashboard.html")
	tmpl, err := template.ParseFiles(fp)
	checkError(err)
	fmt.Println(dataList.Readings)
	tmpl.Execute(w, dataList)
}

func main() {
	initMySQL()
	defer mysqlDB.Close()

	fs := http.FileServer(http.Dir("static"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))
	http.HandleFunc("/", serveTemplate)
	fmt.Println("serving at :8080")
	http.ListenAndServe(":8080", nil)
}

func checkError(err error) {
	if err != nil {
		panic(err)
	}
}
