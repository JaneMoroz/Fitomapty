'use strict';

/////////////////////////////////////////////////////////////////////////
// Workout Class
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, duration) {
    this.coords = coords; // [lat, lng]
    this.duration = duration; // in min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

/////////////////////////////////////////////////////////////////////////
// Running Class
class Running extends Workout {
  type = 'running';

  constructor(coords, duration, distance, cadence) {
    super(coords, duration);
    this.distance = distance; // in km
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

/////////////////////////////////////////////////////////////////////////
// Cycling Class
class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, duration, distance, elevationGain) {
    super(coords, duration);
    this.distance = distance; // in km
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

/////////////////////////////////////////////////////////////////////////
// Yoga Class
class Yoga extends Workout {
  type = 'yoga';

  constructor(coords, duration, style) {
    super(coords, duration);
    this.style = style;
    this.calcCal();
    this._setDescription();
  }

  calcCal() {
    this.cal = this.duration * 5;
    return this.cal;
  }
}

/////////////////////////////////////////////////////////////////////////
// Exercise Class
class Exercise extends Workout {
  type = 'exercise';

  constructor(coords, duration, extype) {
    super(coords, duration);
    this.extype = extype;
    this.calcCal();
    this._setDescription();
  }

  calcCal() {
    this.cal = this.duration * 10;
    return this.cal;
  }
}

/////////////////////////////////////////////////////////////////////////
// Dom Elements
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputYogaStyle = document.querySelector('.form__input--yoga-style');
const inputExerciseType = document.querySelector('.form__input--exercise-type');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

/////////////////////////////////////////////////////////////////////////
// Application Architecture
// App Class
class App {
  // Private fields
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];

  constructor() {
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationFields);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  // Get current position
  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get position');
        }
      );
  }

  // Receive position and load the map
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handle clicks on map and show form
    this.#map.on('click', this._showForm.bind(this));
  }

  // Show form
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDuration.focus();
  }

  // Hide form
  _hideForm() {
    // Clear input fields
    // prettier-ignore
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
    // prettier-ignore
    // inputType.selectedIndex = inputYogaStyle.selectedIndex = inputExerciseType.selectedIndex = 0;

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  // Manage inputs according to sport activity type chosen
  _toggleElevationFields() {
    if (inputType.selectedIndex === 2 || inputType.selectedIndex === 3) {
      inputDistance.closest('.form__row').classList.add('form__row--hidden');
      inputElevation.closest('.form__row').classList.add('form__row--hidden');
      inputCadence.closest('.form__row').classList.add('form__row--hidden');
      if (inputType.selectedIndex === 2) {
        inputYogaStyle
          .closest('.form__row')
          .classList.remove('form__row--hidden');
        inputExerciseType
          .closest('.form__row')
          .classList.add('form__row--hidden');
      } else if (inputType.selectedIndex === 3) {
        inputYogaStyle.closest('.form__row').classList.add('form__row--hidden');
        inputExerciseType
          .closest('.form__row')
          .classList.remove('form__row--hidden');
      }
    } else if (inputType.selectedIndex === 0 || inputType.selectedIndex === 1) {
      inputDistance.closest('.form__row').classList.remove('form__row--hidden');
      inputYogaStyle.closest('.form__row').classList.add('form__row--hidden');
      inputExerciseType
        .closest('.form__row')
        .classList.add('form__row--hidden');
      if (inputType.selectedIndex === 0) {
        inputElevation.closest('.form__row').classList.add('form__row--hidden');
        inputCadence
          .closest('.form__row')
          .classList.remove('form__row--hidden');
      } else if (inputType.selectedIndex === 1) {
        inputElevation
          .closest('.form__row')
          .classList.remove('form__row--hidden');
        inputCadence.closest('.form__row').classList.add('form__row--hidden');
      }
    }
  }

  // Create a new workout
  _newWorkout(e) {
    // Helper function to validate inputs
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    // Helper function to check whether inputs are positive
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);
    // Prevent default form behavior
    e.preventDefault();

    // Get data from form
    const type = inputType.value;
    const duration = +inputDuration.value; // use + to convert value to the number
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If workout is running, create running object
    if (type === 'running') {
      const distance = +inputDistance.value;
      const cadence = +inputCadence.value;
      // Check if data is valid
      if (
        !validInputs(duration, distance, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!');

      // Create object
      workout = new Running([lat, lng], duration, distance, cadence);
    }

    // If workout is cycling, create cycling object
    if (type === 'cycling') {
      const distance = +inputDistance.value;
      const elevation = +inputElevation.value;
      // Check if data is valid
      if (
        !validInputs(duration, distance, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers!');

      // Create object
      workout = new Cycling([lat, lng], duration, distance, elevation);
    }

    // If workout is yoga, create yoga object
    if (type === 'yoga') {
      const style = inputYogaStyle.value;
      // Check if data is valid
      if (!validInputs(duration) || !allPositive(duration))
        return alert('Inputs have to be positive numbers!');

      // Create object
      workout = new Yoga([lat, lng], duration, style);
    }

    // If workout is exercise, create exercise object
    if (type === 'exercise') {
      const extype = inputExerciseType.value;
      // Check if data is valid
      if (!validInputs(duration) || !allPositive(duration))
        return alert('Inputs have to be positive numbers!');

      // Create object
      workout = new Exercise([lat, lng], duration, extype);
    }

    // Add new object to workout array
    this.#workouts.push(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    // Hide the form and clear the inputs fields
    this._hideForm();
  }

  _renderWorkoutMarker(workout) {
    // Get workout emoji
    const emoji = function (type) {
      if (type === 'running') return '🏃‍♂️';
      if (type === 'cycling') return '🚴‍♀️';
      if (type === 'yoga') return '🧘‍♀️';
      if (type === 'exercise') return '🎽';
    };

    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${emoji(workout.type)} ${workout.description}`)
      .openPopup();
  }

  _renderWorkout(workout) {
    // Get workout emoji
    const emoji = function (type) {
      if (type === 'running') return '🏃‍♂️';
      if (type === 'cycling') return '🚴‍♀️';
      if (type === 'yoga') return '🧘‍♀️';
      if (type === 'exercise') return '🎽';
    };

    // Get after emoji yogaStyle/ExType or distanse
    const afterEmoji = function (workoutAc) {
      if (workoutAc.type === 'running' || workoutAc.type === 'cycling')
        return `<span class="workout__value">${workoutAc.distance}</span>
            <span class="workout__unit">km</span>`;
      if (workoutAc.type === 'yoga')
        return `<span class="workout__value">${workoutAc.style[0].toUpperCase()}${workoutAc.style.slice(
          1
        )}</span>`;
      if (workoutAc.type === 'exercise')
        return `<span class="workout__value">${workoutAc.extype[0].toUpperCase()}${workoutAc.extype.slice(
          1
        )}</span>`;
    };

    // Generate html
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
            <h2 class="workout__title">${workout.description}</h2>
            <div class="workout__details">
              <span class="workout__icon">${emoji(workout.type)}</span>
              ${afterEmoji(workout)}
            </div>
            <div class="workout__details">
              <span class="workout__icon">⏱</span>
              <span class="workout__value">${workout.duration}</span>
              <span class="workout__unit">min</span>
            </div>
            `;
    if (workout.type === 'running')
      html += `
       <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
      `;

    if (workout.type === 'cycling')
      html += `
       <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
      `;

    if (workout.type === 'yoga' || workout.type === 'exercise')
      html += `
       <div class="workout__details">
            <span class="workout__icon">🔥</span>
            <span class="workout__value">${workout.cal}</span>
            <span class="workout__unit">cal</span>
          </div>
        </li>
      `;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
}

/////////////////////////////////////////////////////////////////////////
// Initialize App
const app = new App();
