var catMood = {
	happy: '😻',
	sad: '😿',
	ok: '😺',
	annoyed: '😾'
}


function getClimateData() {
	var url = "http://192.168.1.8:8080/data"
	fetch(url)
		.then(response => {
			if (!response.ok) {
				console.log("error fetching data")
				return
			}
			return response.json()
		})
		.then( jsonResponse => {
			console.log(jsonResponse)

			setTemp(jsonResponse[jsonResponse.length - 1].temp)
			setHumidity(jsonResponse[jsonResponse.length - 1].humidity)
			setMood()
		})
		.catch( error => {
			console.log(error)
		})
}

function setTemp(latestTemp) {
	var tempElement = document.getElementById("curr_temp")
	tempElement.innerHTML = latestTemp + "°F"
}

function setHumidity(latestHumidity) {
	var humidityEl = document.getElementById("curr_humidity")
	humidityEl.innerHTML = latestHumidity + "%"
}

function getTemp() {
	return document.getElementById("curr_temp").innerText
}

function getHumidity() {
	return document.getElementById("curr_humidity").innerText
}
function setMood() {
	let temp = parseFloat(getTemp())
	let humidity = parseFloat(getHumidity())

	var moodEl = document.getElementById("mood")
	console.log(temp + " " + humidity)
	if (temp > 83) {
		moodEl.innerHTML = catMood.sad
	} if(temp > 76 && temp < 83) {
		moodEl.innerHTML = catMood.annoyed
	} if(temp > 65 && temp < 75) {
		console.log("test")
		moodEl.innerHTML = catMood.happy
	}

	if(humidity > 60 && humidity < 70) {
		moodEl.innerHTML = catMood.annoyed
	}
	if(humidity > 70) {
		moodEl.innerHTML = catMood.sad
	}

	console.log("mood is " + moodEl.innerHTML)
}

getClimateData()