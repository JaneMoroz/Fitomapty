'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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
// App Class
class App {
  #map;
  #mapEvent;

  constructor() {
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationFields);
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

    this.#map = L.map('map').setView(coords, 13);

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
    e.preventDefault();
    // Clear input fields
    // prettier-ignore
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
    // prettier-ignore
    inputType.selectedIndex = inputYogaStyle.selectedIndex = inputExerciseType.selectedIndex = 0;

    // Display marker
    const { lat, lng } = this.#mapEvent.latlng;
    L.marker([lat, lng])
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: 'yoga-popup',
        })
      )
      .setPopupContent('Workout')
      .openPopup();
  }
}

/////////////////////////////////////////////////////////////////////////
// Initialize App
const app = new App();
