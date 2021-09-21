let country = "Singapore";

//Event Listeners

document.querySelector("#input")
    .addEventListener("keydown", event => event.key === "Enter" ? inputManager.submit() : '');

document.querySelector("#submit")
    .addEventListener("onclick", event => inputManager.submit());

var countryFetcher = {
    getCountry: function(countryCode) {
        return fetch("./resources/countryCode.json", {mode:'cors'})
            .then(response => response.json())
            .then(json => json[countryCode]);
    },
}


var weatherDataFetcher = {
    API_KEY :"2564496873d1c6ce509b8ab656dc3804",
    getLocationData: function(country) {
        return fetch(`https://api.openweathermap.org/data/2.5/weather?q=${country}&APPID=${this.API_KEY}`, {mode:'cors'})
        .then(response => response.json())
        .then(json => {
            if (json.cod !== "404") {
                return json;
            } else {
                throw new Error(json.message);
            }})
    },

    getUpcomingData: function(country) {
        return fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${country}&appid=${this.API_KEY}`, {mode:'cors'})
            .then(response => response.json())
            .then(json => {
                if (json.cod !== "404") {
                    return json;
                } else {
                    throw new Error(json.message);
                }})
            .catch(error => "Error");
                    
    },
}

var upcomingLogic = {
    extractUpcomingData: function(json) {
        let list = json.list;
        let indexes = [0,7,15,23,31,39];
        let forecast = [];
        for (let i = 0; i < indexes.length; i++) {
            forecast[i] = [list[indexes[i]].dt_txt 
                , list[indexes[i]].main.temp
                , list[indexes[i]].weather[0].icon];
        }
        return forecast;
    },

    updateUpcoming: function(data) {
        let main = document.querySelector('#main');
        main.removeChild(document.querySelector("#upcoming"));
        const upcoming = document.createElement('div');
        upcoming.id = "upcoming";
        main.append(upcoming);
        
        for (let i = 0; i < 5; i++) {
            let dateData = data[i];
            let day = miscFunc.convertDay(new Date(dateData[0]).getDay());
            let temp = miscFunc.kelvinToDeg(dateData[1]);
            let imgPath = `./resources/icons/${dateData[2]}.svg`;
            
            let mainNode = document.createElement('div');
            mainNode.className = "forecast";
            
            let dayNode = document.createElement('p');
            dayNode.textContent = day;
            dayNode.style.fontSize = "large";
            dayNode.style.fontWeight = "bolder";
    
            let iconNode = document.createElement('div');
            iconNode.setAttribute("display", "inline-block");
    
            let icon = document.createElement('img');
            icon.className = "icon";
            icon.height = "64";
            icon.width = "64";
            icon.setAttribute('src', imgPath);
            
            let tempNode = document.createElement('p');
            tempNode.textContent = `${temp}°C`;
            tempNode.style.fontWeight = "bold";
    
            iconNode.appendChild(icon);
            
            mainNode.appendChild(dayNode).appendChild(iconNode).appendChild(tempNode);
            upcoming.appendChild(mainNode);
        }
    }
}


 var currLogic = {
    extractCurrData: function(json) {
        let weather = json.weather[0];
        let main = json.main;
        let wind = json.wind;
        let sys = json.sys;
        let name = json.name;
        let output = [weather, main, wind, sys, name];
        return output;
    },

    updateCondition: function(data) {
        let condition = document.querySelector("#condition");
        condition.textContent = data[0].description;
    },

    updateFeelsLike: function(data) {
        let feels_like = document.querySelector("#feels_like");
        let feels_like_deg = miscFunc.kelvinToDeg(parseInt(data[1].feels_like));
        feels_like.textContent = `Feels Like: ${feels_like_deg}°C`;
        feels_like.style.fontWeight = "bold";
    },

    updateWind: function(data) {
        let wind = document.querySelector("#wind");
        wind.textContent = `Wind: ${data[2].speed}mph`;
    },

    updateHumidity: function(data) {
        let humidity = document.querySelector("#humidity");
        humidity.textContent = `Humidity: ${data[1].humidity}%`;
    },

    updateTemp: function(data) {
        let temp = document.querySelector("#temp_value");
        let tempdeg = miscFunc.kelvinToDeg(parseInt(data[1].temp));
        temp.textContent = `${tempdeg}°C`;
        temp.style.fontWeight = "bold";
    },

    updateCity: function(data) {
        let location = document.querySelector("#location");
        let city = data[4];
        location.textContent = `${city}, `;
    },
    
    updateCountry: function(data) {
        let location = document.querySelector("#location");
        let countryCodePromise = countryFetcher.getCountry(data[3].country);
        return countryCodePromise.then(countryName => {
            location.textContent += `${countryName}`;
        })
    },

    updateLocation: function(promise) {
        Promise.all([this.updateCity(promise), this.updateCountry(promise)]);
    },

    updateCurrDetails: function(currData) {
        this.updateCondition(currData);
        this.updateWind(currData);
        this.updateFeelsLike(currData);
        this.updateHumidity(currData);
        this.updateTemp(currData);
        this.updateLocation(currData);
    }
}

var inputManager = {
    displaySearchError: function() {
        error = document.querySelector("#error");
        error.textContent = "Please input a valid city name.";
    },

    hideSearchError: function() {
        error = document.querySelector("#error");
        error.textContent = "";
    },

    submit: function() {
        event.preventDefault();
        let inputForm = document.querySelector("input");
        let country = inputForm.value;
        inputForm.value = '';
        return mainWeatherApp.render(country);
    }
}

var miscFunc = {
    kelvinToDeg: function(tempKelvin) {
        return (tempKelvin - 273.15).toFixed(0);
    },
    convertDay: function(dayId) {
        switch (dayId) {
            case 0: return "Sunday";
            case 1: return "Monday";
            case 2: return "Tuesday";
            case 3: return "Wednesday";
            case 4: return "Thursday";
            case 5: return "Friday";
            case 6: return "Saturday";
        }
    }
}


var mainWeatherApp = {
    render: function(country) {
        const currjson = weatherDataFetcher.getLocationData(country);
        const currAsync = currjson.then(json => currLogic.extractCurrData(json))
            .then(data => {
                console.log(data);
                currLogic.updateCurrDetails(data);
            })
            .catch(error => inputManager.displaySearchError());
        
        
        const upcomingjson = weatherDataFetcher.getUpcomingData(country);
        const upcomingAsync = upcomingjson.then(json => upcomingLogic.extractUpcomingData(json))
            .then(data => 
                {   
                    inputManager.hideSearchError();
                    return upcomingLogic.updateUpcoming(data);
                })
            .catch(error => inputManager.displaySearchError());
        
        
                Promise.all(currAsync, upcomingAsync).catch(error => console.log(error));
    }
}

mainWeatherApp.render("Singapore");



